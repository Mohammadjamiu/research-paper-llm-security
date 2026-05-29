"use strict";

const Stripe = require("stripe");

function createPaymentService(config) {
  const stripe = new Stripe(config.stripe.secretKey);

  async function createPaymentIntent(amount, currency, metadata) {
    return stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });
  }

  async function retrievePaymentIntent(id) {
    return stripe.paymentIntents.retrieve(id);
  }

  async function confirmPaymentIntent(id, paymentMethodId) {
    return stripe.paymentIntents.confirm(id, {
      payment_method: paymentMethodId,
    });
  }

  async function cancelPaymentIntent(id) {
    return stripe.paymentIntents.cancel(id);
  }

  async function listPayments(limit) {
    return stripe.paymentIntents.list({ limit });
  }

  async function constructWebhookEvent(payload, signature) {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe.webhookSecret
    );
  }

  return {
    createPaymentIntent,
    retrievePaymentIntent,
    confirmPaymentIntent,
    cancelPaymentIntent,
    listPayments,
    constructWebhookEvent,
  };
}

module.exports = { createPaymentService };
