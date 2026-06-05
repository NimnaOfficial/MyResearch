import { Router } from 'express';
import { getAllShowcases, createShowcase, updateShowcase, deleteShowcase } from '../controllers/showcase.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getAllShowcases);
router.use(protect, restrictTo('admin'));
router.post('/', createShowcase);
router.put('/:id', updateShowcase);
router.delete('/:id', deleteShowcase);
export default router;