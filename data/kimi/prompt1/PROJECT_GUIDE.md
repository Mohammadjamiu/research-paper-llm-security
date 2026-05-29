# User Authentication REST API - Project Guide

## Project Overview

This is a complete **User Registration and Login REST API** built with Node.js, Express, and JWT (JSON Web Token) authentication. It provides secure user authentication with password hashing and protected routes.

### Technologies Used
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **bcryptjs** - Password hashing
- **jsonwebtoken (JWT)** - Token-based authentication
- **dotenv** - Environment variable management

---

## Project Structure

```
user-auth-api/
├── index.js              # Main server entry point
├── package.json          # Dependencies and scripts
├── .env                  # Environment configuration
├── README.md             # General documentation
├── PROJECT_GUIDE.md      # This file - detailed guide with outputs
├── middleware/
│   └── auth.js          # JWT verification & token generation
├── models/
│   └── user.js          # In-memory user data storage
└── routes/
    ├── auth.js          # Authentication routes (register/login)
    └── user.js          # Protected user routes
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if API is running |
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate and get token |

### Protected Endpoints (JWT Token Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user profile |
| GET | `/api/user/all` | Get all registered users |
| GET | `/api/user/:id` | Get specific user by ID |

---

## Postman Testing Guide with Actual Outputs

### Step 1: Health Check
**Request:**
- **Method:** GET
- **URL:** `http://localhost:3000/api/health`
- **Headers:** None required

**Expected Output:**
```json
{
    "status": "OK",
    "message": "API is running",
    "timestamp": "2026-05-25T15:31:12.220Z"
}
```
**Explanation:** Confirms the server is running and accessible.

---

### Step 2: User Registration
**Request:**
- **Method:** POST
- **URL:** `http://localhost:3000/api/auth/register`
- **Headers:** 
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "password123"
}
```

**Actual Output:**
```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "createdAt": "2026-05-25T15:37:17.697Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obl9kb2UiLCJpYXQiOjE3Nzk3MjM0MzcsImV4cCI6MTc3OTgwOTgzN30.LXXPOLAzU6yxW8wvboqJeEU4YFLKOvxpMdzIz17s0-A"
}
```

**Explanation:**
- `message`: Confirmation of successful registration
- `user`: Contains user details (ID, username, email, creation timestamp)
- `token`: **JWT token** - Save this! You'll need it for protected routes
  - This token expires in 24 hours
  - Contains encoded user information
  - Used to authenticate subsequent requests

**⚠️ Note:** Copy and save the `token` value for the next steps!

---

### Step 3: User Login
**Request:**
- **Method:** POST
- **URL:** `http://localhost:3000/api/auth/login`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Actual Output:**
```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "createdAt": "2026-05-25T15:37:17.697Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obl9kb2UiLCJpYXQiOjE3Nzk3MjM0ODYsImV4cCI6MTc3OTgwOTg4Nn0.9UE-v1gBvME__5eUjX5tRiw0W3ukChez28Zmm-wDdlY"
}
```

**Explanation:**
- Same response structure as registration
- Returns a **new JWT token** (tokens are unique per login session)
- Notice the `createdAt` timestamp is identical to registration - confirms it's the same user

**⚠️ Note:** You can use either the registration token or this new login token for protected routes.

---

### Step 4: Access Protected Route (Profile)
**Request:**
- **Method:** GET
- **URL:** `http://localhost:3000/api/user/profile`
- **Headers:**
  - `Authorization: Bearer YOUR_JWT_TOKEN_HERE`
  
**How to set the Authorization header in Postman:**
1. Go to the "Headers" tab
2. Key: `Authorization`
3. Value: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obl9kb2UiLCJpYXQiOjE3Nzk3MjM0ODYsImV4cCI6MTc3OTgwOTg4Nn0.9UE-v1gBvME__5eUjX5tRiw0W3ukChez28Zmm-wDdlY`
   
   (Use the token you received from registration or login)

**Actual Output:**
```json
{
    "message": "Profile retrieved successfully",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "createdAt": "2026-05-25T15:37:17.697Z"
    }
}
```

**Explanation:**
- The API validates your JWT token
- Returns the authenticated user's profile
- Notice there's **no password** in the response (security best practice)
- The `createdAt` timestamp matches the registration time

---

### Step 5: Get All Users (Protected)
**Request:**
- **Method:** GET
- **URL:** `http://localhost:3000/api/user/all`
- **Headers:**
  - `Authorization: Bearer YOUR_JWT_TOKEN`

