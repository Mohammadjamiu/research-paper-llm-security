const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./src/config');
const contactRoutes = require('./src/routes/contact');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '16kb' }));

app.use(
  '/api/contact',
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  }),
  contactRoutes,
);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const message =
    config.nodeEnv === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';
  res.status(500).json({ success: false, message });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
});
