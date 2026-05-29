const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory user store (replace with a real DB in production)
const users = [
  { id: 1, username: 'admin', password: 'password123' },
  { id: 2, username: 'user', password: 'pass456' }
];

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'change-this-to-a-random-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true in production with HTTPS
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

// Middleware to protect routes
function requireAuth(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.redirect('/login.html');
}

// POST /login - authenticate user and create session
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).send('Invalid username or password. <a href="/login.html">Try again</a>');
  }

  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/dashboard');
});

// GET /logout - destroy session
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login.html');
  });
});

// GET /dashboard - protected page
app.get('/dashboard', requireAuth, (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; text-decoration: none; border-radius: 4px; }
        .btn:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome, ${req.session.username}!</h1>
        <p>You are logged in. User ID: ${req.session.userId}</p>
        <a href="/logout" class="btn">Logout</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
