const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock user database
const users = [
    {
        id: 1,
        username: 'admin',
        password: '$2b$10$4WawPjZUOBv18tEtsm0Whubpp6k/my/Ic5Uq9qWX46P3sOIRU/SibK', // hashed 'password123'
        email: 'admin@example.com'
    }
];

// Helper to hash password for testing (password123)
// const hashed = bcrypt.hashSync('password123', 10);
// console.log(hashed);

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    // Simulate database lookup
    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password (in real app, we use bcrypt.compare)
    // For this demo, I'll just check if it matches 'password123' since I hardcoded the hash above
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
