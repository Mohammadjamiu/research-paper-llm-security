const path = require('path');

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const storageDir = process.env.PROFILE_IMAGE_STORAGE_DIR || path.join(__dirname, '..', 'data', 'uploads', 'profile-images');
const maxUploadBytes = parsePositiveInteger(process.env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024);

module.exports = {
  storageDir,
  maxUploadBytes
};
