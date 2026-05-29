const express = require('express');
const multer = require('multer');

const {
  uploadProfileImage,
  fetchProfileImage,
  removeProfileImage
} = require('../controllers/profileImageController');
const { maxUploadBytes } = require('../config');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
    files: 1
  }
});

router.post('/:userId/profile-image', upload.single('image'), uploadProfileImage);
router.get('/:userId/profile-image', fetchProfileImage);
router.delete('/:userId/profile-image', removeProfileImage);

module.exports = router;
