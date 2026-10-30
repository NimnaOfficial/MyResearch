import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityManager } from '../config/securityState';
import { getJwtSecret } from '../config/env';

export const securityGuard = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'UNKNOWN';
  const path = req.path;

  // Extract token if present (without blocking or throwing)
  let currentUserRole: string | null = null;
  let currentUserIdentifier: string = 'GUEST';
  let tokenIat: number = 0;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const rawToken = authHeader.slice(7).trim().replace(/"/g, '');
    try {
      const decoded = jwt.verify(rawToken, getJwtSecret()) as any;
      if (decoded && decoded.role) {
        currentUserRole = decoded.role;
        currentUserIdentifier = decoded.email || decoded.username || decoded.id || 'USER';
        tokenIat = (decoded.iat || 0) * 1000;
      }
    } catch {
      // Token invalid or expired - treat as guest
    }
  }

  // 1. IP Traffic Auditing: Record visit
  const ipCheck = securityManager.recordTraffic(clientIp, userAgent, path, currentUserIdentifier);

  // Allow health check and security status without restrictions
  if (path === '/api/health' || path === '/api/security/status') {
    return next();
  }

  // 2. IP Blacklist & Whitelist Enforcement (Admins bypass IP ban to avoid accidental lockout)
  if (!ipCheck.allowed && currentUserRole !== 'admin') {
    securityManager.logIncident('WARN', `BLOCKED ACCESS ATTEMPT FROM IP: ${clientIp}`, 'Perimeter Firewall', `Path: ${path}, Reason: ${ipCheck.reason}`, clientIp);
    return res.status(403).json({
      error: 'IP_ACCESS_DENIED',
      message: 'ACCESS DENIED: Your IP address has been isolated by the Platform Security Perimeter.',
      reason: ipCheck.reason,
      ip: clientIp,
    });
  }

  // 3. Global Session Purge Enforcement
  const state = securityManager.getState();
  if (currentUserRole && currentUserRole !== 'admin' && state.sessionRevocationTimestamp > 0) {
    if (tokenIat > 0 && tokenIat < state.sessionRevocationTimestamp) {
      return res.status(401).json({
        error: 'SESSION_REVOKED',
        message: 'CRITICAL SECURITY ALERT: All active user sessions were purged by the System Administrator. Please re-authenticate.',
      });
    }
  }

  // 4. DEFCON 1 Emergency System Lockdown Enforcement
  if (state.lockdownEnabled) {
    const isExemptPath = 
      path.startsWith('/api/security/status') || 
      path === '/api/auth/login' || 
      path === '/api/auth/me';

    if (!isExemptPath && currentUserRole !== 'admin') {
      securityManager.logIncident('WARN', `LOCKDOWN BLOCKED REQUEST: ${path}`, 'Emergency Lockdown Enforcer', `Blocked non-admin from IP ${clientIp}`, clientIp);
      return res.status(423).json({
        status: 'LOCKDOWN',
        error: 'SYSTEM_LOCKDOWN_ACTIVE',
        message: 'DEFCON 1 ACTIVE: Whole platform is in emergency lockdown. Access restricted exclusively to Master System Administrator.',
        lockdown: true,
      });
    }
  }

  // 5. Database Circuit Breaker (DB Connection Held)
  if (state.dbConnectionHeld) {
    // Only permit admin endpoints and security routes when DB is held
    const isExemptFromDb = 
      path.startsWith('/api/security') || 
      path.startsWith('/api/admin/security') ||
      path === '/api/auth/login';

    if (!isExemptFromDb) {
      return res.status(503).json({
        error: 'DB_CONNECTION_HELD',
        message: 'DATABASE CIRCUIT BREAKER ACTIVE: Database connection has been held by System Administrator for emergency integrity protection.',
        dbHeld: true,
      });
    }
  }

  next();
};
