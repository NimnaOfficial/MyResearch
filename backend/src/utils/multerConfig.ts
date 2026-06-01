import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Define where and how the image is saved safely
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    const dir = 'uploads/profiles';
    // Create the folder if it doesn't exist
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Use the user's ID from the token to name the file safely
    const userId = (req as any).user?.id || 'guest';
    cb(null, userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter to strictly allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'));
  }
};

export const upload = multer({ storage, fileFilter });