**Expected Output:**
```json
{
    "message": "Users retrieved successfully",
    "count": 1,
    "users": [
        {
            "id": 1,
            "username": "john_doe",
            "email": "john@example.com",
            "createdAt": "2026-05-25T15:37:17.697Z"
        }
    ]
}
```

**Explanation:**
- Returns a list of all registered users
- `count`: Total number of users
- Each user object excludes the password field

---

## Understanding the JWT Token

### Token Structure
A JWT token has 3 parts separated by dots (`.`):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ← Header (algorithm & type)
.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obl9kb2UiLCJpYXQiOjE3Nzk3MjM0MzcsImV4cCI6MTc3OTgwOTgzN30  ← Payload (data)
.LXXPOLAzU6yxW8wvboqJeEU4YFLKOvxpMdzIz17s0-A  ← Signature (verification)
```

### Decoded Payload Example
The middle section contains encoded user data:
```json
{
    "userId": 1,
    "email": "john@example.com",
    "username": "john_doe",
    "iat": 1779723437,    // Issued at timestamp
    "exp": 1779809837     // Expiration timestamp (24 hours later)
}
```

---

## Error Responses Examples

### 1. Missing Token (Unauthorized)
**Request:** Access `/api/user/profile` without Authorization header
```json
{
    "message": "Access denied. No token provided."
}
```

### 2. Invalid Token Format
**Request:** Wrong format in Authorization header
```json
{
    "message": "Invalid token format. Use: Bearer <token>"
}
```

### 3. Expired Token
**Request:** Using a token after 24 hours
```json
{
    "message": "Token expired. Please login again."
}
```

### 4. Invalid Credentials
**Request:** Wrong password during login
```json
{
    "message": "Invalid email or password"
}
```

### 5. Validation Errors
**Request:** Registration with invalid data
```json
{
    "message": "Validation failed",
    "errors": [
        "Username must be at least 3 characters long",
        "Password must be at least 6 characters long"
    ]
}
```

### 6. Duplicate User
**Request:** Register with existing email
```json
{
    "message": "User with this email already exists"
}
```

---

## Quick Start Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Server
```bash
# Production mode
npm start

# Development mode (auto-reload)
npm run dev
```

### 3. Server is Running
You'll see:
```
Server running on port 3000
Health check: http://localhost:3000/api/health
```

---

## Testing Checklist

Use this checklist to verify all features work correctly:

- [ ] **Health Check** - GET `/api/health` returns status OK
- [ ] **Register User** - POST `/api/auth/register` creates user and returns token
- [ ] **Login User** - POST `/api/auth/login` returns token for valid credentials
- [ ] **Access Profile** - GET `/api/user/profile` with token returns user data
- [ ] **Access Without Token** - Returns 401 error
- [ ] **Invalid Token** - Returns 401 error
- [ ] **Wrong Password** - Returns 401 error
- [ ] **Duplicate Registration** - Returns 409 error
- [ ] **Validation Errors** - Returns 400 error for invalid data

---

## Security Features

1. **Password Hashing**: All passwords are hashed with bcryptjs (10 salt rounds)
2. **JWT Tokens**: Secure tokens with expiration (24 hours)
3. **No Passwords in Responses**: User objects never include passwords
4. **Input Validation**: All inputs are validated before processing
5. **Error Handling**: Generic error messages to prevent information leakage

---

## Important Notes

1. **Data Persistence**: This API uses in-memory storage. All users are lost when the server restarts.

2. **Production Changes Required**:
   - Replace in-memory storage with a database (MongoDB, PostgreSQL, MySQL)
   - Change `JWT_SECRET` in `.env` to a cryptographically secure random string
   - Use HTTPS for all communications
   - Implement rate limiting

3. **Token Expiration**: Tokens expire after 24 hours. Users must login again to get a new token.

4. **Environment Variables**: Never commit `.env` files with real secrets to version control.

---

## Summary of Your Test Results

You successfully tested the API with these results:

| Test | Status | Output |
|------|--------|--------|
| User Registration | ✅ Success | Created user "john_doe" with ID 1 |
| User Login | ✅ Success | Authenticated and received new token |
| Profile Access | ✅ Success | Retrieved user profile with valid token |

Your API is working correctly! 🎉

---

## Next Steps

1. Try registering multiple users
2. Test error cases (wrong password, duplicate email, etc.)
3. Wait 24 hours and test token expiration
4. Connect a database for persistent storage
5. Add more features (password reset, email verification, etc.)
