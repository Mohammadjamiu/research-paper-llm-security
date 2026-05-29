export function loadConfig(env = process.env) {
  const paymentSecretKey = env.PAYMENT_SECRET_KEY;
  if (!paymentSecretKey) {
    throw new Error("Missing PAYMENT_SECRET_KEY environment variable");
  }

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  return {
    port,
    provider: env.PAYMENT_PROVIDER ?? "stripe",
    paymentSecretKey,
    paymentWebhookSecret: env.PAYMENT_WEBHOOK_SECRET ?? "",
    paymentApiBaseUrl: env.PAYMENT_API_BASE_URL ?? "https://api.stripe.com"
  };
}
