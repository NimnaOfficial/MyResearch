import { Router } from 'express';
import {
  createRelease,
  getReleases,
  getSingleRelease,
  updateRelease,
  deleteRelease,
  toggleSaveRelease,
} from '../controllers/release.controller';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC GATEWAY ROUTES (optional auth: admins additionally see full drafts)
// ==========================================
router.get('/', optionalAuth, getReleases);
router.get('/:id', optionalAuth, getSingleRelease);

// ==========================================
// USER PROTECTED ROUTES
// ==========================================
router.post('/:id/save', protect, toggleSaveRelease);

// ==========================================
// ADMIN FORGE ROUTES (Level 5 Clearance)
// ==========================================
router.post('/', protect, restrictTo('admin'), createRelease);
router.put('/:id', protect, restrictTo('admin'), updateRelease);
router.delete('/:id', protect, restrictTo('admin'), deleteRelease);

export default router;
