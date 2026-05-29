require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'Payment service is up and running' });
});

/**
 * Endpoint to create a PaymentIntent
 * This initiates a payment flow with Stripe.
 */
app.post('/api/create-payment-intent', async (req, res) => {
    const { amount, currency = 'usd', metadata } = req.body;

    // Basic validation
    if (!amount || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    try {
        console.log(`[Payment] Creating intent for ${amount} ${currency}`);
        
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: metadata || { integration_type: 'express_service' },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id,
        });
    } catch (error) {
        console.error('[Stripe Error]', error.message);
        res.status(500).json({
            message: 'Failed to create payment intent',
            error: error.message,
        });
    }
});

/**
 * Endpoint to retrieve a specific payment intent status
 */
app.get('/api/payment-intent/:id', async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
        res.json({ status: paymentIntent.status });
    } catch (error) {
        res.status(404).json({ error: 'Payment intent not found' });
    }
});

/**
 * Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error('[Fatal Error]', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Payment API Service listening at http://localhost:${port}`);
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_51...')) {
        console.warn('WARNING: STRIPE_SECRET_KEY is not configured or using default placeholder.');
    }
});
