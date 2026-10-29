import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export interface AppError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
}

// Unknown API route
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl.split('?')[0]}`,
  });
};

export const errorHandler = (
  err: AppError | Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appErr = err as AppError;
  let statusCode = appErr.statusCode || appErr.status || 500;
  let message = err?.message || 'Internal Server Matrix Error';

  const rawMsg = String(err?.message || '') + ' ' + String(err?.cause?.originalMessage || '');
  const isSupabasePaused =
    rawMsg.includes('tenant/user') ||
    (rawMsg.includes('tenant') && rawMsg.includes('not found')) ||
    err?.cause?.code === 'XX000';

  if (isSupabasePaused) {
    statusCode = 503;
    message =
      'Database offline: Supabase project is PAUSED due to free-tier inactivity. Go to https://supabase.com/dashboard to restore it, or switch DATABASE_URL to your local PostgreSQL server.';
    console.error(
      `\n[DATABASE ALERT] ${req.method} ${req.path} >> Supabase project is PAUSED.\n` +
      `  -> Visit https://supabase.com/dashboard to unpause/restore your project.\n` +
      `  -> Or update DATABASE_URL in backend/.env to point to your local PostgreSQL server.\n`
    );
  }
  // Prisma: Unique Constraint Violation (e.g., Email or Username already exists)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Cryptographic collision: That identity or identifier already exists in the matrix.';
    }
    // Prisma: Record Not Found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Target node not found in the database.';
    } else {
      statusCode = 500;
      message = 'Database operation failed.';
    }
    console.error(`[ERROR] ${req.method} ${req.path} >>`, err);
  }
  // Prisma: Validation Error (e.g., missing required fields, wrong data types)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Payload validation failed. Incoming data does not match the database schema.';
    console.error(`[ERROR] ${req.method} ${req.path} >>`, err);
  }
  // Multer: oversized / malformed uploads are the client's fault
  else if (err?.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5 MB).' : 'Invalid upload.';
    console.error(`[ERROR] ${req.method} ${req.path} >>`, err);
  } else {
    // Log standard error
    console.error(`[ERROR] ${req.method} ${req.path} >>`, err);
  }

  // In production, never leak raw internal stack traces for unhandled 500 errors
  if (statusCode >= 500 && !isSupabasePaused && process.env.NODE_ENV === 'production') {
    message = 'Internal Server Matrix Error';
  }

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only send stack traces in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
