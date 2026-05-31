import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

// Added 'code' to the interface to satisfy TypeScript strict mode
export interface AppError extends Error {
  statusCode?: number;
  code?: string; 
}

export const errorHandler = (
  err: AppError | Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = (err as AppError).statusCode || 500;
  let message = err.message || 'Internal Server Matrix Error';

  // Prisma: Unique Constraint Violation (e.g., Email or Username already exists)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Cryptographic collision: That identity or identifier already exists in the matrix.';
    }
    // Prisma: Record Not Found
    else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Target node not found in the database.';
    }
  } 
  // Prisma: Validation Error (e.g., missing required fields, wrong data types)
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Payload validation failed. Incoming data does not match the database schema.';
  }

  // Log the raw error internally for debugging, but NEVER send it to the client
  console.error(`[ERROR] ${req.method} ${req.path} >>`, err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Only send stack traces in development mode
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};