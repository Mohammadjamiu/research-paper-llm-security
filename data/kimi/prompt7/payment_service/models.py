"""Payment models and schemas."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field, ConfigDict


class PaymentProvider(str, Enum):
    """Supported payment providers."""
    STRIPE = "stripe"
    PAYPAL = "paypal"


class PaymentStatus(str, Enum):
    """Payment status states."""
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class Currency(str, Enum):
    """Supported currencies (ISO 4217)."""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    JPY = "JPY"
    CAD = "CAD"
    AUD = "AUD"


class PaymentMethod(str, Enum):
    """Payment method types."""
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    PAYPAL = "paypal"
    APPLE_PAY = "apple_pay"
    GOOGLE_PAY = "google_pay"


class Address(BaseModel):
    """Customer address model."""
    model_config = ConfigDict(extra="allow")
    
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = Field(default=None, max_length=2)


class Customer(BaseModel):
    """Customer information model."""
    model_config = ConfigDict(extra="allow")
    
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[Address] = None


class ChargeRequest(BaseModel):
    """Request model for creating a payment charge."""
    model_config = ConfigDict(extra="allow")
    
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: Currency = Field(default=Currency.USD)
    provider: PaymentProvider = Field(default=PaymentProvider.STRIPE)
    payment_method: PaymentMethod = Field(default=PaymentMethod.CARD)
    payment_token: str = Field(..., description="Payment method token from frontend")
    customer: Optional[Customer] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RefundRequest(BaseModel):
    """Request model for refunding a payment."""
    model_config = ConfigDict(extra="allow")
    
    payment_id: str = Field(..., description="Original payment ID to refund")
    amount: Optional[Decimal] = Field(None, gt=0, description="Refund amount (omit for full refund)")
    reason: Optional[str] = None


class PaymentResponse(BaseModel):
    """Response model for payment operations."""
    model_config = ConfigDict(extra="allow")
    
    id: str = Field(..., description="Payment ID")
    provider: PaymentProvider
    status: PaymentStatus
    amount: Decimal
    currency: Currency
    payment_method: PaymentMethod
    customer_email: Optional[str] = None
    description: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    provider_transaction_id: Optional[str] = None
    receipt_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    error_message: Optional[str] = None


class PaymentQuery(BaseModel):
    """Query parameters for fetching payments."""
    provider: Optional[PaymentProvider] = None
    status: Optional[PaymentStatus] = None
    customer_email: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class WebhookEvent(BaseModel):
    """Webhook event model."""
    model_config = ConfigDict(extra="allow")
    
    id: str
    provider: PaymentProvider
    event_type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    signature: Optional[str] = None
