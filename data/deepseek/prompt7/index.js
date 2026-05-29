"use strict";

const { loadConfig } = require("./config");
const { createPaymentService } = require("./paymentService");

async function main() {
  try {
    const config = loadConfig();
    const payments = createPaymentService(config);

    console.log(`Payment service initialized on port ${config.port}`);

    const intent = await payments.createPaymentIntent(2000, "usd", {
      order_id: "12345",
    });

    console.log("Created PaymentIntent:", intent.id);
    console.log("Status:", intent.status);
    console.log("Amount:", intent.amount / 100, intent.currency);
  } catch (err) {
    console.error("Failed to initialize payment service:", err.message);
    process.exit(1);
  }
}

main();
