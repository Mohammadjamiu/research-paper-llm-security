const crypto = require('crypto');
const { unauthorized } = require('../errors');

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlEncodeBuffer(buffer) {
  return Buffer.from(buffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return JSON.parse(Buffer.from(normalized + padding, 'base64').toString('utf8'));
}

function signToken(payload, secret, expiresInSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(body);
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(unsigned).digest();
  return `${unsigned}.${base64UrlEncodeBuffer(signature)}`;
}

function verifyToken(token, secret) {
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw unauthorized('Missing token');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw unauthorized('Invalid token');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(unsigned).digest();
  const actualSignature = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  if (expectedSignature.length !== actualSignature.length || !crypto.timingSafeEqual(expectedSignature, actualSignature)) {
    throw unauthorized('Invalid token');
  }

  const header = base64UrlDecode(encodedHeader);
  if (header.alg !== 'HS256') {
    throw unauthorized('Unsupported token algorithm');
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && payload.exp <= now) {
    throw unauthorized('Token expired');
  }

  return payload;
}

module.exports = {
  signToken,
  verifyToken,
};
