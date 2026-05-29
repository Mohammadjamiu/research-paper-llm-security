const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const config = require('../config');

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true, mode: 0o755 });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.uploadDir),
  filename: (_req, _file, cb) => {
    const { sanitizeFilename } = require('../utils/fileUtils');
    cb(null, sanitizeFilename(_file.originalname));
  },
});

function fileFilter(_req, file, cb) {
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeBytes },
  fileFilter,
});

module.exports = upload;
