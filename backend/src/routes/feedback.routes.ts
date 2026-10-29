import express from 'express';
import { submitFeedback, getFeedbacks, deleteFeedback } from '../controllers/feedback.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { rateLimit } from '../utils/rateLimit';

const router = express.Router();

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Feedback limit reached. Please try again later.',
});

// Any authenticated user may submit feedback
router.post('/submit', protect, submitLimiter, submitFeedback);

// Inbox + purge are admin-only (previously any logged-in user could read/delete them)
router.get('/', protect, restrictTo('admin'), getFeedbacks);
router.delete('/:id', protect, restrictTo('admin'), deleteFeedback);

export default router;
