import { Router } from 'express';
import {
  createPost,
  getPosts,
  getSinglePost,
  updatePost,
  deletePost,
  toggleSavePost,
} from '../controllers/post.controller';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.middleware';
import { generateResearchPDF } from '../controllers/pdf.controller';
import { rateLimit } from '../utils/rateLimit';

const router = Router();

// Headless-Chrome PDF rendering is expensive: throttle it
const pdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: 'PDF generation limit reached. Try again in a few minutes.',
});

// ==========================================
// PUBLIC GATEWAY ROUTES (optional auth: admins additionally see drafts)
// ==========================================
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getSinglePost);
router.get('/:id/pdf', pdfLimiter, optionalAuth, generateResearchPDF);

// ==========================================
// USER PROTECTED ROUTES (Level 1 Clearance)
// ==========================================
router.post('/:id/save', protect, toggleSavePost);

// ==========================================
// ADMIN FORGE ROUTES (Level 5 Clearance)
// ==========================================
router.post('/', protect, restrictTo('admin'), createPost);
router.put('/:id', protect, restrictTo('admin'), updatePost);
router.delete('/:id', protect, restrictTo('admin'), deletePost);

export default router;
