import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// 1. Import all the routes we built from your src folder
import authRoutes from './src/routes/auth.routes';
import postRoutes from './src/routes/post.routes';
import releaseRoutes from './src/routes/release.routes';
import { errorHandler } from './src/middleware/errorHandler';
import path from 'path';

import feedbackRoutes from './src/routes/feedback.routes';

dotenv.config();

const app = express();

app.use(helmet()); 
app.disable('x-powered-by'); 

// 2. Completely open CORS so Next.js can connect without being blocked
app.use(cors({
  origin: true, 
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// 3. Network Traffic Radar (So you can see every request in your terminal!)
app.use((req: Request, res: Response, next) => {
  console.log(`[NETWORK TRAFFIC] ${req.method} request to: ${req.url}`);
  next();
});

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'active', message: 'Matrix API Online.' });
});

// 4. MOUNT THE ROUTES TO THE API
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/releases', releaseRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/feedback', feedbackRoutes)

// Global Error Handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);

// 5. Force IPv4 and IPv6 binding
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SYSTEM] Gateway established on port ${PORT}`);
  console.log(`[NETWORK] Listening on http://localhost:${PORT} AND http://127.0.0.1:${PORT}`);
});