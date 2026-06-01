import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Authenticate with your Cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure the Cloud Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'nima_matrix_profiles', // The folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }] // AI auto-focuses on the face!
  } as any
});

export const upload = multer({ storage });