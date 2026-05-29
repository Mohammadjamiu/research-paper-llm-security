"""Abstract base class for payment providers."""

from abc import ABC, abstractmethod
from typing import Any, Dict
from decimal import Decimal

from ..models import ChargeRequest, PaymentResponse, RefundRequest, PaymentProvider, WebhookEvent


class PaymentProviderBase(ABC):
    """Abstract base class for payment provider implementations.
    
    All payment provider integrations must inherit from this class
    and implement the required methods.
    """
    
    def __init__(self, provider_type: PaymentProvider):
        self.provider_type = provider_type
    
    @abstractmethod
    async def charge(self, request: ChargeRequest) -> PaymentResponse:
        """Process a payment charge.
        
        Args:
            request: The charge request containing payment details
            
        Returns:
            PaymentResponse with the result of the charge operation
        """
        pass
    
    @abstractmethod
    async def refund(self, request: RefundRequest) -> PaymentResponse:
        """Process a refund for an existing payment.
        
        Args:
            request: The refund request containing payment ID and amount
            
        Returns:
            PaymentResponse with the result of the refund operation
        """
        pass
    
    @abstractmethod
    async def get_payment(self, payment_id: str) -> PaymentResponse:
        """Retrieve payment details by ID.
        
        Args:
            payment_id: The payment ID to look up
            
        Returns:
            PaymentResponse with the payment details
        """
        pass
    
    @abstractmethod
    async def verify_webhook(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify webhook signature authenticity.
        
        Args:
            payload: Raw webhook payload bytes
            signature: Webhook signature from header
            secret: Webhook secret for verification
            
        Returns:
            True if signature is valid, False otherwise
        """
        pass
    
    @abstractmethod
    async def parse_webhook(self, payload: bytes) -> WebhookEvent:
        """Parse webhook payload into a WebhookEvent.
        
        Args:
            payload: Raw webhook payload bytes
            
        Returns:
            Parsed WebhookEvent
        """
        pass
    
    @abstractmethod
    def convert_amount(self, amount: Decimal, currency: str) -> int:
        """Convert decimal amount to provider's smallest currency unit.
        
        Args:
            amount: Decimal amount
            currency: Currency code
            
        Returns:
            Amount in smallest currency unit (e.g., cents)
        """
        pass
    
    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Check provider health/connection status.
        
        Returns:
            Dictionary with health status information
        """
        pass
