// server/routes/auth.ts
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'soundform_super_secret_key_1337';
const loginSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(1, 'Password harus diisi')
});
router.post('/login', async (req, res) => {
    try {
        const body = loginSchema.parse(req.body);
        const admin = await prisma.admin.findUnique({
            where: { email: body.email }
        });
        if (!admin) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Email atau password salah.'
            });
        }
        const isMatch = await bcrypt.compare(body.password, admin.password);
        if (!isMatch) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Email atau password salah.'
            });
        }
        // Sign JWT
        const token = jwt.sign({ id: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin.id,
                email: admin.email
            }
        });
    }
    catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation Error',
                issues: err.errors
            });
        }
        console.error('Login error:', err);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Terjadi kesalahan pada server.'
        });
    }
});
export default router;
