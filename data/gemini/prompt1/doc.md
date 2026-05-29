# User Authentication API Documentation

This project is a RESTful API built with **Node.js** and **Express**, implementing secure user registration and login using **JSON Web Tokens (JWT)** and password hashing with **bcryptjs**.

## 🚀 Project Overview

The API provides a secure foundation for user management. It allows users to create accounts, authenticate themselves to receive a token, and use that token to access protected resources.

### Tech Stack
- **Node.js**: Runtime environment.
- **Express.js**: Web framework for routing and middleware.
- **JWT (jsonwebtoken)**: For stateless authentication.
- **Bcryptjs**: For secure password hashing.
- **Dotenv**: For environment variable management.

---

## 📁 File Structure

```text
/
├── src/
│   ├── controllers/
│   │   └── authController.js   # Contains the business logic for each route.
│   ├── middleware/
│   │   └── authMiddleware.js   # Intercepts requests to verify JWT tokens.
│   ├── models/
│   │   └── userStore.js        # In-memory user database (Simple array).
│   └── routes/
│       └── authRoutes.js       # Maps URLs to controller functions.
├── .env                        # Configuration for Port and JWT Secret.
├── server.js                   # Application entry point and server setup.
└── package.json                # Project dependencies and scripts.
```

---

## 🛠️ API Endpoints & Output Explanation

### 1. User Registration
**Endpoint:** `POST /api/register`  
**Description:** Takes a username and password, hashes the password, and saves the user.

**Successful Output:**
```json
{
    "message": "User registered successfully"
}
```
* **Explanation:** The server has successfully validated that the user doesn't exist, securely hashed the password, and added the user to the store.

### 2. User Login
**Endpoint:** `POST /api/login`  
**Description:** Validates credentials and returns a JWT if successful.

**Successful Output:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Login successful"
}
```
* **Explanation:** 
    * `token`: A signed string containing user identity data. This should be stored by the client (e.g., in LocalStorage) and sent in the header of future requests.
    * `message`: Confirmation of successful authentication.

### 3. Protected Profile Access
**Endpoint:** `GET /api/profile`  
**Description:** A protected route that requires a valid JWT in the `Authorization` header.

**Successful Output:**
```json
{
    "message": "Welcome to your profile",
    "user": {
        "id": 1779719649162,
        "username": "john_doe"
    }
}
```
* **Explanation:**
    * `message`: Confirms access to the protected area.
    * `user`: Returns the decoded identifying data from the JWT, proving the server knows who is logged in without re-querying the password.

---

## 🔒 Security Features

1. **Password Hashing**: We never store plain-text passwords. `bcryptjs` adds a "salt" and hashes the password 10 times, making it resistant to brute-force attacks.
2. **Stateless Authentication**: Using JWTs means the server doesn't need to keep a session in memory. All the info needed to verify the user is contained within the token itself.
3. **Secret Key Protection**: The signature of the JWT is generated using a `JWT_SECRET` stored in the `.env` file. Only the server knows this key, making the tokens impossible to forge.
