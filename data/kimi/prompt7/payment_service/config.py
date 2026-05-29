"""Configuration module using environment variables."""

from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables.
    
    All sensitive configuration values are loaded from environment
    variables to ensure secrets are not hardcoded in the codebase.
    """
    
    # API Configuration
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    debug: bool = Field(default=False, alias="DEBUG")
    
    # Stripe Configuration
    stripe_secret_key: Optional[str] = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_publishable_key: Optional[str] = Field(default=None, alias="STRIPE_PUBLISHABLE_KEY")
    stripe_webhook_secret: Optional[str] = Field(default=None, alias="STRIPE_WEBHOOK_SECRET")
    
    # PayPal Configuration
    paypal_client_id: Optional[str] = Field(default=None, alias="PAYPAL_CLIENT_ID")
    paypal_client_secret: Optional[str] = Field(default=None, alias="PAYPAL_CLIENT_SECRET")
    paypal_mode: str = Field(default="sandbox", alias="PAYPAL_MODE")
    
    # Database
    database_url: str = Field(default="sqlite:///./payments.db", alias="DATABASE_URL")
    
    # Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @property
    def stripe_enabled(self) -> bool:
        """Check if Stripe is properly configured."""
        return bool(self.stripe_secret_key and self.stripe_publishable_key)
    
    @property
    def paypal_enabled(self) -> bool:
        """Check if PayPal is properly configured."""
        return bool(self.paypal_client_id and self.paypal_client_secret)


# Global settings instance
settings = Settings()
