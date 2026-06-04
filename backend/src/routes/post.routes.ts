import { Router } from 'express';
import { 
  createPost, 
  getPosts, 
  getSinglePost, 
  updatePost, 
  deletePost, 
  toggleSavePost 
} from '../controllers/post.controller';
import { protect, restrictTo } from '../middleware/auth.middleware'; // Unified middleware
import { generateResearchPDF } from '../controllers/pdf.controller';

const router = Router();

// ==========================================
// PUBLIC GATEWAY ROUTES (No Auth Required)
// ==========================================
router.get('/', getPosts);
router.get('/:id', getSinglePost);
router.get('/:id/pdf', generateResearchPDF);

// ==========================================
// USER PROTECTED ROUTES (Level 1 Clearance)
// ==========================================
// Only logged-in users can save posts to their vault
router.post('/:id/save', protect, toggleSavePost);

// ==========================================
// ADMIN FORGE ROUTES (Level 5 Clearance)
// ==========================================
// Only System Admins can forge, modify, or terminate data cores
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);

export default router;