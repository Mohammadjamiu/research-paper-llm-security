"""PayPal payment provider implementation."""

import logging
import base64
from decimal import Decimal
from typing import Any, Dict
import httpx

from ..config import settings
from ..models import (
    ChargeRequest, PaymentResponse, RefundRequest,
    PaymentProvider, PaymentStatus, WebhookEvent
)
from .base import PaymentProviderBase


logger = logging.getLogger(__name__)


class PayPalProvider(PaymentProviderBase):
    """PayPal payment provider implementation."""
    
    def __init__(self):
        super().__init__(PaymentProvider.PAYPAL)
        self.client_id = settings.paypal_client_id
        self.client_secret = settings.paypal_client_secret
        self.mode = settings.paypal_mode
        
        # Set API base URL based on mode
        if self.mode == "live":
            self.api_base = "https://api.paypal.com"
        else:
            self.api_base = "https://api.sandbox.paypal.com"
    
    async def _get_access_token(self) -> str:
        """Get PayPal OAuth access token."""
        if not self.client_id or not self.client_secret:
            raise ValueError("PayPal credentials not configured")
        
        credentials = base64.b64encode(
            f"{self.client_id}:{self.client_secret}".encode()
        ).decode()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data={"grant_type": "client_credentials"}
            )
            response.raise_for_status()
            return response.json()["access_token"]
    
    async def charge(self, request: ChargeRequest) -> PaymentResponse:
        """Process a PayPal payment."""
        try:
            access_token = await self._get_access_token()
            
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": request.currency.value,
                        "value": str(request.amount)
                    },
                    "description": request.description or "Payment",
                    "custom_id": request.metadata.get("order_id", "")
                }],
                "payment_source": {
                    "token": {
                        "id": request.payment_token,
                        "type": "PAYPAL"
                    }
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/v2/checkout/orders",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "PayPal-Request-Id": request.metadata.get("idempotency_key", "")
                    },
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                
                return PaymentResponse(
                    id=data["id"],
                    provider=PaymentProvider.PAYPAL,
                    status=self._map_status(data["status"]),
                    amount=request.amount,
                    currency=request.currency,
                    payment_method=request.payment_method,
                    customer_email=request.customer.email if request.customer else None,
                    description=request.description,
                    metadata=request.metadata,
                    provider_transaction_id=data["id"]
                )
                
        except httpx.HTTPError as e:
            logger.error(f"PayPal charge error: {e}")
            return PaymentResponse(
                id="",
                provider=PaymentProvider.PAYPAL,
                status=PaymentStatus.FAILED,
                amount=request.amount,
                currency=request.currency,
                payment_method=request.payment_method,
                error_message=str(e)
            )
    
    async def refund(self, request: RefundRequest) -> PaymentResponse:
        """Process a PayPal refund."""
        try:
            access_token = await self._get_access_token()
            
            payload = {}
            if request.amount:
                payload["amount"] = {
                    "currency_code": "USD",  # Should be extracted from original payment
                    "value": str(request.amount)
                }
            
            if request.reason:
                payload["note_to_payer"] = request.reason
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/v2/payments/captures/{request.payment_id}/refund",
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                        "PayPal-Request-Id": f"refund_{request.payment_id}"
                    },
                    json=payload if payload else None
                )
                response.raise_for_status()
                data = response.json()
                
                return PaymentResponse(
                    id=data["id"],
                    provider=PaymentProvider.PAYPAL,
                    status=PaymentStatus.REFUNDED if data["status"] == "COMPLETED" else PaymentStatus.FAILED,
                    amount=Decimal(data["amount"]["value"]),
                    currency=data["amount"]["currency_code"],
                    payment_method=None,
                    provider_transaction_id=request.payment_id
                )
                
        except httpx.HTTPError as e:
            logger.error(f"PayPal refund error: {e}")
            raise
    
    async def get_payment(self, payment_id: str) -> PaymentResponse:
        """Retrieve a PayPal payment."""
        try:
            access_token = await self._get_access_token()
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.api_base}/v2/checkout/orders/{payment_id}",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                response.raise_for_status()
                data = response.json()
                
                purchase_unit = data["purchase_units"][0] if data.get("purchase_units") else {}
                amount = purchase_unit.get("amount", {})
                
                return PaymentResponse(
                    id=data["id"],
                    provider=PaymentProvider.PAYPAL,
                    status=self._map_status(data["status"]),
                    amount=Decimal(amount.get("value", 0)),
                    currency=amount.get("currency_code", "USD"),
                    payment_method=None,
                    description=purchase_unit.get("description"),
                    provider_transaction_id=data["id"]
                )
                
        except httpx.HTTPError as e:
            logger.error(f"PayPal get payment error: {e}")
            raise
    
    async def verify_webhook(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify PayPal webhook signature."""
        # PayPal webhook verification requires certificate-based validation
        # This is a simplified placeholder
        # In production, use PayPal's SDK or verify certificate chain
        logger.warning("PayPal webhook verification not fully implemented")
        return True
    
    async def parse_webhook(self, payload: bytes) -> WebhookEvent:
        """Parse PayPal webhook payload."""
        import json
        from datetime import datetime
        
        data = json.loads(payload)
        
        resource_type = data.get("resource_type", "")
        event_type = data.get("event_type", "")
        resource = data.get("resource", {})
        
        return WebhookEvent(
            id=data.get("id", ""),
            provider=PaymentProvider.PAYPAL,
            event_type=f"{resource_type}.{event_type}",
            data=resource,
            timestamp=datetime.fromisoformat(data.get("create_time", datetime.utcnow().isoformat()).replace("Z", "+00:00"))
        )
    
    def convert_amount(self, amount: Decimal, currency: str) -> int:
        """PayPal uses decimal amounts directly."""
        return int(amount)
    
    def health_check(self) -> Dict[str, Any]:
        """Check PayPal connection."""
        if not self.client_id or not self.client_secret:
            return {"status": "not_configured", "healthy": False}
        
        try:
            # Try to get access token as health check
            import asyncio
            asyncio.run(self._get_access_token())
            return {"status": "connected", "healthy": True}
        except Exception as e:
            return {"status": "error", "healthy": False, "error": str(e)}
    
    def _map_status(self, paypal_status: str) -> PaymentStatus:
        """Map PayPal status to our PaymentStatus."""
        status_map = {
            "CREATED": PaymentStatus.PENDING,
            "SAVED": PaymentStatus.PENDING,
            "APPROVED": PaymentStatus.PROCESSING,
            "VOIDED": PaymentStatus.CANCELLED,
            "COMPLETED": PaymentStatus.SUCCEEDED,
            "PAYER_ACTION_REQUIRED": PaymentStatus.PENDING,
        }
        return status_map.get(paypal_status, PaymentStatus.FAILED)
