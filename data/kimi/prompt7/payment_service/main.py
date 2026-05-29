"""Main FastAPI application for the payment service."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Header, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from .config import settings
from .models import ChargeRequest, RefundRequest, PaymentProvider
from .service import payment_service


# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting Payment API Service")
    logger.info(f"Configured providers: {[p.value for p in payment_service.get_available_providers()]}")
    yield
    # Shutdown
    logger.info("Shutting down Payment API Service")


app = FastAPI(
    title="Payment API Integration Service",
    description="Secure payment processing with multiple provider support",
    version="1.0.0",
    lifespan=lifespan
)


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    providers: dict
    version: str = "1.0.0"


class WebhookResponse(BaseModel):
    """Webhook response model."""
    success: bool
    message: str


def verify_api_key(request: Request):
    """Verify API key in request header.
    
    In production, implement proper API key validation.
    This is a placeholder for the security layer.
    """
    api_key = request.headers.get("X-API-Key")
    # Add your API key validation logic here
    # For now, we accept any key or check against settings
    return True


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    providers_health = payment_service.health_check()
    
    all_healthy = all(
        status.get("healthy", False) 
        for status in providers_health.values()
    )
    
    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        providers=providers_health
    )


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Payment API Integration Service",
        "version": "1.0.0",
        "providers": [p.value for p in payment_service.get_available_providers()],
        "documentation": "/docs"
    }


@app.post("/payments/charge")
async def create_charge(
    request: ChargeRequest,
    api_key: bool = Depends(verify_api_key)
):
    """Create a new payment charge.
    
    - **amount**: Payment amount (must be > 0)
    - **currency**: Currency code (USD, EUR, etc.)
    - **provider**: Payment provider (stripe, paypal)
    - **payment_token**: Token from payment method (from frontend SDK)
    - **customer**: Optional customer information
    - **description**: Optional payment description
    - **metadata**: Optional key-value pairs for tracking
    """
    try:
        result = await payment_service.charge(request)
        
        if result.error_message:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Payment failed",
                    "message": result.error_message,
                    "payment_id": result.id
                }
            )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/payments/refund")
async def create_refund(
    request: RefundRequest,
    api_key: bool = Depends(verify_api_key)
):
    """Refund an existing payment.
    
    - **payment_id**: The original payment ID to refund
    - **amount**: Optional refund amount (omits for full refund)
    - **reason**: Optional refund reason
    """
    try:
        result = await payment_service.refund(request)
        return result
        
    except NotImplementedError as e:
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        logger.error(f"Refund error: {e}")
        raise HTTPException(status_code=500, detail="Refund failed")


@app.get("/payments/{payment_id}")
async def get_payment(
    payment_id: str,
    provider: PaymentProvider = PaymentProvider.STRIPE,
    api_key: bool = Depends(verify_api_key)
):
    """Get payment details by ID.
    
    - **payment_id**: The payment ID to look up
    - **provider**: The payment provider used
    """
    try:
        result = await payment_service.get_payment(payment_id, provider)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Get payment error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve payment")


@app.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """Handle Stripe webhooks.
    
    Processes async payment events from Stripe.
    """
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=501, detail="Stripe webhooks not configured")
    
    try:
        payload = await request.body()
        provider = payment_service.get_provider(PaymentProvider.STRIPE)
        
        # Verify webhook signature
        is_valid = await provider.verify_webhook(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
        
        if not is_valid:
            logger.warning("Invalid Stripe webhook signature")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse and process webhook
        event = await provider.parse_webhook(payload)
        logger.info(f"Received Stripe webhook: {event.event_type}")
        
        # TODO: Process the webhook event (update database, send notifications, etc.)
        # For example:
        # - payment_intent.succeeded -> Mark order as paid
        # - payment_intent.payment_failed -> Mark order as failed
        # - charge.refunded -> Process refund in your system
        
        return WebhookResponse(
            success=True,
            message=f"Processed {event.event_type}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@app.post("/webhooks/paypal")
async def paypal_webhook(
    request: Request,
    paypal_auth_algo: str = Header(None, alias="PayPal-Auth-Algo"),
    paypal_cert_url: str = Header(None, alias="PayPal-Cert-Url"),
    paypal_transmission_id: str = Header(None, alias="PayPal-Transmission-Id"),
    paypal_transmission_sig: str = Header(None, alias="PayPal-Transmission-Sig"),
    paypal_transmission_time: str = Header(None, alias="PayPal-Transmission-Time")
):
    """Handle PayPal webhooks.
    
    Processes async payment events from PayPal.
    """
    if not settings.paypal_client_id:
        raise HTTPException(status_code=501, detail="PayPal webhooks not configured")
    
    try:
        payload = await request.body()
        provider = payment_service.get_provider(PaymentProvider.PAYPAL)
        
        # Verify webhook (PayPal uses certificate-based verification)
        is_valid = await provider.verify_webhook(
            payload, paypal_transmission_sig or "", ""
        )
        
        if not is_valid:
            logger.warning("Invalid PayPal webhook")
            raise HTTPException(status_code=400, detail="Invalid webhook")
        
        # Parse and process webhook
        event = await provider.parse_webhook(payload)
        logger.info(f"Received PayPal webhook: {event.event_type}")
        
        # TODO: Process the webhook event
        # For example:
        # - CHECKOUT.ORDER.APPROVED -> Capture payment
        # - CHECKOUT.ORDER.COMPLETED -> Mark order as paid
        # - PAYMENT.CAPTURE.REFUNDED -> Process refund
        
        return WebhookResponse(
            success=True,
            message=f"Processed {event.event_type}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PayPal webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@app.get("/providers")
async def list_providers():
    """List available payment providers."""
    providers = []
    
    for provider_type in payment_service.get_available_providers():
        provider = payment_service.get_provider(provider_type)
        health = provider.health_check()
        
        providers.append({
            "name": provider_type.value,
            "enabled": True,
            "healthy": health.get("healthy", False),
            "status": health.get("status", "unknown")
        })
    
    return {"providers": providers}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
