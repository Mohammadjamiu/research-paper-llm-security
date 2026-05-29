"""Tests for the payment service."""

import pytest
from decimal import Decimal
from unittest.mock import Mock, patch, AsyncMock

from payment_service.models import (
    ChargeRequest, RefundRequest, PaymentProvider, 
    PaymentStatus, Currency, PaymentMethod, Customer
)
from payment_service.service import PaymentService
from payment_service.config import Settings


class TestPaymentModels:
    """Test payment model validation."""
    
    def test_charge_request_validation(self):
        """Test charge request validation."""
        request = ChargeRequest(
            amount=Decimal("99.99"),
            currency=Currency.USD,
            provider=PaymentProvider.STRIPE,
            payment_token="tok_test",
            customer=Customer(email="test@example.com", name="Test User")
        )
        
        assert request.amount == Decimal("99.99")
        assert request.currency == Currency.USD
        assert request.provider == PaymentProvider.STRIPE
        assert request.customer.email == "test@example.com"
    
    def test_charge_request_amount_must_be_positive(self):
        """Test that amount must be positive."""
        with pytest.raises(Exception):
            ChargeRequest(
                amount=Decimal("-10.00"),
                payment_token="tok_test"
            )
    
    def test_refund_request_validation(self):
        """Test refund request validation."""
        request = RefundRequest(
            payment_id="pay_123",
            amount=Decimal("50.00"),
            reason="Customer request"
        )
        
        assert request.payment_id == "pay_123"
        assert request.amount == Decimal("50.00")
        assert request.reason == "Customer request"


class TestConfiguration:
    """Test configuration loading."""
    
    def test_settings_defaults(self):
        """Test default settings values."""
        settings = Settings()
        
        assert settings.api_host == "0.0.0.0"
        assert settings.api_port == 8000
        assert settings.debug == False
        assert settings.log_level == "INFO"
    
    def test_stripe_enabled_without_keys(self):
        """Test that Stripe is not enabled without keys."""
        settings = Settings(
            stripe_secret_key=None,
            stripe_publishable_key=None
        )
        
        assert settings.stripe_enabled == False
    
    def test_stripe_enabled_with_keys(self):
        """Test that Stripe is enabled with keys."""
        settings = Settings(
            stripe_secret_key="sk_test_123",
            stripe_publishable_key="pk_test_123"
        )
        
        assert settings.stripe_enabled == True


class TestPaymentService:
    """Test payment service operations."""
    
    @pytest.fixture
    def service(self):
        """Create a fresh payment service instance."""
        # Reset singleton
        PaymentService._instance = None
        PaymentService._providers = {}
        
        with patch("payment_service.service.settings") as mock_settings:
            mock_settings.stripe_enabled = False
            mock_settings.paypal_enabled = False
            yield PaymentService()
    
    def test_service_singleton(self, service):
        """Test that service is a singleton."""
        service2 = PaymentService()
        assert service is service2
    
    def test_get_unconfigured_provider(self, service):
        """Test getting an unconfigured provider raises error."""
        with pytest.raises(ValueError) as exc_info:
            service.get_provider(PaymentProvider.STRIPE)
        
        assert "not configured" in str(exc_info.value)
    
    @pytest.mark.asyncio
    async def test_charge_with_unconfigured_provider(self, service):
        """Test charge with unconfigured provider."""
        request = ChargeRequest(
            amount=Decimal("10.00"),
            provider=PaymentProvider.STRIPE,
            payment_token="tok_test"
        )
        
        result = await service.charge(request)
        
        assert result.status == PaymentStatus.FAILED
        assert "not configured" in result.error_message.lower()


