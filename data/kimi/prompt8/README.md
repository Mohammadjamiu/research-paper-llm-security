# Contact Form Backend

A secure Node.js/Express backend for handling contact form submissions with validation and email sending capabilities.

## Features

- **Input Validation**: Comprehensive validation for name, email, subject, and message fields
- **Email Sending**: Nodemailer integration for sending emails via SMTP
- **Rate Limiting**: 5 requests per 15 minutes per IP address
- **Security**: Helmet.js for security headers, CORS protection, input sanitization
- **Error Handling**: Proper error handling with meaningful messages
- **HTML & Plain Text Emails**: Both formats supported for email clients

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your settings:
   - `SMTP_USER`: Your email address
   - `SMTP_PASS`: Your email password or app-specific password
   - `RECIPIENT_EMAIL`: Where to send contact form submissions
   - `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs

### Gmail Setup

If using Gmail, you'll need an App Password:
1. Enable 2-Step Verification on your Google Account
2. Go to Security → App passwords
3. Select "Mail" and your device
4. Use the generated password as `SMTP_PASS`

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### POST /api/contact

Submit a contact form.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Hello", // Optional
  "message": "This is my message..."
}
```

**Validation Rules:**
- `name`: Required, 2-100 characters, letters/spaces/hyphens/apostrophes only
- `email`: Required, valid email format, max 255 characters
- `subject`: Optional, max 200 characters
- `message`: Required, 10-5000 characters, HTML escaped

**Success Response (200):**
```json
{
  "success": true,
  "message": "Thank you! Your message has been sent successfully.",
  "data": {
    "messageId": "<message-id@example.com>"
  }
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "smtpConfigured": true
}
```

## Frontend Example

```javascript
const formData = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Inquiry',
  message: 'I would like to know more about your services.'
};

fetch('http://localhost:3000/api/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(formData)
})
.then(res => res.json())
.then(data => {
  if (data.success) {
    alert('Message sent successfully!');
  } else {
    alert('Error: ' + data.message);
  }
});
```

## Security Considerations

- All inputs are validated and sanitized
- HTML in messages is escaped to prevent XSS
- Rate limiting prevents spam
- Helmet.js adds security headers
- CORS is configured for specific origins only
- Sensitive data is stored in environment variables
