import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import releaseRoutes from './routes/release.routes';
import showcaseRoutes from './routes/showcase.routes';
import faqRoutes from './routes/faq.routes';

dotenv.config();

const app = express();

// ==========================================
// SECURITY & MIDDLEWARE
// ==========================================
app.use(helmet()); 
app.disable('x-powered-by'); 

// Replace your current app.use(cors({...})) with this:
app.use(cors({
  origin: true, // This explicitly allows ANY origin to connect during development
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ==========================================
// RADAR: NETWORK TRAFFIC MONITOR
// ==========================================
app.use((req: Request, res: Response, next) => {
  console.log(`[NETWORK TRAFFIC] ${req.method} request to: ${req.url}`);
  next();
});
// ==========================================

// ==========================================
// ROUTES
// ==========================================
// Explicitly typing req and res to satisfy TypeScript
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'active', message: 'Matrix API Online.' });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use(errorHandler);

// 2. Mount the auth routes to the /api/auth path
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/showcase', showcaseRoutes);
app.use('/api/faqs', faqRoutes);

const PORT = parseInt(process.env.PORT || '5000', 10);

// By adding '0.0.0.0', we force Express to listen on ALL local network interfaces (IPv4 and IPv6)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SYSTEM] Gateway established on port ${PORT}`);
  console.log(`[NETWORK] Listening on http://localhost:${PORT} AND http://127.0.0.1:${PORT}`);
});