class TestStripeProvider:
    """Test Stripe provider implementation."""
    
    @pytest.fixture
    def mock_stripe(self):
        """Mock Stripe SDK."""
        with patch("payment_service.providers.stripe_provider.stripe") as mock:
            yield mock
    
    @pytest.fixture
    def stripe_provider(self, mock_stripe):
        """Create Stripe provider with mocked settings."""
        with patch("payment_service.providers.stripe_provider.settings") as mock_settings:
            mock_settings.stripe_secret_key = "sk_test_123"
            mock_settings.stripe_webhook_secret = "whsec_123"
            mock_settings.stripe_publishable_key = "pk_test_123"
            
            from payment_service.providers.stripe_provider import StripeProvider
            provider = StripeProvider()
            yield provider
    
    @pytest.mark.asyncio
    async def test_stripe_charge_success(self, stripe_provider, mock_stripe):
        """Test successful Stripe charge."""
        # Mock PaymentIntent.create
        mock_intent = Mock()
        mock_intent.id = "pi_123"
        mock_intent.status = "succeeded"
        mock_intent.amount = 1000
        mock_intent.currency = "usd"
        mock_intent.description = "Test payment"
        mock_intent.receipt_email = "test@example.com"
        mock_intent.metadata = {"order_id": "123"}
        mock_intent.charges = Mock()
        mock_intent.charges.data = [Mock(receipt_url="https://receipt.url")]
        
        mock_stripe.PaymentIntent.create.return_value = mock_intent
        
        request = ChargeRequest(
            amount=Decimal("10.00"),
            currency=Currency.USD,
            payment_token="tok_test",
            description="Test payment"
        )
        
        result = await stripe_provider.charge(request)
        
        assert result.status == PaymentStatus.SUCCEEDED
        assert result.id == "pi_123"
        assert result.amount == Decimal("10.00")
    
    @pytest.mark.asyncio
    async def test_stripe_charge_card_error(self, stripe_provider, mock_stripe):
        """Test Stripe charge with card error."""
        from stripe.error import CardError
        
        mock_stripe.PaymentIntent.create.side_effect = CardError(
            message="Card declined",
            param="",
            code="card_declined",
            json_body={"error": {"message": "Your card was declined"}}
        )
        
        request = ChargeRequest(
            amount=Decimal("10.00"),
            payment_token="tok_test"
        )
        
        result = await stripe_provider.charge(request)
        
        assert result.status == PaymentStatus.FAILED
        assert result.error_message is not None


class TestPayPalProvider:
    """Test PayPal provider implementation."""
    
    @pytest.fixture
    def paypal_provider(self):
        """Create PayPal provider with mocked settings."""
        with patch("payment_service.providers.paypal_provider.settings") as mock_settings:
            mock_settings.paypal_client_id = "client_123"
            mock_settings.paypal_client_secret = "secret_123"
            mock_settings.paypal_mode = "sandbox"
            
            from payment_service.providers.paypal_provider import PayPalProvider
            provider = PayPalProvider()
            yield provider
    
    @pytest.mark.asyncio
    async def test_paypal_health_check_not_configured(self):
        """Test PayPal health check when not configured."""
        with patch("payment_service.providers.paypal_provider.settings") as mock_settings:
            mock_settings.paypal_client_id = None
            mock_settings.paypal_client_secret = None
            
            from payment_service.providers.paypal_provider import PayPalProvider
            provider = PayPalProvider()
            
            health = provider.health_check()
            
            assert health["healthy"] == False
            assert health["status"] == "not_configured"


class TestEnvironmentVariables:
    """Test environment variable security."""
    
    def test_secrets_not_exposed_in_settings_repr(self):
        """Test that secrets are not exposed in settings representation."""
        settings = Settings(
            stripe_secret_key="sk_live_secret123",
            paypal_client_secret="secret456"
        )
        
        settings_str = str(settings)
        
        # Secrets should not appear in string representation
        assert "sk_live_secret123" not in settings_str
        assert "secret456" not in settings_str
    
    def test_config_from_env_file(self, tmp_path):
        """Test loading configuration from .env file."""
        env_file = tmp_path / ".env"
        env_file.write_text("""
STRIPE_SECRET_KEY=sk_test_from_file
API_PORT=9000
LOG_LEVEL=DEBUG
""")
        
        settings = Settings(_env_file=str(env_file))
        
        assert settings.stripe_secret_key == "sk_test_from_file"
        assert settings.api_port == 9000
        assert settings.log_level == "DEBUG"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
