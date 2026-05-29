# Password Reset System

A complete password reset functionality for web applications using email token verification. Built with Node.js, Express, SQLite, and vanilla JavaScript.

## Features

- **Secure Token Generation**: Cryptographically secure random tokens using Node.js crypto module
- **Email Verification**: Sends password reset links via email (SMTP or console logging for development)
- **Token Expiration**: Reset tokens expire after 1 hour for security
- **One-Time Use**: Tokens are invalidated after successful password reset
- **Rate Limiting**: Prevents abuse of password reset endpoints
- **Input Validation**: Comprehensive validation on both client and server side
- **Password Strength**: Real-time password strength indicator
- **Security Best Practices**:
  - Prevents email enumeration attacks
  - Secure password hashing with bcrypt
  - HTTPS-ready with Helmet.js
  - CORS protection
  - Rate limiting on sensitive endpoints

## Project Structure

```
password-reset-system/
├── server.js                 # Express server setup
├── database.js               # SQLite database operations
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
├── README.md                 # This file
├── routes/
│   └── auth.js               # Authentication API routes
├── services/
│   ├── emailService.js       # Email sending functionality
│   └── tokenService.js       # Token generation and validation
├── public/
│   ├── index.html            # Main application page
│   ├── reset-password.html   # Password reset page
│   ├── css/
│   │   └── style.css         # Application styles
│   └── js/
│       ├── app.js            # Main application JavaScript
│       └── reset-password.js # Password reset page JavaScript
```

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   copy .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Open your browser**
   - Main app: `http://localhost:3000`
   - Test dashboard: `http://localhost:3000/test.html` 👈 **Great for testing!**

## Password Reset Flow

1. **User requests password reset**
   - User enters their email on the "Forgot Password" page
   - System generates a secure token and stores it with expiration
   - Reset link is sent to the user's email (or logged to console in development)

2. **User clicks reset link**
   - Link contains the token as a query parameter
   - System validates the token (exists, not expired, not used)
   - If valid, user is shown the password reset form

3. **User sets new password**
   - User enters and confirms new password
   - Password must meet security requirements (8+ chars, uppercase, lowercase, number)
   - System updates the password and invalidates the token
   - Confirmation email is sent

## Test Dashboard

A convenient test dashboard is available at `/test.html` to make testing easier:

### Features
- **System Statistics**: View total users, active tokens, and expired tokens
- **Quick Test Tools**:
  - Create test users instantly
  - Request password reset links with one click
  - Direct password reset (bypasses email for rapid testing)
- **Database View**: Browse all users and tokens in tables
- **Management Tools**: Clean up expired tokens, clear all data
- **Activity Log**: Real-time console output of all actions
- **Quick Links**: Copy or open reset links directly

### Usage
1. Navigate to `http://localhost:3000/test.html`
2. Create a test user using the form
3. Request a password reset
4. The reset link will appear on the page - click it to open
5. Or use "Direct Reset" to change password instantly without email

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/auth/verify-token/:token` | Validate reset token |
| POST | `/api/auth/reset-password` | Set new password |
| DELETE | `/api/auth/cleanup-tokens` | Clean up expired tokens |

### Request Examples

**Register User**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Forgot Password**
```json
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}
```

**Reset Password**
```json
POST /api/auth/reset-password
{
  "token": "64-character-hex-token",
  "password": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

## Email Configuration

### Development (Default)
By default, the system logs reset links to the console. This allows testing without configuring email:
```
========== PASSWORD RESET EMAIL ==========
To: user@example.com
Subject: Password Reset Request
Reset URL: http://localhost:3000/reset-password.html?token=...
==========================================
```

### Production with SMTP
To send real emails, configure SMTP settings in your `.env` file:

**Gmail Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@yourapp.com
```

**Custom SMTP:**
```env
SMTP_HOST=mail.yourserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

### Testing with Ethereal.Email
For testing with a fake SMTP service that captures emails:
```bash
# Get free credentials from https://ethereal.email
ETHEREAL_USER=username@ethereal.email
ETHEREAL_PASS=password
```

## Security Features

1. **Token Security**
   - 64-character cryptographically secure random tokens
   - Tokens expire after 1 hour
   - One-time use tokens
   - All existing tokens invalidated on successful reset

2. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - Real-time strength indicator

3. **Rate Limiting**
   - General API: 100 requests per 15 minutes
   - Password reset: 5 requests per hour

4. **Email Enumeration Prevention**
   - Same response whether email exists or not
   - No timing attack vulnerabilities

5. **Data Protection**
   - Passwords hashed with bcrypt (10 rounds)
   - Helmet.js for security headers
   - CORS configuration
   - Input validation and sanitization

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| email | TEXT | Unique email address |
| password | TEXT | Hashed password |
| created_at | DATETIME | Account creation time |
| updated_at | DATETIME | Last update time |

### Password Reset Tokens Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| token | TEXT | Unique reset token |
| expires_at | DATETIME | Token expiration time |
| used | BOOLEAN | Whether token was used |
| created_at | DATETIME | Token creation time |

## Customization

### Change Token Expiration
Edit `services/tokenService.js`:
```javascript
const TOKEN_CONFIG = {
  expiresIn: 60 * 60 * 1000, // Change this value (milliseconds)
};
```

### Change Password Requirements
Edit validation in `routes/auth.js`:
```javascript
body('password')
  .isLength({ min: 8 }) // Change minimum length
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) // Change pattern
```

### Customize Email Templates
Edit `services/emailService.js` to customize the HTML and text email templates.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use in your projects!

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

If you encounter any issues:
1. Check the server console for error messages
2. Verify your `.env` configuration
3. Ensure all dependencies are installed (`npm install`)
4. Check that port 3000 is not in use by another application
