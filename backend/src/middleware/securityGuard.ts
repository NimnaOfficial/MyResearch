import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { securityManager } from '../config/securityState';
import { getJwtSecret } from '../config/env';

export const securityGuard = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'UNKNOWN';
  const path = req.path;

  // 0. Defense Cloaking & Header Obfuscation (Hides server fingerprint from network sniffers)
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 1. Extract Token Early for Administrative Clearance Check
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

  // 2. 🛡️ ABSOLUTE ADMIN REALTIME IP IMMUNITY (Never blocked for ANY reason or condition)
  const isAdminImmune = currentUserRole === 'admin' || securityManager.isImmuneAdminIp(clientIp);
  if (isAdminImmune) {
    securityManager.grantAdminIpImmunity(clientIp, currentUserIdentifier);
    // Unconditional perimeter pass for Admin Node
    return next();
  }

  // 3. Automated Exploitation & Honeypot Trap (Non-Admins Only)
  const EXPLOIT_PROBES = [/\.env/i, /\.git/i, /wp-admin/i, /phpmyadmin/i, /actuator/i, /select.*from/i, /union.*select/i, /<script>/i];
  if (EXPLOIT_PROBES.some(p => p.test(path) || p.test(String(req.query?.q || '')))) {
    securityManager.setIpStatus(clientIp, 'blacklisted', `Malicious vulnerability probe: ${path}`, 'Automated Cyber Shield');
    securityManager.logIncident('CRITICAL', `EXPLOIT PROBE DETECTED & IP ISOLATED: ${clientIp}`, 'Cyber Shield', `Path: ${path}`, clientIp);
    return res.status(403).json({ error: 'PERIMETER_PROBE_ISOLATED', message: 'Access Denied.' });
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
    // Admins always bypass the circuit breaker so they can inspect and disarm it
    if (currentUserRole === 'admin') {
      return next();
    }

    // Only permit admin endpoints, security routes, and multi-protocol gateways when DB is held
    const isExemptFromDb = 
      path.startsWith('/api/security') || 
      path.startsWith('/api/admin/security') ||
      path.startsWith('/api/grpc') ||
      path.startsWith('/api/graphql') ||
      path.startsWith('/api/soap') ||
      path === '/api/auth/login' ||
      path === '/api/auth/me' ||
      path === '/api/health';

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
