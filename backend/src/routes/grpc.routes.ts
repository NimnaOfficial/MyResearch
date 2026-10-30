import express, { Request, Response } from 'express';
import { securityManager } from '../config/securityState';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';
import { sendFeedbackNotificationEmail, sendContactMessageEmail } from '../utils/sendEmail';

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

      if (method === 'RecordPulse') {
        const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
        securityManager.recordTraffic(clientIp, String(req.headers['user-agent'] || 'gRPC-Web'), payload.path || '/pulse', payload.user || 'GUEST');
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          recorded: true,
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // 2. FeedbackService (Public High-Speed RPC)
    if (service === 'FeedbackService') {
      if (method === 'SubmitFeedback') {
        const { rating, category, priority, recommend, tags, message } = payload;
        
        // Rapid sentiment calculation
        const r = Number(rating) || 5;
        const sentiment = r >= 4 ? 'POSITIVE' : r === 3 ? 'NEUTRAL' : 'CRITICAL';

        // Extract optional user ID from token
        let userId: string | null = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const rawToken = authHeader.slice(7).trim().replace(/"/g, '');
            const decoded = jwt.verify(rawToken, getJwtSecret()) as any;
            if (decoded?.id) userId = decoded.id;
          } catch {}
        }

        let createdId = `fb-${Date.now()}`;
        if (!securityManager.getState().dbConnectionHeld) {
          try {
            const fb = await prisma.feedback.create({
              data: {
                userId,
                rating: r,
                category: String(category || 'GENERAL').toUpperCase(),
                priority: String(priority || 'NORMAL').toUpperCase(),
                recommend: Boolean(recommend),
                tags: String(tags || ''),
                message: String(message || '').slice(0, 1000),
              },
            });
            createdId = fb.id;
          } catch (e) {
            console.warn('[gRPC Feedback] DB write fallback:', e);
          }
        }

        // Dispatch real-time telemetry notification to admin
        let senderInfo = 'GUEST OPERATOR';
        if (userId) {
          try {
            const u = await prisma.user.findUnique({ where: { id: userId }, select: { fullName: true, username: true, email: true } });
            if (u) senderInfo = `${u.fullName || u.username} (${u.email})`;
          } catch {}
        }
        sendFeedbackNotificationEmail(
          senderInfo,
          r,
          String(category || 'GENERAL'),
          String(priority || 'NORMAL'),
          String(message || ''),
          String(tags || 'None')
        ).catch(e => console.error('[gRPC EMAIL] Feedback alert failed:', e));

        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          feedbackId: createdId,
          sentiment,
          score: r,
          timestamp: new Date().toISOString(),
          latencyMs: Date.now() - startTime,
        });
      }

      if (method === 'GetPublicFeedback') {
        let items: any[] = [];
        if (!securityManager.getState().dbConnectionHeld) {
          try {
            items = await prisma.feedback.findMany({
              where: { rating: { gte: 3 } },
              take: 10,
              orderBy: { createdAt: 'desc' },
              select: {
                id: true,
                rating: true,
                category: true,
                message: true,
                createdAt: true,
              },
            });
          } catch {}
        }
        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          count: items.length,
          items,
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // 2.5 ContactService (Public High-Speed RPC)
    if (service === 'ContactService') {
      if (method === 'SendMessage') {
        const { name, email, subject, message } = payload;
        let senderName = String(name || '').trim();
        let senderEmail = String(email || '').trim().toLowerCase();
        const cleanSubject = String(subject || 'Comm-Link Inquiry').trim().slice(0, 150);
        const cleanMessage = String(message || '').trim().slice(0, 5000);

        if (!cleanMessage) {
          res.setHeader('grpc-status', '3'); // INVALID_ARGUMENT
          return res.status(400).json({ success: false, message: 'Message payload is required.' });
        }

        let userId: string | null = null;
        let userRole = 'guest';
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const rawToken = authHeader.slice(7).trim().replace(/"/g, '');
            const decoded = jwt.verify(rawToken, getJwtSecret()) as any;
            if (decoded?.id) {
              userId = decoded.id;
              userRole = decoded.role || 'user';
              const u = await prisma.user.findUnique({ where: { id: decoded.id }, select: { fullName: true, username: true, email: true } });
              if (u) {
                senderName = u.fullName || u.username || senderName;
                senderEmail = u.email || senderEmail;
              }
            }
          } catch {}
        }

        if (!senderName) senderName = senderEmail ? senderEmail.split('@')[0] : 'Guest Operator';
        if (!senderEmail) senderEmail = 'guest@matrix.network';

        let createdId = `msg-${Date.now()}`;
        if (!securityManager.getState().dbConnectionHeld) {
          try {
            const record = await prisma.feedback.create({
              data: {
                userId,
                rating: 5,
                category: 'CONTACT',
                priority: userId ? 'HIGH' : 'MEDIUM',
                tags: `Subject: ${cleanSubject} | From: ${senderName} <${senderEmail}>`,
                recommend: true,
                message: cleanMessage,
              },
            });
            createdId = record.id;
          } catch (e) {
            console.warn('[gRPC Contact] DB write fallback:', e);
          }
        }

        sendContactMessageEmail({
          senderName,
          senderEmail,
          subject: cleanSubject,
          message: cleanMessage,
          isGuest: !userId,
          userRole,
        }).catch(e => console.error('[gRPC Contact] Email dispatch failed:', e));

        res.setHeader('grpc-status', '0');
        res.setHeader('grpc-message', 'OK');
        return res.status(200).json({
          success: true,
          messageId: createdId,
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
