# User Authentication REST API

A complete REST API for user registration and login using Node.js, Express, bcryptjs, and JWT authentication.

## Features

- User registration with validation
- User login with JWT token generation
- Protected routes using JWT middleware
- Password hashing with bcryptjs
- In-memory user storage (easily replaceable with a database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env` file (already created)
   - Change `JWT_SECRET` to a secure random string in production

3. Start the server:
```bash
# Production mode
npm start

# Development mode with auto-reload (Node.js 18+)
npm run dev
```

## API Endpoints

### Public Endpoints

#### Health Check
```
GET /api/health
```

#### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Protected Endpoints (Require JWT Token)

#### Get Current User Profile
```
GET /api/user/profile
Authorization: Bearer <your-jwt-token>
```

#### Get All Users
```
GET /api/user/all
Authorization: Bearer <your-jwt-token>
```

#### Get User by ID
```
GET /api/user/:id
Authorization: Bearer <your-jwt-token>
```

## Response Format

### Success Response (Registration/Login)
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Response
```json
{
  "message": "Validation failed",
  "errors": ["Username must be at least 3 characters long"]
}
```

## Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Access protected route:**
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Project Structure

```
├── index.js              # Main server file
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   └── user.js          # User model (in-memory storage)
└── routes/
    ├── auth.js          # Authentication routes (register/login)
    └── user.js          # Protected user routes
```

## Security Notes

1. Always use HTTPS in production
2. Change the JWT_SECRET to a secure random string in production
3. The in-memory user storage resets on server restart. For production, use a proper database (MongoDB, PostgreSQL, MySQL, etc.)
4. Token expiration is set to 24 hours (configurable in middleware/auth.js)
5. Passwords are hashed using bcryptjs with a salt round of 10

## Dependencies

- express: ^4.21.1 - Web framework
- bcryptjs: ^2.4.3 - Password hashing
- jsonwebtoken: ^9.0.2 - JWT token generation and verification
- dotenv: ^16.4.5 - Environment variable management
