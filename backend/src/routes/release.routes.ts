import { Router } from 'express';
import { createRelease, getReleases, getSingleRelease, updateRelease, deleteRelease } from '../controllers/release.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// Public Routes
router.get('/', getReleases);
router.get('/:id', getSingleRelease);

// Secured Admin Routes
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', createRelease);
router.put('/:id', updateRelease);
router.delete('/:id', deleteRelease);

export default router;