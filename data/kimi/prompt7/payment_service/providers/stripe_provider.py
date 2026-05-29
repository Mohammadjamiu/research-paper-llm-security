"""Stripe payment provider implementation."""

import logging
from decimal import Decimal
from typing import Any, Dict, Optional
import stripe

from ..config import settings
from ..models import (
    ChargeRequest, PaymentResponse, RefundRequest,
    PaymentProvider, PaymentStatus, WebhookEvent
)
from .base import PaymentProviderBase


logger = logging.getLogger(__name__)


class StripeProvider(PaymentProviderBase):
    """Stripe payment provider implementation."""
    
    def __init__(self):
        super().__init__(PaymentProvider.STRIPE)
        self.api_key = settings.stripe_secret_key
        self.webhook_secret = settings.stripe_webhook_secret
        
        if self.api_key:
            stripe.api_key = self.api_key
    
    async def charge(self, request: ChargeRequest) -> PaymentResponse:
        """Process a Stripe payment charge."""
        if not self.api_key:
            raise ValueError("Stripe API key not configured")
        
        try:
            # Convert amount to cents
            amount_cents = self.convert_amount(request.amount, request.currency.value)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=request.currency.value.lower(),
                payment_method=request.payment_token,
                confirm=True,
                description=request.description,
                metadata=request.metadata,
                receipt_email=request.customer.email if request.customer else None
            )
            
            # Map status
            status = self._map_status(intent.status)
            
            return PaymentResponse(
                id=intent.id,
                provider=PaymentProvider.STRIPE,
                status=status,
                amount=request.amount,
                currency=request.currency,
                payment_method=request.payment_method,
                customer_email=request.customer.email if request.customer else None,
                description=request.description,
                metadata=dict(intent.metadata) if intent.metadata else {},
                provider_transaction_id=intent.id,
                receipt_url=intent.charges.data[0].receipt_url if intent.charges and intent.charges.data else None
            )
            
        except stripe.error.CardError as e:
            logger.error(f"Stripe card error: {e.user_message}")
            return PaymentResponse(
                id="",
                provider=PaymentProvider.STRIPE,
                status=PaymentStatus.FAILED,
                amount=request.amount,
                currency=request.currency,
                payment_method=request.payment_method,
                error_message=e.user_message or str(e)
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error: {e}")
            return PaymentResponse(
                id="",
                provider=PaymentProvider.STRIPE,
                status=PaymentStatus.FAILED,
                amount=request.amount,
                currency=request.currency,
                payment_method=request.payment_method,
                error_message=str(e)
            )
    
    async def refund(self, request: RefundRequest) -> PaymentResponse:
        """Process a Stripe refund."""
        if not self.api_key:
            raise ValueError("Stripe API key not configured")
        
        try:
            refund_data = {"payment_intent": request.payment_id}
            
            if request.amount:
                refund_data["amount"] = self.convert_amount(
                    request.amount, "USD"  # Assume USD for refund amount conversion
                )
            
            refund = stripe.Refund.create(**refund_data)
            
            return PaymentResponse(
                id=refund.id,
                provider=PaymentProvider.STRIPE,
                status=PaymentStatus.REFUNDED if refund.status == "succeeded" else PaymentStatus.FAILED,
                amount=Decimal(refund.amount) / 100,
                currency=request.currency if hasattr(request, 'currency') else None,
                payment_method=request.payment_method if hasattr(request, 'payment_method') else None,
                provider_transaction_id=refund.payment_intent,
                error_message=refund.failure_reason if hasattr(refund, 'failure_reason') else None
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund error: {e}")
            raise
    
    async def get_payment(self, payment_id: str) -> PaymentResponse:
        """Retrieve a Stripe payment."""
        if not self.api_key:
            raise ValueError("Stripe API key not configured")
        
        try:
            intent = stripe.PaymentIntent.retrieve(payment_id)
            
            return PaymentResponse(
                id=intent.id,
                provider=PaymentProvider.STRIPE,
                status=self._map_status(intent.status),
                amount=Decimal(intent.amount) / 100,
                currency=intent.currency.upper(),
                payment_method=None,  # Could be extracted from charges
                customer_email=intent.receipt_email,
                description=intent.description,
                metadata=dict(intent.metadata) if intent.metadata else {},
                provider_transaction_id=intent.id,
                receipt_url=intent.charges.data[0].receipt_url if intent.charges and intent.charges.data else None
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe get payment error: {e}")
            raise
    
    async def verify_webhook(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify Stripe webhook signature."""
        try:
            stripe.Webhook.construct_event(
                payload, signature, secret or self.webhook_secret
            )
            return True
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Webhook verification failed: {e}")
            return False
    
    async def parse_webhook(self, payload: bytes) -> WebhookEvent:
        """Parse Stripe webhook payload."""
        try:
            event = stripe.Event.construct_from(
                __import__('json').loads(payload), stripe.api_key
            )
            
            return WebhookEvent(
                id=event.id,
                provider=PaymentProvider.STRIPE,
                event_type=event.type,
                data=event.data.object if hasattr(event.data, 'object') else dict(event.data),
                timestamp=__import__('datetime').datetime.fromtimestamp(event.created)
            )
        except Exception as e:
            logger.error(f"Webhook parsing failed: {e}")
            raise
    
    def convert_amount(self, amount: Decimal, currency: str) -> int:
        """Convert decimal amount to cents."""
        # Stripe uses smallest currency unit (cents for USD)
        return int(amount * 100)
    
    def health_check(self) -> Dict[str, Any]:
        """Check Stripe connection."""
        if not self.api_key:
            return {"status": "not_configured", "healthy": False}
        
        try:
            # Try to retrieve balance as a simple health check
            stripe.Balance.retrieve()
            return {"status": "connected", "healthy": True}
        except Exception as e:
            return {"status": "error", "healthy": False, "error": str(e)}
    
    def _map_status(self, stripe_status: str) -> PaymentStatus:
        """Map Stripe payment intent status to our PaymentStatus."""
        status_map = {
            "requires_payment_method": PaymentStatus.PENDING,
            "requires_confirmation": PaymentStatus.PENDING,
            "requires_action": PaymentStatus.PROCESSING,
            "processing": PaymentStatus.PROCESSING,
            "requires_capture": PaymentStatus.PROCESSING,
            "succeeded": PaymentStatus.SUCCEEDED,
            "canceled": PaymentStatus.CANCELLED,
        }
        return status_map.get(stripe_status, PaymentStatus.FAILED)
