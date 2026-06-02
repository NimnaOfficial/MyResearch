import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username: string };
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }

    // 1. Strip any accidental JSON quotes from localStorage stringification
    token = token.replace(/"/g, '');

    // 2. Strict Secret Verification
    const secret = process.env.JWT_SECRET || 'super_secure_matrix_key_2026';
    const decoded: any = jwt.verify(token, secret);

    // 3. Catch both 'id' and 'userId' depending on how the payload was mapped
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId },
    });

    if (!currentUser) {
      return res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
    }

    req.user = currentUser;
    next();
    
  } catch (error: any) {
    // 🔥 THE FIX: Print the exact cryptographic failure to the backend terminal!
    console.error("🛡️ JWT Security Shield Blocked Request:", error.message);
    return res.status(401).json({ message: 'Matrix Sync Failed: Not authorized. Token invalid or expired.' });
  }
};