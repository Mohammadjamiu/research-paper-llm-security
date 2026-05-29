const fs = require('fs');
const path = require('path');

const { storageDir } = require('../config');

const userIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

fs.mkdirSync(storageDir, { recursive: true });

function validateUserId(userId) {
  if (typeof userId !== 'string') {
    return null;
  }

  const trimmed = userId.trim();
  return userIdPattern.test(trimmed) ? trimmed : null;
}

function listStoredFiles(userId) {
  if (!fs.existsSync(storageDir)) {
    return [];
  }

  return fs
    .readdirSync(storageDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.startsWith(`${userId}.`))
    .map((entry) => path.join(storageDir, entry.name));
}

function removeExistingProfileImage(userId) {
  const existingFiles = listStoredFiles(userId);

  for (const filePath of existingFiles) {
    fs.unlinkSync(filePath);
  }
}

function saveProfileImage(userId, buffer, extension, mimeType) {
  removeExistingProfileImage(userId);

  const fileName = `${userId}${extension}`;
  const filePath = path.join(storageDir, fileName);
  fs.writeFileSync(filePath, buffer);

  return {
    fileName,
    filePath,
    mimeType
  };
}

function getProfileImage(userId) {
  const filePath = listStoredFiles(userId)[0];

  if (!filePath) {
    return null;
  }

  const extension = path.extname(filePath).toLowerCase();
  const mimeTypeByExtension = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };

  return {
    filePath,
    mimeType: mimeTypeByExtension[extension] || 'application/octet-stream'
  };
}

function deleteProfileImage(userId) {
  const filePath = listStoredFiles(userId)[0];

  if (!filePath) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

module.exports = {
  validateUserId,
  saveProfileImage,
  getProfileImage,
  deleteProfileImage
};
