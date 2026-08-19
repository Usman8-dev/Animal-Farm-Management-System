// Middlewares/upload.js
// Multer config for animal image uploads (device / file upload support).

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads', 'animals');

// Make sure the upload folder exists before multer writes into it.
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'image', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WEBP)'), false);
  }
};

const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

export { uploadImage };
