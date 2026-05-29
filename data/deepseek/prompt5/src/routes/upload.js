const { Router } = require('express');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const upload = require('../middleware/upload');
const { validateMagicBytes } = require('../utils/fileUtils');

const router = Router();

router.post('/profile-image', (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(status).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    try {
      const headerBytes = fs.readFileSync(req.file.path, { flag: 'r' });
      if (!validateMagicBytes(headerBytes, req.file.mimetype)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'File content does not match declared type' });
      }

      res.status(201).json({
        message: 'Profile image uploaded successfully',
        fileId: path.basename(req.file.filename, path.extname(req.file.filename)),
        filename: req.file.filename,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (readErr) {
      next(readErr);
    }
  });
});

router.get('/profile-image/:fileId', (req, res) => {
  const { fileId } = req.params;
  if (!/^[a-f0-9]{32}$/.test(fileId)) {
    return res.status(400).json({ error: 'Invalid file ID' });
  }

  const files = fs.readdirSync(config.uploadDir);
  const match = files.find(f => f.startsWith(fileId));

  if (!match) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(config.uploadDir, match);
  const mimeType = req.accepts(['image/png', 'image/jpeg', 'image/webp']) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Cache-Control', 'private, max-age=86400');
  res.sendFile(filePath);
});

module.exports = router;
