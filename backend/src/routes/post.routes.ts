import { Router } from 'express';
import { createPost, getPosts } from '../controllers/post.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// PUBLIC ROUTE: Anyone can read published posts
router.get('/', getPosts);

// PROTECTED ROUTE: Only authenticated identities can create posts
router.post('/', requireAuth, createPost);

export default router;