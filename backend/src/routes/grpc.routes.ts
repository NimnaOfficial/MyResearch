import express, { Request, Response } from 'express';
import { securityManager } from '../config/securityState';
import { protect, adminGuard } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * High-Speed gRPC-Web & JSON-RPC Gateway
 * Enables microsecond-level RPC command execution for mission-critical operations.
 */
router.post('/:service/:method', async (req: Request, res: Response) => {
  const { service, method } = req.params;
  const payload = req.body || {};
  const startTime = Date.now();

  // Set standard gRPC protocol headers
  res.setHeader('Content-Type', 'application/grpc-web+json');
  res.setHeader('Access-Control-Expose-Headers', 'grpc-status, grpc-message');

  try {
    // 1. TelemetryService (Public RPCs)
    if (service === 'TelemetryService') {
      if (method === 'GetLiveStatus') {
        const s = securityManager.getState();
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          lockdownEnabled: s.lockdownEnabled,
          dbConnectionHeld: s.dbConnectionHeld,
          antiDdosAggressive: s.antiDdosAggressive,
          ipFilterMode: s.ipFilterMode,
          defconLevel: s.lockdownEnabled ? 1 : s.dbConnectionHeld ? 2 : 5,
          emergencyBanner: s.emergencyBanner,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'PingHealth') {
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          status: 'HEALTHY',
          engine: 'gRPC-Web Micro-Gateway v2.4',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // 2. DefenseControlService & RadarService (Admin Only RPCs)
    // Run authentication guard inline
    let authorized = false;
    let actor = 'gRPC Admin RPC';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim().replace(/"/g, '');
      const jwt = require('jsonwebtoken');
      const { getJwtSecret } = require('../config/env');
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        if (decoded.role === 'admin') {
          authorized = true;
          actor = decoded.username || decoded.email || 'Admin RPC';
        }
      } catch {}
    }

    if (!authorized) {
      res.setHeader('grpc-status', '7'); // PERMISSION_DENIED
      res.setHeader('grpc-message', 'PERMISSION_DENIED: Admin clearance required.');
      return res.status(403).json({
        code: 7,
        message: 'gRPC Permission Denied: Insufficient authorization level for this RPC call.',
      });
    }

    // DefenseControlService Methods
    if (service === 'DefenseControlService') {
      if (method === 'EngageLockdown') {
        const active = securityManager.setLockdown(true, actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          lockdownEnabled: active,
          defconLevel: 1,
          action: 'ENGAGED',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'DisarmLockdown') {
        const active = securityManager.setLockdown(false, actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          lockdownEnabled: active,
          defconLevel: 5,
          action: 'DISARMED',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'HoldDatabase') {
        const held = securityManager.setDbConnectionHeld(true, actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          dbConnectionHeld: held,
          action: 'HELD',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'ReleaseDatabase') {
        const held = securityManager.setDbConnectionHeld(false, actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          dbConnectionHeld: held,
          action: 'RELEASED',
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'PurgeSessions') {
        const ts = securityManager.purgeAllUserSessions(actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          revokedTimestamp: ts,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'SetAntiDdos') {
        const active = securityManager.setAntiDdos(Boolean(payload.aggressive), actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          antiDdosAggressive: active,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // RadarService Methods
    if (service === 'RadarService') {
      if (method === 'QuarantineIp') {
        const { ip, notes } = payload;
        const record = securityManager.setIpStatus(ip, 'blacklisted', notes || 'Quarantined via gRPC RPC', actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          record,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'WhitelistIp') {
        const { ip, notes } = payload;
        const record = securityManager.setIpStatus(ip, 'whitelisted', notes || 'Whitelisted via gRPC RPC', actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          record,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'ResetIp') {
        const { ip } = payload;
        const record = securityManager.setIpStatus(ip, 'allowed', 'Reset via gRPC', actor);
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          record,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // Unknown RPC method
    res.setHeader('grpc-status', '12'); // UNIMPLEMENTED
    res.setHeader('grpc-message', `Method ${service}/${method} not implemented.`);
    return res.status(404).json({
      code: 12,
      message: `gRPC Service/Method ${service}/${method} not found on this endpoint.`,
    });

  } catch (err: any) {
    res.setHeader('grpc-status', '13'); // INTERNAL
    res.setHeader('grpc-message', err.message || 'Internal error.');
    return res.status(500).json({
      code: 13,
      message: err.message || 'gRPC Gateway Execution Failure.',
    });
  }
});

export default router;
