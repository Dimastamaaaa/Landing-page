// server/routes/contact.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Zod Validation schemas
const contactSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  subject: z.enum(['Kolaborasi', 'Booking', 'Media', 'Lainnya'], {
    errorMap: () => ({ message: 'Subjek pesan tidak valid' })
  }),
  message: z.string().min(10, 'Pesan minimal 10 karakter'),
  // Bot trap honeypot field
  website: z.string().max(0, { message: 'Spam detected' }).optional()
});

// ─── Public Endpoints ────────────────────────────────────────────────

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const data = contactSchema.parse(req.body);

    // Save message to database
    await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message
      }
    });

    return res.status(201).json({ success: true, message: 'Pesan berhasil terkirim.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      // If the honeypot "website" field failed (i.e. length > 0), return generic success to deceive bots
      const spamError = err.errors.some(e => e.path.includes('website'));
      if (spamError) {
        console.log('[Spam Detected] Honeypot triggered, silently ignoring.');
        return res.status(201).json({ success: true, message: 'Pesan berhasil terkirim.' });
      }

      return res.status(400).json({ error: 'Validation Error', issues: err.errors });
    }
    console.error('Contact submission error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengirim pesan.' });
  }
});

// ─── Admin Protected Endpoints ────────────────────────────────────────

// GET /api/admin/contacts - List all inbox messages (unread first)
router.get('/admin/contacts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    return res.status(200).json(contacts);
  } catch (err) {
    console.error('Fetch contact messages error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal mengambil pesan masuk.' });
  }
});

// PUT /api/admin/contacts/:id/read - Mark message as read
router.put('/admin/contacts/:id/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const message = await prisma.contact.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Not Found', message: 'Pesan tidak ditemukan.' });
    }

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: 'Gagal memperbarui status pesan.' });
  }
});

export default router;
