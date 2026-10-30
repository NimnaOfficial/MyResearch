import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { getJwtSecret } from '../config/env';
import { securityManager, MASTER_ADMIN_CREDENTIALS } from '../config/securityState';

// Tell TypeScript that authenticated requests carry a lightweight 'user' object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        role: string;
      };
    }
  }
}

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  // Strip accidental quotes from JSON-stringified localStorage values
  const token = header.slice(7).trim().replace(/"/g, '');
  return token || null;
};

/** Verifies the JWT and loads a fresh, minimal user record. Returns null if the user is gone. */
const resolveUser = async (token: string) => {
  const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;

  // Tokens minted for e-mail verification must never act as login sessions
  if (decoded.purpose) throw new Error('Token purpose mismatch');

  const id = decoded.id || decoded.userId;
  if (!id) throw new Error('Token has no subject');

  // Master Admin Fallback: Works seamlessly even when DB connection is held or down
  const isMasterAdmin = id === MASTER_ADMIN_CREDENTIALS.id || (decoded.role === 'admin' && securityManager.getState().dbConnectionHeld);
  if (isMasterAdmin) {
    return {
      id: MASTER_ADMIN_CREDENTIALS.id,
      username: MASTER_ADMIN_CREDENTIALS.username,
      role: 'admin',
      status: 'ACTIVE',
    };
  }

  // If DB connection is held, non-admin accounts cannot query database
  if (securityManager.getState().dbConnectionHeld) {
    if (decoded.role === 'admin') {
      return {
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        role: 'admin',
        status: 'ACTIVE',
      };
    }
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, status: true },
    });
    if (user) return user;

    // If user record wasn't found in DB but token holds admin role, grant master admin clearance
    if (decoded.role === 'admin') {
      return {
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        role: 'admin',
        status: 'ACTIVE',
      };
    }
    return null;
  } catch (err) {
    // If DB throws an error but token belongs to an admin, fall back to master admin
    if (decoded.role === 'admin') {
      return {
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        role: 'admin',
        status: 'ACTIVE',
      };
    }
    throw err;
  }
};

// ==========================================
// REQUIRED AUTH: 401 unless a valid, active session is present
// ==========================================
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  try {
    const user = await resolveUser(token);

    if (!user) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
    }

    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error: any) {
    console.warn('[SECURITY] Auth rejected:', error?.message);
    return res.status(401).json({ message: 'Not authorized. Token invalid or expired.' });
  }
};

// ==========================================
// OPTIONAL AUTH: attaches req.user when a valid token is supplied, never blocks
// ==========================================
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const user = await resolveUser(token);
    if (user && user.status !== 'SUSPENDED') {
      req.user = { id: user.id, username: user.username, role: user.role };
    }
  } catch {
    // Invalid token on a public route simply means "treat as guest"
  }
  next();
};

// ==========================================
// ROLE-BASED ACCESS CONTROL
// ==========================================
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'ACCESS DENIED: Insufficient clearance level for this operation.',
      });
    }
    next();
  };
};

export const adminGuard = restrictTo('admin');
