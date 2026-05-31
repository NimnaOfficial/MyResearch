import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Tell TypeScript that our Express Requests will now have a 'user' object attached
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // 2. Extract the token from the Authorization header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No authentication token provided.' });
  }

  try {
    // 3. Decrypt the token mathematically
    const secret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
    const decoded = jwt.verify(token, secret) as { id: string; username: string };

    // 4. Attach the decrypted identity to the request pipeline
    req.user = decoded;
    
    // 5. Pass control to the next function (the controller)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Access Denied: Token is invalid or expired.' });
  }
};