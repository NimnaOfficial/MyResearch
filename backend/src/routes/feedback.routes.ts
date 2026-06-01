import express from 'express';
import { submitFeedback } from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/requireAuth';
//import { requireAuth } from '../middleware/auth.middleware'; // Optional: Use this if feedback is strictly for logged-in users.

const router = express.Router();

// We will use requireAuth to ensure we know exactly who is sending telemetry
router.post('/submit', requireAuth, submitFeedback);

export default router;