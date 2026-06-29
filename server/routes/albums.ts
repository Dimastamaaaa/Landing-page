// server/routes/albums.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod Validation schemas
const albumSchema = z.object({
  title: z.string().min(1, 'Judul album harus diisi'),
  coverUrl: z.string().nullable().optional(),
  releaseDate: z.string().transform((str) => new Date(str)),
  description: z.string().nullable().optional()
});

// Helper: Parse track serialized fields inside album tracks
function formatTrack(track: any) {
  return {
    ...track,
    mood: track.mood ? JSON.parse(track.mood) : []
  };
}

function formatAlbum(album: any) {
  if (album.tracks) {
    return {
      ...album,
      tracks: album.tracks.map(formatTrack)
    };
  }
  return album;
}

// ─── Public Endpoints ────────────────────────────────────────────────

// GET /api/albums - List all albums
router.get('/', async (req, res) => {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { releaseDate: 'desc' },
      include: {
        _count: {
          select: { tracks: true }
        }
      }
    });
    return res.status(200).json(albums);
  } catch (err) {
    console.error('Fetch albums error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil daftar album.' });
  }
});

// GET /api/albums/:id - Album detail with tracks
router.get('/:id', async (req, res) => {
  try {
    const album = await prisma.album.findUnique({
      where: { id: req.params.id },
      include: {
        tracks: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!album) {
      return res.status(404).json({ error: 'Not Found', message: 'Album tidak ditemukan.' });
    }

    return res.status(200).json(formatAlbum(album));
  } catch (err) {
    console.error('Fetch album detail error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil detail album.' });
  }
});

// ─── Admin Protected Endpoints ────────────────────────────────────────

// POST /api/albums - Create album
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = albumSchema.parse(req.body);

    const album = await prisma.album.create({
      data
    });

    return res.status(201).json(album);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Create album error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal membuat album baru.' });
  }
});

// PUT /api/albums/:id - Update album
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = albumSchema.parse(req.body);

    const album = await prisma.album.findUnique({
      where: { id: req.params.id }
    });

    if (!album) {
      return res.status(404).json({ error: 'Not Found', message: 'Album tidak ditemukan.' });
    }

    const updated = await prisma.album.update({
      where: { id: req.params.id },
      data
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Update album error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memperbarui data album.' });
  }
});

// DELETE /api/albums/:id - Delete album
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const album = await prisma.album.findUnique({
      where: { id: req.params.id }
    });

    if (!album) {
      return res.status(404).json({ error: 'Not Found', message: 'Album tidak ditemukan.' });
    }

    // SQLite doesn't enforce cascade delete automatically unless enabled,
    // let's explicitly detach tracks before deleting the album to prevent issues.
    await prisma.track.updateMany({
      where: { albumId: req.params.id },
      data: { albumId: null }
    });

    await prisma.album.delete({
      where: { id: req.params.id }
    });

    return res.status(200).json({ success: true, message: 'Album berhasil dihapus.' });
  } catch (err) {
    console.error('Delete album error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal menghapus album.' });
  }
});

export default router;
