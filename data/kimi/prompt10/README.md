# Session-Based Web Application

A complete session-based web application with user authentication (login/logout) built with Node.js, Express, and Express Session.

## Features

- User Registration with password hashing (bcrypt)
- User Login with session management
- User Logout with session destruction
- Protected Routes (Dashboard accessible only when logged in)
- Automatic redirect to dashboard if already logged in
- Automatic redirect to login if not authenticated
- Session persistence (24 hours)
- Responsive design

## Project Structure

```
.
├── package.json
├── server.js                 # Express server with session handling
├── users.json               # User storage (JSON file)
├── public/                  # Static frontend files
│   ├── index.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # Protected dashboard
│   ├── style.css           # Styling
│   └── app.js              # Shared JavaScript utilities
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Running the Application

### Production mode:
```bash
npm start
```

### Development mode (with auto-reload):
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account at `/register.html`
3. Login with your credentials
4. Access the protected dashboard
5. Logout using the logout button

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/register` | Register new user | No |
| POST | `/api/login` | Login user | No |
| POST | `/api/logout` | Logout user | Yes |
| GET | `/api/me` | Get current user info | Yes |
| GET | `/api/check-session` | Check session status | No |
| GET | `/api/protected` | Get protected data | Yes |

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **Express Session** - Session management
- **bcryptjs** - Password hashing
- **HTML/CSS/JavaScript** - Frontend

## Security Features

- Passwords are hashed using bcrypt (10 rounds)
- HTTP-only session cookies
- Session expiration (24 hours)
- Input validation
- Protected API endpoints
- CSRF protection through SameSite cookies (configurable)

## Notes

- In production, change the `secret` in the session configuration
- Enable `secure: true` for cookies when using HTTPS
- Consider using a database (MongoDB, PostgreSQL, etc.) instead of JSON file for production
- Add rate limiting for login attempts in production
