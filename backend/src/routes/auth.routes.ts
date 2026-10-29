import { Router } from 'express';
import { registerUser, loginUser, verifyEmail, getMe, updateMe, uploadProfilePic } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { upload } from '../utils/multerConfig';
import { rateLimit } from '../utils/rateLimit';

const router = Router();

// Brute-force protection: the 10-char secret code is the primary credential, so throttle hard
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again in a few minutes.',
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many registrations from this network. Try again later.',
});
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify', verifyLimiter, verifyEmail);
router.get('/me', protect, getMe);
router.put('/update', protect, updateMe);
router.post('/upload-pic', protect, upload.single('profilePic'), uploadProfilePic);

export default router;
