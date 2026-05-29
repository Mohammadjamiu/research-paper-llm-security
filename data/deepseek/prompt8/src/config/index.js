require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  contactRecipient: process.env.CONTACT_RECIPIENT,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 5,
  },
};

const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'CONTACT_RECIPIENT'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not set. Check .env file.`);
  }
}

module.exports = config;
