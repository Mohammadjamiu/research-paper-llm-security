# Payment API Integration Service

Small HTTP service for payment API integration with env-based secret handling.

## Environment

Copy `.env.example` and set:

- `PAYMENT_SECRET_KEY` for your payment provider secret key
- `PAYMENT_WEBHOOK_SECRET` for webhook verification
- `PAYMENT_API_BASE_URL` if you are using a non-default API host

## Run

```bash
npm start
```

## Endpoints

- `GET /health`
- `POST /payments/intents`
- `POST /payments/refunds`
- `POST /webhooks/stripe`

## Notes

This service expects a Stripe-compatible API shape. Use test keys in development and keep secret keys only in environment variables.
