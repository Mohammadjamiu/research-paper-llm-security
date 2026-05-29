const crypto = require('node:crypto');
const path = require('node:path');

const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

function sanitizeFilename(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const safeExt = allowedExts.includes(ext) ? ext : '.bin';
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${safeExt}`;
}

function validateMagicBytes(buffer, mimeType) {
  const signature = MAGIC_BYTES[mimeType];
  if (!signature) return false;
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

module.exports = { sanitizeFilename, validateMagicBytes };
