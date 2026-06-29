// server/routes/tracks.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod Validation schemas
const trackSchema = z.object({
  title: z.string().min(1, 'Judul lagu harus diisi'),
  audioUrl: z.string().min(1, 'Unggah file audio terlebih dahulu'),
  duration: z.number().int().min(1, 'Durasi harus berupa angka bulat positif'),
  bpm: z.number().int().nullable().optional(),
  key: z.string().nullable().optional(),
  mood: z.array(z.string()).default([]),
  lyrics: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  albumId: z.string().nullable().optional().transform(val => val === '' ? null : val)
});

const reorderSchema = z.object({
  orders: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int()
    })
  )
});

// Helper: Parse track serialized fields for client response
function formatTrack(track: any) {
  return {
    ...track,
    mood: track.mood ? JSON.parse(track.mood) : []
  };
}

// ─── Public Endpoints ────────────────────────────────────────────────

// GET /api/tracks - List tracks
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const showAll = req.query.all === 'true';

    // If requesting all (including drafts), check authorization
    if (showAll) {
      // Inline auth check to keep endpoint flexible
      return authMiddleware(req, res, async () => {
        const tracks = await prisma.track.findMany({
          orderBy: { sortOrder: 'asc' },
          include: {
            album: {
              select: { id: true, title: true, coverUrl: true }
            }
          }
        });
        return res.status(200).json(tracks.map(formatTrack));
      });
    }

    // Default: return only published tracks
    const tracks = await prisma.track.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        album: {
          select: { id: true, title: true, coverUrl: true }
        }
      }
    });
    return res.status(200).json(tracks.map(formatTrack));
  } catch (err) {
    console.error('Fetch tracks error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil daftar lagu.' });
  }
});

// GET /api/tracks/:id - Get detail track
router.get('/:id', async (req, res) => {
  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id },
      include: {
        album: {
          select: { id: true, title: true, coverUrl: true }
        }
      }
    });

    if (!track) {
      return res.status(404).json({ error: 'Not Found', message: 'Lagu tidak ditemukan.' });
    }

    return res.status(200).json(formatTrack(track));
  } catch (err) {
    console.error('Fetch track detail error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil detail lagu.' });
  }
});

// POST /api/tracks/:id/play - Increment play count
router.post('/:id/play', async (req, res) => {
  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id }
    });

    if (!track) {
      return res.status(404).json({ error: 'Not Found', message: 'Lagu tidak ditemukan.' });
    }

    const updated = await prisma.track.update({
      where: { id: req.params.id },
      data: { playCount: { increment: 1 } }
    });

    return res.status(200).json({
      success: true,
      playCount: updated.playCount
    });
  } catch (err) {
    console.error('Play count increment error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal merekam data putar.' });
  }
});

// ─── Admin Protected Endpoints ────────────────────────────────────────

// POST /api/tracks - Create track
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = trackSchema.parse(req.body);

    const track = await prisma.track.create({
      data: {
        ...data,
        mood: JSON.stringify(data.mood)
      }
    });

    return res.status(201).json(formatTrack(track));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Create track error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal membuat track baru.' });
  }
});

// PUT /api/tracks/reorder - Bulk update sortOrder
router.put('/reorder', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orders } = reorderSchema.parse(req.body);

    // Run reorders in a transaction for atomicity
    await prisma.$transaction(
      orders.map((o) =>
        prisma.track.update({
          where: { id: o.id },
          data: { sortOrder: o.sortOrder }
        })
      )
    );

    return res.status(200).json({ success: true, message: 'Urutan track berhasil disimpan.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Reorder tracks error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memperbarui urutan lagu.' });
  }
});

// PUT /api/tracks/:id - Update track
router.put('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = trackSchema.parse(req.body);

    const track = await prisma.track.findUnique({
      where: { id: req.params.id }
    });

    if (!track) {
      return res.status(404).json({ error: 'Not Found', message: 'Lagu tidak ditemukan.' });
    }

    const updated = await prisma.track.update({
      where: { id: req.params.id },
      data: {
        ...data,
        mood: JSON.stringify(data.mood)
      }
    });

    return res.status(200).json(formatTrack(updated));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Update track error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memperbarui track.' });
  }
});

// DELETE /api/tracks/:id - Delete track
router.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id }
    });

    if (!track) {
      return res.status(404).json({ error: 'Not Found', message: 'Lagu tidak ditemukan.' });
    }

    await prisma.track.delete({
      where: { id: req.params.id }
    });

    return res.status(200).json({ success: true, message: 'Track berhasil dihapus.' });
  } catch (err) {
    console.error('Delete track error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal menghapus track.' });
  }
});

export default router;
