import { Router } from 'express';
import { registerUser, loginUser, verifyEmail, getMe } from '../controllers/auth.controller'; // Import verifyEmail
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail); 
router.get('/me', requireAuth, getMe);

export default router;