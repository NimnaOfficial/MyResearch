import { Router } from 'express';
import { getAllFaqs, createFaq, updateFaq, deleteFaq } from '../controllers/faq.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getAllFaqs);
router.use(protect, restrictTo('admin'));
router.post('/', createFaq);
router.put('/:id', updateFaq);
router.delete('/:id', deleteFaq);
export default router;