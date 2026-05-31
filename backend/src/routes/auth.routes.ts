import { Router } from 'express';
import { registerUser, loginUser, verifyEmail } from '../controllers/auth.controller'; // Import verifyEmail

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyEmail); 

export default router;