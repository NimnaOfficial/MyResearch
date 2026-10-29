import express from 'express';
import { protect, adminGuard } from '../middleware/auth.middleware';
import {
  getAllUsers,
  getSystemLogs,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  updateUserIdentity,
  forceCipherOverride,
  toggleUserStatus,
} from '../controllers/admin.controller';

const router = express.Router();

// =========================================================
// ABSOLUTE SECURITY PERIMETER
// Every route below this line requires BOTH a valid JWT AND Admin clearance
// =========================================================
router.use(protect, adminGuard);

// System Telemetry (the frontend polls /stats; /dashboard and the legacy double-prefixed path are kept as aliases)
router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardStats);
router.get('/admin/dashboard', getDashboardStats);

// User Roster Management
router.route('/users').get(getAllUsers);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:id/role').put(updateUserRole);
router.route('/users/:id/identity').put(updateUserIdentity);
router.route('/users/:id/cipher').put(forceCipherOverride);
router.route('/users/:id/status').put(toggleUserStatus);

router.get('/logs', getSystemLogs);

export default router;
