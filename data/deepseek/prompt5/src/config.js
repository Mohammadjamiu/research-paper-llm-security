const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  uploadDir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads'),
  maxFileSizeBytes: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024,
  jwtSecret: process.env.JWT_SECRET || 'insecure-default-change-in-production',
  allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp')
    .split(',')
    .map(s => s.trim()),
  trustProxy: process.env.TRUST_PROXY === 'true',
};

module.exports = config;
