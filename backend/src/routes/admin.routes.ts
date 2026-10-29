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
  createAdminUser,
  regenerateSecretCode,
  getUserVault,
  purgeSystemLogs,
  executeSystemFlush,
} from '../controllers/admin.controller';

const router = express.Router();

// =========================================================
// ABSOLUTE SECURITY PERIMETER
// Every route below this line requires BOTH a valid JWT AND Admin clearance
// =========================================================
router.use(protect, adminGuard);

// System Telemetry
router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardStats);
router.get('/admin/dashboard', getDashboardStats);
router.post('/system/override', executeSystemFlush);

// User Roster Management
router.route('/users').get(getAllUsers).post(createAdminUser);
router.route('/users/:id').delete(deleteUser);
router.route('/users/:id/role').put(updateUserRole);
router.route('/users/:id/identity').put(updateUserIdentity);
router.route('/users/:id/cipher').put(forceCipherOverride);
router.route('/users/:id/status').put(toggleUserStatus);
router.route('/users/:id/regenerate-code').put(regenerateSecretCode);
router.route('/users/:id/vault').get(getUserVault);

// System Logs
router.get('/logs', getSystemLogs);
router.delete('/logs', purgeSystemLogs);

export default router;
