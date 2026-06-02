import { Router } from 'express';
import { createPost, getPosts, toggleSavePost } from '../controllers/post.controller';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../config/prisma';
import { generateResearchPDF } from '../controllers/pdf.controller';
import { protect } from '../middlewares/auth.middleware';


const router = Router();

router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ status: 'success', data: posts });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch data cores.' });
  }
});

// PUBLIC ROUTE: Anyone can read published posts
router.get('/', getPosts);

// PROTECTED ROUTE: Only authenticated identities can create posts
router.post('/', requireAuth, createPost);

router.get('/:id/pdf', generateResearchPDF);

router.post('/:id/save', authMiddleware, toggleSavePost);

export default router;