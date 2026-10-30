import express from 'express';
import { submitContactMessage } from '../controllers/contact.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { rateLimit } from '../utils/rateLimit';

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many contact messages sent from this IP. Please wait a few minutes.',
});

router.post('/', optionalAuth, contactLimiter, submitContactMessage);
router.post('/send', optionalAuth, contactLimiter, submitContactMessage);

export default router;
