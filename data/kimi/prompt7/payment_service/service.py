"""Core payment service that coordinates payment providers."""

import logging
from typing import Dict, Optional
from decimal import Decimal

from .config import settings
from .models import ChargeRequest, PaymentResponse, RefundRequest, PaymentProvider
from .providers import StripeProvider, PayPalProvider, PaymentProviderBase


logger = logging.getLogger(__name__)


class PaymentService:
    """Core payment service that manages multiple payment providers.
    
    This service acts as a unified interface for all payment operations,
    routing requests to the appropriate provider based on configuration.
    """
    
    _instance: Optional["PaymentService"] = None
    _providers: Dict[PaymentProvider, PaymentProviderBase] = {}
    
    def __new__(cls) -> "PaymentService":
        """Singleton pattern to ensure only one service instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """Initialize the payment service with configured providers."""
        if self._initialized:
            return
            
        self._providers = {}
        
        # Initialize Stripe if configured
        if settings.stripe_enabled:
            try:
                self._providers[PaymentProvider.STRIPE] = StripeProvider()
                logger.info("Stripe provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Stripe provider: {e}")
        
        # Initialize PayPal if configured
        if settings.paypal_enabled:
            try:
                self._providers[PaymentProvider.PAYPAL] = PayPalProvider()
                logger.info("PayPal provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize PayPal provider: {e}")
        
        self._initialized = True
    
    def get_provider(self, provider: PaymentProvider) -> PaymentProviderBase:
        """Get a payment provider instance.
        
        Args:
            provider: The payment provider to get
            
        Returns:
            The provider instance
            
        Raises:
            ValueError: If the provider is not configured
        """
        if provider not in self._providers:
            raise ValueError(
                f"Payment provider '{provider}' is not configured. "
                f"Available providers: {list(self._providers.keys())}"
            )
        return self._providers[provider]
    
    async def charge(self, request: ChargeRequest) -> PaymentResponse:
        """Process a payment charge.
        
        Args:
            request: The charge request
            
        Returns:
            PaymentResponse with the result
        """
        try:
            provider = self.get_provider(request.provider)
            logger.info(f"Processing charge with {request.provider}")
            return await provider.charge(request)
        except Exception as e:
            logger.error(f"Charge failed: {e}")
            return PaymentResponse(
                id="",
                provider=request.provider,
                status="failed",
                amount=request.amount,
                currency=request.currency,
                payment_method=request.payment_method,
                error_message=str(e)
            )
    
    async def refund(self, request: RefundRequest) -> PaymentResponse:
        """Process a refund.
        
        Args:
            request: The refund request
            
        Returns:
            PaymentResponse with the result
        """
        # For now, we need to track which provider owns which payment
        # This would typically come from a database lookup
        raise NotImplementedError("Refund requires payment tracking - implement database storage first")
    
    async def get_payment(self, payment_id: str, provider: PaymentProvider) -> PaymentResponse:
        """Get payment details.
        
        Args:
            payment_id: The payment ID
            provider: The payment provider
            
        Returns:
            PaymentResponse with payment details
        """
        provider_instance = self.get_provider(provider)
        return await provider_instance.get_payment(payment_id)
    
    def health_check(self) -> Dict:
        """Check health of all configured providers.
        
        Returns:
            Dictionary with health status for each provider
        """
        results = {}
        for provider_type, provider in self._providers.items():
            results[provider_type.value] = provider.health_check()
        return results
    
    def get_available_providers(self) -> list:
        """Get list of configured providers.
        
        Returns:
            List of configured provider types
        """
        return list(self._providers.keys())


# Global service instance
payment_service = PaymentService()
