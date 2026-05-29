"use strict";

function loadConfig() {
  const required = ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    },
    port: parseInt(process.env.PORT || "3000", 10),
  };
}

module.exports = { loadConfig };
