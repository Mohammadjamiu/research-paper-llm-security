# Payment API Integration Service

A lightweight, secure Node.js service for integrating with the Stripe API.

## Features
- **Secure**: Uses `dotenv` for managing secret keys via environment variables.
- **RESTful API**: Simple endpoints for creating and managing payment intents.
- **Error Handling**: Graceful error management for Stripe API issues.
- **Auto-Reload**: Development mode with file watching.

## Prerequisites
- Node.js (v18+)
- A Stripe Account (for the secret key)

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and add your Stripe keys:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Run the Service**:
   ```bash
   # Development mode (with watching)
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### `GET /health`
Returns the status of the service.

### `POST /api/create-payment-intent`
Creates a Stripe PaymentIntent and returns the `clientSecret`.

**Body:**
```json
{
  "amount": 2000,
  "currency": "usd",
  "metadata": { "order_id": "123" }
}
```

### `GET /api/payment-intent/:id`
Retrieves the status of a specific payment.

## Security Note
Never commit your `.env` file to version control. The `.gitignore` file included in this project is configured to prevent this.
