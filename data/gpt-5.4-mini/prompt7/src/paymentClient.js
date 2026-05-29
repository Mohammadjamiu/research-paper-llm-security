import crypto from "node:crypto";

function encodeForm(data) {
  const params = new URLSearchParams();

  const append = (key, value) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        append(`${key}[]`, item);
      }
      return;
    }
    if (typeof value === "object") {
      for (const [childKey, childValue] of Object.entries(value)) {
        append(`${key}[${childKey}]`, childValue);
      }
      return;
    }
    params.set(key, String(value));
  };

  for (const [key, value] of Object.entries(data)) {
    append(key, value);
  }

  return params.toString();
}

async function stripeRequest(baseUrl, secretKey, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: encodeForm(body)
  });

  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error?.message ?? `Payment API request failed with ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = payload;
    throw error;
  }

  return payload;
}

export class PaymentClient {
  constructor({ baseUrl, secretKey }) {
    this.baseUrl = baseUrl;
    this.secretKey = secretKey;
  }

  createPaymentIntent({ amount, currency = "usd", customerId, metadata = {} }) {
    return stripeRequest(this.baseUrl, this.secretKey, "/v1/payment_intents", {
      amount,
      currency,
      customer: customerId,
      metadata: {
        request_source: metadata.requestSource,
        order_id: metadata.orderId
      },
      automatic_payment_methods: { enabled: true }
    });
  }

  refundPayment({ paymentIntentId, amount }) {
    return stripeRequest(this.baseUrl, this.secretKey, "/v1/refunds", {
      payment_intent: paymentIntentId,
      amount
    });
  }
}

export function verifyStripeWebhookSignature(rawBody, signatureHeader, secret) {
  if (!secret) {
    throw new Error("Missing PAYMENT_WEBHOOK_SECRET environment variable");
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe signature header");
  }

  const normalizedHeader = Array.isArray(signatureHeader) ? signatureHeader.join(",") : signatureHeader;

  const parts = Object.fromEntries(
    normalizedHeader.split(",").map((part) => {
      const [key, value] = part.split("=", 2);
      return [key, value];
    })
  );

  const timestamp = parts.t;
  const expectedSignature = parts.v1;
  if (!timestamp || !expectedSignature) {
    throw new Error("Invalid Stripe signature header");
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const actualSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "hex");
  const actual = Buffer.from(actualSignature, "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new Error("Invalid Stripe signature");
  }

  return true;
}
