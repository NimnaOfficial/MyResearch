import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Next.js frontend to talk to this backend
app.use(express.json()); // Allows us to receive JSON data

// --- API ROUTES ---

// 1. Health Check Route (To make sure the server is alive)
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Nima Platform API is running smoothly!' });
});

// 2. Fetch All Published Posts (Blogs & Research)
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      include: { author: true, categories: true }, // Joins related data
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
});