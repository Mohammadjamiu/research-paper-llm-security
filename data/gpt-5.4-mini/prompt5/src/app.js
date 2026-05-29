const express = require('express');
const path = require('path');

const profileImageRoutes = require('./routes/profileImageRoutes');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), {
  extensions: ['html']
}));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/users', profileImageRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, _req, res, _next) => {
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large' });
    }

    return res.status(400).json({ message: err.message || 'Invalid upload' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
