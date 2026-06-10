import express from 'express';
import { submitFeedback, getFeedbacks, deleteFeedback } from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Public submissions can pass through if requireAuth matches both guest/user options, 
// or lock it strictly to users by keeping requireAuth active.
router.route('/')
  .get(requireAuth, getFeedbacks); // Admin Workspace Secure Fetch

router.route('/submit')
  .post(requireAuth, submitFeedback);

router.route('/:id')
  .delete(requireAuth, deleteFeedback); // Admin Workspace Purge Trigger

export default router;