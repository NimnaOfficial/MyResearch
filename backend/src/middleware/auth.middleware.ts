import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';



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

// Add this right below your existing `protect` middleware function

export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if the verified user object exists and has the 'admin' role
    if (req.user && req.user.role === 'admin') {
      next(); // Access Granted: Proceed to controller
    } else {
      console.warn(`⚠️ [SECURITY] Unauthorized elevated access attempt by User ID: ${req.user?.id}`);
      return res.status(403).json({ 
        message: 'Access Denied: Elevated Admin Clearance Required.' 
      });
    }
  } catch (error) {
    console.error("🛡️ Admin Shield Error:", error);
    return res.status(500).json({ message: 'Internal Matrix Error during clearance verification.' });
  }
};