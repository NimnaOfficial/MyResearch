import { Router } from 'express';
import { createRelease, getReleases } from '../controllers/release.controller';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../config/prisma';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const releases = await prisma.release.findMany({ orderBy: { publishedAt: 'desc' } });
    res.status(200).json({ status: 'success', data: releases });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch pipelines.' });
  }
});
// PUBLIC ROUTE: Anyone can view the software releases
router.get('/', getReleases);

// PROTECTED ROUTE: Only you (authenticated) can post a new release
router.post('/', requireAuth, createRelease);

export default router;