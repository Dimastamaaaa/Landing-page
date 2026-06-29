// server/routes/upload.ts
import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Configure local storage fallback
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique name: timestamp-random-extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter based on type (audio/image)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = {
    image: ['.jpg', '.jpeg', '.png', '.webp']
  };

  const ext = path.extname(file.originalname).toLowerCase();

  // Determine allowed list based on field name or mime type
  const isAudio = file.fieldname === 'audio' || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/mp4');
  const isImage = file.fieldname === 'cover' || file.fieldname === 'photo' || file.mimetype.startsWith('image/');

  if (isAudio) {
    cb(null, true); // Accept all audio types
  } else if (isImage && allowedExtensions.image.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipe file ${ext} tidak diizinkan untuk field ${file.fieldname}.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // 50MB max limit
    fileSize: 50 * 1024 * 1024
  }
});

// POST /api/upload - Handle file upload (Admin only)
router.post(
  '/',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response, next) => {
    // Use multer to accept single file from dynamic field names
    upload.any()(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Multer Error', message: 'Ukuran file melebihi batas (Maksimal 50MB).' });
        }
        return res.status(400).json({ error: 'Multer Error', message: err.message });
      } else if (err) {
        return res.status(400).json({ error: 'Upload Error', message: err.message });
      }
      next();
    });
  },
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Upload Error', message: 'Tidak ada file yang diunggah.' });
      }

      const file = files[0];

      // Build public URL path (strip local workspace path to serve relatively)
      // E.g. c:/Landing page/public/uploads/file.mp3 -> /public/uploads/file.mp3
      const relativePath = `/public/uploads/${file.filename}`;

      return res.status(200).json({
        success: true,
        message: 'File berhasil diunggah.',
        filename: file.filename,
        url: relativePath,
        size: file.size,
        mimetype: file.mimetype
      });
    } catch (err) {
      console.error('File upload controller error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memproses file unggahan.' });
    }
  }
);

export default router;
