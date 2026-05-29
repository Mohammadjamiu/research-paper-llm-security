require('dotenv').config();

const express = require('express');
const path = require('path');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', require('./routes/passwordReset'));

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send('All fields are required.');
    }
    if (password.length < 8) {
      return res.status(400).send('Password must be at least 8 characters.');
    }
    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).send('Email already registered.');
    }
    await User.create({ email, password, name });
    res.redirect('/login');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Something went wrong.');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send('Email and password are required.');
    }
    const user = User.findByEmail(email);
    if (!user) {
      return res.status(401).send('Invalid email or password.');
    }
    const valid = await User.verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).send('Invalid email or password.');
    }
    res.send(`<h2>Welcome back, ${user.name}!</h2><p>You are logged in.</p>`);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Something went wrong.');
  }
});

app.use((req, res) => {
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`   Register: http://localhost:${PORT}/register`);
  console.log(`   Login:    http://localhost:${PORT}/login`);
  console.log(`   Forgot:   http://localhost:${PORT}/forgot-password\n`);
});
