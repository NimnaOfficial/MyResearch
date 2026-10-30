import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const useCloudinary =
  process.env.USE_CLOUDINARY === 'true' &&
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let storage: multer.StorageEngine;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'nima_matrix_profiles',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
    } as any,
  });
} else {
  // 100% Local Disk Storage Engine (Zero Cloud Dependencies)
  const uploadsDir = path.resolve(process.cwd(), 'uploads/profiles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: (error: Error | null, destination: string) => void) => {
      cb(null, uploadsDir);
    },
    filename: (_req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const cleanName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, cleanName);
    },
  });
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5 MB, single file
  fileFilter: (_req: any, file: any, cb: (error: any, acceptFile?: boolean) => void) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    const err: any = new Error('Only JPG, PNG or WEBP images are allowed.');
    err.statusCode = 400;
    cb(err);
  },
});
