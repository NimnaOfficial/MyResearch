import express from 'express';
import { protect, adminGuard } from '../middleware/auth.middleware';
import {
  getPublicSecurityStatus,
  getSecurityDashboard,
  toggleSystemLockdown,
  toggleDatabaseHold,
  purgeUserSessions,
  toggleAntiDdos,
  setIpFilterMode,
  setEmergencyBanner,
  getVisitorIps,
  updateIpStatus,
  deleteIpRecord,
  getIncidentLogs,
  clearIncidentLogs,
} from '../controllers/security.controller';

const router = express.Router();

// Public Telemetry Route (Accessible by all clients, even during lockdown)
router.get('/status', getPublicSecurityStatus);

// Admin Clearance Area
router.use('/admin', protect, adminGuard);

router.get('/admin/dashboard', getSecurityDashboard);
router.post('/admin/lockdown', toggleSystemLockdown);
router.post('/admin/db-hold', toggleDatabaseHold);
router.post('/admin/purge-sessions', purgeUserSessions);
router.post('/admin/anti-ddos', toggleAntiDdos);
router.post('/admin/mode', setIpFilterMode);
router.post('/admin/banner', setEmergencyBanner);

// IP Radar Controls
router.get('/admin/ips', getVisitorIps);
router.post('/admin/ips/action', updateIpStatus);
router.delete('/admin/ips/:ip', deleteIpRecord);

// Incident Logs
router.get('/admin/logs', getIncidentLogs);
router.delete('/admin/logs', clearIncidentLogs);

export default router;
