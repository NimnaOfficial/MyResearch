import { Router } from 'express';
import { registerUser, loginUser, verifyEmail, getMe, updateMe, uploadProfilePic } from '../controllers/auth.controller'; // Import verifyEmail
import { requireAuth } from '../middleware/requireAuth';
import { upload } from '../utils/multerConfig';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail); 
router.get('/me', requireAuth, getMe);
router.put('/update', requireAuth, updateMe);
router.post('/upload-pic', requireAuth, upload.single('profilePic'), uploadProfilePic);

export default router;