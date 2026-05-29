const express = require('express');
const path = require('path');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use('/api/students', studentRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  let status = err.status || 500;

  if (err.name === 'ValidationError' || err.name === 'CastError') {
    status = 400;
  }

  if (err.code === 11000) {
    status = 409;
  }

  res.status(status).json({
    message: err.message || 'Internal server error'
  });
});

module.exports = app;
