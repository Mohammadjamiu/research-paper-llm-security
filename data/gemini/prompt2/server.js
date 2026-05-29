const express = require('express');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Database
const users = [
    {
        id: '1',
        email: 'test@example.com',
        password: '$2a$10$X7.mS.i5E10XW0v1A3fG.O9h1z3q1v1mS.i5E10XW0v1A3fG.O', // 'password123'
        resetToken: null,
        resetTokenExpiry: null
    }
];

// Helper: Hashing function (simulating a DB update)
const updatePassword = async (email, newPassword) => {
    const user = users.find(u => u.email === email);
    if (user) {
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = null;
        user.resetTokenExpiry = null;
        return true;
    }
    return false;
};

// Route: Request Password Reset
app.post('/api/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: 'Invalid email address' });
    }

    const { email } = req.body;
    const user = users.find(u => u.email === email);

    // SECURITY BEST PRACTICE: Always return same message to prevent account enumeration
    if (!user) {
        return res.json({ status: 'success', message: 'If account exists, link sent.' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour

    user.resetToken = token;
    user.resetTokenExpiry = expiry;

    // Simulated Email Sending
    console.log('------------------------------------------');
    console.log(`To: ${email}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Link: http://localhost:${PORT}/?token=${token}`);
    console.log('------------------------------------------');

    return res.json({ status: 'success', message: 'If account exists, link sent.' });
});

// Route: Reset Password
app.post('/api/reset-password', [
    body('password').isLength({ min: 8 }),
    body('token').notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'error', message: 'Invalid request' });
    }

    const { token, password } = req.body;
    const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());

    if (!user) {
        return res.status(400).json({ status: 'error', message: 'Token is invalid or has expired' });
    }

    // Update password
    await updatePassword(user.email, password);

    console.log(`SUCCESS: Password for ${user.email} has been reset.`);

    return res.json({ status: 'success', message: 'Password updated successfully' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Demo User: test@example.com / password123`);
});
