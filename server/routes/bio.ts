// server/routes/bio.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod Validation schemas
const bioSchema = z.object({
  name: z.string().min(1, 'Nama artis harus diisi'),
  tagline: z.string().min(1, 'Tagline harus diisi'),
  bio: z.string().min(1, 'Biografi harus diisi'),
  photoUrl: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  genre: z.array(z.string()).default([]),
  socialLinks: z.object({
    instagram: z.string().optional(),
    spotify: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional()
  }).default({})
});

// Helper: Parse artist bio fields
function formatArtist(artist: any) {
  if (!artist) return null;
  return {
    ...artist,
    genre: artist.genre ? JSON.parse(artist.genre) : [],
    socialLinks: artist.socialLinks ? JSON.parse(artist.socialLinks) : {}
  };
}

// ─── Public Endpoints ────────────────────────────────────────────────

// GET /api/bio - Get artist profile
router.get('/', async (req, res) => {
  try {
    const artist = await prisma.artist.findFirst();

    if (!artist) {
      return res.status(404).json({ error: 'Not Found', message: 'Biografi artis belum dikonfigurasi.' });
    }

    return res.status(200).json(formatArtist(artist));
  } catch (err) {
    console.error('Fetch bio error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil biografi.' });
  }
});

// ─── Admin Protected Endpoints ────────────────────────────────────────

// PUT /api/bio - Update artist profile
router.put('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = bioSchema.parse(req.body);

    const artist = await prisma.artist.findFirst();

    let updated;
    if (artist) {
      // Update existing record
      updated = await prisma.artist.update({
        where: { id: artist.id },
        data: {
          name: data.name,
          tagline: data.tagline,
          bio: data.bio,
          photoUrl: data.photoUrl,
          city: data.city,
          genre: JSON.stringify(data.genre),
          socialLinks: JSON.stringify(data.socialLinks)
        }
      });
    } else {
      // Create new record if somehow missing
      updated = await prisma.artist.create({
        data: {
          name: data.name,
          tagline: data.tagline,
          bio: data.bio,
          photoUrl: data.photoUrl,
          city: data.city,
          genre: JSON.stringify(data.genre),
          socialLinks: JSON.stringify(data.socialLinks)
        }
      });
    }

    return res.status(200).json(formatArtist(updated));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Update bio error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memperbarui biografi.' });
  }
});

export default router;
