require('dotenv').config();

const express = require('express');
const path = require('path');
const authRoutes = require('./routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, '..', 'public');

app.use(express.json());
app.use(express.static(publicDir));

app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/reset-password', (_req, res) => {
  res.sendFile(path.join(publicDir, 'reset-password.html'));
});

app.use('/api/auth', authRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
