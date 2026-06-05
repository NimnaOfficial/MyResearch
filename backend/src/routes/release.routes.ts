import { Router } from 'express';
import { 
  createRelease, 
  getReleases, 
  getSingleRelease, 
  updateRelease, 
  deleteRelease 
} from '../controllers/release.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC GATEWAY ROUTES (No Auth Required)
// ==========================================
router.get('/', getReleases);
router.get('/:id', getSingleRelease);

// ==========================================
// ADMIN FORGE ROUTES (Level 5 Clearance)
// ==========================================
// Only System Admins can forge, modify, or terminate release data cores
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createRelease);
router.put('/:id', updateRelease);
router.delete('/:id', deleteRelease);

export default router;