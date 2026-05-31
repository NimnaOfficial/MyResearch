import { Router } from 'express';
import { createRelease, getReleases } from '../controllers/release.controller';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// PUBLIC ROUTE: Anyone can view the software releases
router.get('/', getReleases);

// PROTECTED ROUTE: Only you (authenticated) can post a new release
router.post('/', requireAuth, createRelease);

export default router;