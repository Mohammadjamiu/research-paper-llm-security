const fs = require('fs');
const path = require('path');

const { maxUploadBytes } = require('../config');
const { detectImageType } = require('../lib/imageValidation');
const {
  validateUserId,
  saveProfileImage,
  getProfileImage,
  deleteProfileImage
} = require('../storage/profileImageStore');

exports.uploadProfileImage = (req, res, next) => {
  try {
    const userId = validateUserId(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Profile image file is required' });
    }

    if (req.file.size > maxUploadBytes) {
      return res.status(413).json({ message: 'File too large' });
    }

    const imageType = detectImageType(req.file.buffer);

    if (!imageType) {
      return res.status(400).json({ message: 'Only JPEG, PNG, and WebP images are allowed' });
    }

    const savedImage = saveProfileImage(userId, req.file.buffer, imageType.extension, imageType.mimeType);

    res.status(201).json({
      message: 'Profile image uploaded',
      data: {
        userId,
        mimeType: savedImage.mimeType,
        fileName: savedImage.fileName,
        sizeBytes: req.file.size,
        url: `/users/${encodeURIComponent(userId)}/profile-image`
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.fetchProfileImage = (req, res, next) => {
  try {
    const userId = validateUserId(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const image = getProfileImage(userId);

    if (!image) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    const stat = fs.statSync(image.filePath);

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(path.resolve(image.filePath));
  } catch (err) {
    next(err);
  }
};

exports.removeProfileImage = (req, res, next) => {
  try {
    const userId = validateUserId(req.params.userId);

    if (!userId) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const removed = deleteProfileImage(userId);

    if (!removed) {
      return res.status(404).json({ message: 'Profile image not found' });
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
