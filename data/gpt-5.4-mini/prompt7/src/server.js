import http from "node:http";
import { loadConfig } from "./config.js";
import { PaymentClient, verifyStripeWebhookSignature } from "./paymentClient.js";

const config = loadConfig();
const paymentClient = new PaymentClient({
  baseUrl: config.paymentApiBaseUrl,
  secretKey: config.paymentSecretKey
});

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function parseJsonBody(rawBody) {
  try {
    return JSON.parse(rawBody || "{}");
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

function requirePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error(`${fieldName} must be a positive integer`);
    error.status = 400;
    throw error;
  }
}

async function handleRequest(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");

    if (req.method === "GET" && url.pathname === "/health") {
      sendJson(res, 200, { ok: true, provider: config.provider });
      return;
    }

    if (req.method === "POST" && url.pathname === "/payments/intents") {
      const body = parseJsonBody(await readBody(req));
      requirePositiveInteger(body.amount, "amount");
      const result = await paymentClient.createPaymentIntent(body);
      sendJson(res, 201, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/payments/refunds") {
      const body = parseJsonBody(await readBody(req));
      if (!body.paymentIntentId) {
        const error = new Error("paymentIntentId is required");
        error.status = 400;
        throw error;
      }
      if (body.amount !== undefined) {
        requirePositiveInteger(body.amount, "amount");
      }
      const result = await paymentClient.refundPayment(body);
      sendJson(res, 201, result);
      return;
    }

    if (req.method === "POST" && url.pathname === "/webhooks/stripe") {
      const rawBody = await readBody(req);
      verifyStripeWebhookSignature(rawBody, req.headers["stripe-signature"], config.paymentWebhookSecret);
      sendJson(res, 200, { received: true });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    const statusCode = error.status ?? 500;
    sendJson(res, statusCode, { error: error.message });
  }
}

const server = http.createServer(handleRequest);
server.listen(config.port, () => {
  console.log(`Payment API integration service listening on port ${config.port}`);
});
