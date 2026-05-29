# Payment API Integration Service

A secure, extensible payment API integration service that supports multiple payment providers (Stripe, PayPal) using environment variables for secret management.

## Features

- **Multiple Payment Providers**: Stripe and PayPal support with easy extensibility
- **Environment Variable Security**: All secrets stored in environment variables
- **Webhook Support**: Handle async payment confirmations
- **Type Safety**: Full type hints throughout
- **Docker Support**: Containerized deployment ready
- **Comprehensive Testing**: Unit and integration tests

## Quick Start

### Prerequisites

- Python 3.9+
- pip
- Stripe/PayPal developer accounts

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python -m uvicorn payment_service.main:app --reload
   ```

### Environment Variables

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_MODE=sandbox

# Database (optional - for payment persistence)
DATABASE_URL=sqlite:///./payments.db

# Logging
LOG_LEVEL=INFO
```

## API Endpoints

- `POST /payments/charge` - Create a payment charge
- `POST /payments/refund` - Refund a payment
- `GET /payments/{payment_id}` - Get payment status
- `POST /webhooks/stripe` - Stripe webhook handler
- `POST /webhooks/paypal` - PayPal webhook handler
- `GET /health` - Health check

## Security

- All API keys stored in environment variables
- Webhook signature verification
- Request validation and sanitization
- Rate limiting support

## Docker

```bash
docker build -t payment-service .
docker run --env-file .env -p 8000:8000 payment-service
```
