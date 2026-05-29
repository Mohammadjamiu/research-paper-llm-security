require('dotenv').config();
const express = require('express');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api', authRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({ message: 'Auth API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
