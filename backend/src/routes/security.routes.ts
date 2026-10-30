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
  streamSecurityEvents,
} from '../controllers/security.controller';

const router = express.Router();

// Public Telemetry & SSE Stream Routes (Accessible by all clients, even during lockdown)
router.get('/status', getPublicSecurityStatus);
router.get('/stream', streamSecurityEvents);

// Admin Clearance Routes (Supported with both /dashboard and /admin/dashboard)
router.get(['/dashboard', '/admin/dashboard'], protect, adminGuard, getSecurityDashboard);
router.post(['/lockdown', '/admin/lockdown'], protect, adminGuard, toggleSystemLockdown);
router.post(['/db-hold', '/admin/db-hold'], protect, adminGuard, toggleDatabaseHold);
router.post(['/purge-sessions', '/admin/purge-sessions'], protect, adminGuard, purgeUserSessions);
router.post(['/anti-ddos', '/admin/anti-ddos'], protect, adminGuard, toggleAntiDdos);
router.post(['/mode', '/admin/mode'], protect, adminGuard, setIpFilterMode);
router.post(['/banner', '/admin/banner'], protect, adminGuard, setEmergencyBanner);

// IP Radar Controls
router.get(['/ips', '/admin/ips'], protect, adminGuard, getVisitorIps);
router.post(['/ips/action', '/admin/ips/action'], protect, adminGuard, updateIpStatus);
router.delete(['/ips/:ip', '/admin/ips/:ip'], protect, adminGuard, deleteIpRecord);

// Incident Logs
router.get(['/logs', '/admin/logs'], protect, adminGuard, getIncidentLogs);
router.delete(['/logs', '/admin/logs'], protect, adminGuard, clearIncidentLogs);

export default router;
