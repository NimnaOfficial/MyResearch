import express from 'express';
import { protect, adminGuard } from '../middleware/auth.middleware';
import { getAllUsers, updateUserRole, deleteUser } from '../controllers/admin.controller';

const router = express.Router();

// =========================================================
// ABSOLUTE SECURITY PERIMETER
// Every route below this line requires BOTH a valid JWT AND Admin clearance
// =========================================================
router.use(protect, adminGuard);

// User Roster Management
router.route('/users')
  .get(getAllUsers);

router.route('/users/:id')
  .delete(deleteUser);

router.route('/users/:id/role')
  .put(updateUserRole);

export default router;