const crypto = require('node:crypto');
const config = require('../config');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) throw new Error('Invalid token format');

    const expectedSig = crypto
      .createHmac('sha256', config.jwtSecret)
      .update(payloadB64)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = { id: payload.sub, role: payload.role || 'user' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authMiddleware };
