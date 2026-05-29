import express from 'express';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Configuration
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer setup using memory storage for initial validation
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Secure Upload Endpoint
app.post('/upload', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // 1. Validate File Content (Magic Numbers)
    const type = await fileTypeFromBuffer(req.file.buffer);
    
    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.' 
      });
    }

    // Double check if the extension matches the content (optional but good)
    // Here we trust file-type's detection of the buffer content.

    // 2. Generate a secure random filename
    // We ignore the user's filename entirely to prevent path traversal and other attacks.
    const filename = `${uuidv4()}.${type.ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 3. Save the file to disk
    await fs.promises.writeFile(filePath, req.file.buffer);

    console.log(`File uploaded securely: ${filename}`);

    res.json({
      message: 'File uploaded successfully',
      filename: filename,
      contentType: type.mime
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal server error during upload.' });
  }
});

// Error handling for Multer (e.g., file too large)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Max limit is 5MB.' });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Secure Upload API running at http://localhost:${port}`);
});
