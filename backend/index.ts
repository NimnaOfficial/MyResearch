import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { validateEnv, getAllowedOrigins, isTrustedPreviewOrigin } from './src/config/env';
import authRoutes from './src/routes/auth.routes';
import postRoutes from './src/routes/post.routes';
import releaseRoutes from './src/routes/release.routes';
import feedbackRoutes from './src/routes/feedback.routes';
import adminRoutes from './src/routes/admin.routes';
import showcaseRoutes from './src/routes/showcase.routes';
import faqRoutes from './src/routes/faq.routes';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';

// Fail fast on missing/insecure configuration
validateEnv();

const app = express();

// Render/Vercel sit behind a reverse proxy: trust it so req.ip is the real client IP
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.disable('x-powered-by');

// Statically serve local file uploads (avatars & media)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ==========================================
// CORS: only the known frontend origins may call the API from a browser
// ==========================================
const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, health checks, server-to-server) send no Origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isTrustedPreviewOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

// Network traffic radar (method + path only, never query strings which may carry tokens)
app.use((req: Request, _res: Response, next) => {
  console.log(`[NETWORK TRAFFIC] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'active', message: 'Matrix API Online.' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/showcase', showcaseRoutes);
app.use('/api/faqs', faqRoutes);

// 404 + Global Error Handler (must be registered after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

// '0.0.0.0' makes Express listen on all interfaces (required on Render)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SYSTEM] Gateway established on port ${PORT}`);
  console.log(`[NETWORK] Listening on http://localhost:${PORT}`);
});
