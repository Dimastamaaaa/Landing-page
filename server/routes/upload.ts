// server/routes/upload.ts
import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Configure local storage fallback
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';

// Initialize Supabase Client if credentials are provided
const supabaseUrl = process.env.SUPABASE_URL || 'https://hktzmgsmlseznjxprbwi.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseEnabled = !!supabaseKey;

const supabase = isSupabaseEnabled ? createClient(supabaseUrl, supabaseKey) : null;

// Multer Storage Configuration: Memory for Supabase, Disk for local fallback
let storage;
if (isSupabaseEnabled) {
  storage = multer.memoryStorage();
  console.log('[UploadRoute] Using Supabase Storage Bucket ("soundform")');
} else {
  // Ensure local upload directory exists
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
  console.log('[UploadRoute] Using Local Disk Storage Fallback');
}

// File filter based on type (audio/image)
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExtensions = {
    image: ['.jpg', '.jpeg', '.png', '.webp']
  };

  const ext = path.extname(file.originalname).toLowerCase();

  const isAudio = file.fieldname === 'audio' || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/mp4');
  const isImage = file.fieldname === 'cover' || file.fieldname === 'photo' || file.mimetype.startsWith('image/');

  if (isAudio) {
    cb(null, true);
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
    fileSize: 50 * 1024 * 1024 // 50MB max limit
  }
});

// POST /api/upload - Handle file upload (Admin only)
router.post(
  '/',
  authMiddleware,
  (req: AuthenticatedRequest, res: Response, next) => {
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

      if (isSupabaseEnabled && supabase) {
        // Upload to Supabase Storage
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname).toLowerCase();
        
        let folder = 'others';
        if (file.fieldname === 'audio' || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/mp4')) {
          folder = 'audio';
        } else if (file.fieldname === 'photo' || file.fieldname === 'cover' || file.mimetype.startsWith('image/')) {
          folder = 'images';
        }
        
        const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
        const filePath = `${folder}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('soundform')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Supabase storage upload error:', error);
          return res.status(500).json({
            error: 'Upload Error',
            message: `Gagal mengunggah file ke Supabase Storage: ${error.message}. Pastikan bucket bernama "soundform" dengan akses publik sudah dibuat.`
          });
        }

        const { data: urlData } = supabase.storage.from('soundform').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;

        return res.status(200).json({
          success: true,
          message: 'File berhasil diunggah ke Supabase Storage.',
          filename: fileName,
          url: publicUrl,
          size: file.size,
          mimetype: file.mimetype
        });
      } else {
        // Local storage fallback response
        const relativePath = `/public/uploads/${file.filename}`;
        return res.status(200).json({
          success: true,
          message: 'File berhasil diunggah secara lokal.',
          filename: file.filename,
          url: relativePath,
          size: file.size,
          mimetype: file.mimetype
        });
      }
    } catch (err) {
      console.error('File upload controller error:', err);
      return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memproses file unggahan.' });
    }
  }
);

export default router;
