// server/server.ts
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environmental variables
dotenv.config();

// Resolve ES module paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Route Handlers
import authRouter from './routes/auth.js';
import tracksRouter from './routes/tracks.js';
import albumsRouter from './routes/albums.js';
import bioRouter from './routes/bio.js';
import contactRouter from './routes/contact.js';
import uploadRouter from './routes/upload.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS with credentials support
app.use(cors({
  origin: '*', // Di production, ganti dengan domain frontend Anda
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
const publicUploadsDir = path.join(process.cwd(), './public/uploads');
app.use('/public/uploads', express.static(publicUploadsDir));

// API Routers mapping
app.use('/api/auth', authRouter);
app.use('/api/tracks', tracksRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/bio', bioRouter);
app.use('/api/contact', contactRouter);
app.use('/api/upload', uploadRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Root API handler
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'SOUNDFORM API Server - Active' });
});

// Serve frontend build static files in production if needed
// For local development, index.html is served separately

// Catch-all 404 for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'API Endpoint tidak ditemukan.' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(` SOUNDFORM Backend Server running on port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=============================================`);
});

export default app;
