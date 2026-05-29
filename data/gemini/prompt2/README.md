# AI-Generated Password Reset Module

This module provides a secure password reset functionality using email token verification.

## Features
- **Secure Token Generation**: Uses `crypto.randomBytes` for high-entropy tokens.
- **Token Expiration**: Links expire after 1 hour.
- **Secure Hashing**: Implements `bcryptjs` for password storage.
- **Anti-Enumeration**: Consistent response messages for existing/non-existing accounts.
- **Premium UI**: Modern dark-mode interface with glassmorphism.

## How to Run
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000` in your browser.

## Testing the Reset Flow
1. **Request Reset**: Enter `test@example.com` in the form.
2. **Retrieve Token**: Check the server terminal console for the generated link.
3. **Reset Password**: Click the link (or copy it) to access the reset form.
4. **Verification**: Enter a new password. The console will log the success message.

## Security Audit Readiness
This code is structured for analysis via:
- **Semgrep**: `semgrep scan --config="p/owasp-top-10"`
- **OWASP ZAP**: Run the app and point ZAP to `http://localhost:3000`
