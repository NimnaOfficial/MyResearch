import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendSecretCodeEmail } from '../utils/sendEmail';

// ==========================================
// INITIALIZE IDENTITY (REGISTER)
// ==========================================
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  console.log("[RADAR] Incoming registration request received:", req.body.email);
  
  // 🔥 DEV RADAR: This will print EXACTLY what your frontend sends!
  console.log("[PAYLOAD CHECK]:", req.body);

  const { password, email, fullName, age, phone } = req.body;

  if (!password || !email) {
    return res.status(400).json({ message: 'Incomplete payload. Password and Email required.' });
  }

  const generatedSecretCode = crypto.randomBytes(5).toString('hex').toUpperCase();
  const generatedId = crypto.randomUUID(); 

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash: passwordHash,
      username: generatedSecretCode,         
      fullName: fullName || null,
      age: age || null,
      phone: phone || null
    }
  });

  const jwtSecret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
  const verifyToken = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '1h' });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify?token=${verifyToken}`;

  try {
    await sendSecretCodeEmail(email, generatedSecretCode, verifyUrl);
  } catch (error) {
    console.error('[ERROR] Mail transmission failed:', error);
  }

  res.status(201).json({
    status: 'success',
    message: 'Identity initialized. Check your email to verify and activate your cipher.',
    data: { secretCode: newUser.username },
  });
});

// ==========================================
// VERIFY EMAIL ENDPOINT
// ==========================================
export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) return res.status(400).json({ message: 'Missing verification token.' });

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    await prisma.user.update({
      where: { id: decoded.id },
      data: { isVerified: true },
    });

    res.status(200).json({ status: 'success', message: 'Email verified successfully. Link active.' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }
});

// ==========================================
// DECRYPT TOKEN (LOGIN)
// ==========================================
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { secretCode } = req.body;

  if (!secretCode) return res.status(400).json({ message: 'Cryptographic code required.' });

  const user = await prisma.user.findUnique({ 
    where: { username: secretCode },
    select: { id: true, username: true, passwordHash: true, isVerified: true }
    
  });

  if (!user) return res.status(401).json({ message: 'Access Denied: Invalid cipher code.' });
  
  if (!user.isVerified) {
    return res.status(403).json({ message: 'Access Denied: Email has not been verified.' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production',
    { expiresIn: '7d' }
  );

  res.status(200).json({
    status: 'success',
    message: 'Link Established.',
    token,
    data: { id: user.id, secretCode: user.username }
  });
});

// ==========================================
// FETCH PERSONAL IDENTITY (/me)
// ==========================================

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      include: { savedPosts: true } 

  if (!userId) return res.status(401).json({ message: 'Unauthorized: No active session.' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      age: true,
      phone: true,
      // 🔥 THE FIX: Tell Prisma to grab the Profile Picture URL!
      profilePic: true, 
      isVerified: true,
      createdAt: true,
      savedPosts: true,
    },

  });

  if (!user) return res.status(404).json({ message: 'Identity not found in the matrix.' });

  res.status(200).json({ status: 'success', data: user });
});

// ==========================================
// UPDATE PERSONAL IDENTITY (/update)
// ==========================================
export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized: No active session.' });

  const { email, password, fullName, age, phone } = req.body;
  const dataToUpdate: any = { fullName, age, phone };

  if (password && password.trim() !== "") {
    const bcrypt = require('bcrypt');
    dataToUpdate.passwordHash = await bcrypt.hash(password, 12);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: { id: true, fullName: true, age: true, phone: true, username: true, email: true } 
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});

// ==========================================
// UPLOAD PROFILE PICTURE (/upload-pic)
// ==========================================
export const uploadProfilePic = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ message: 'No image provided' });

  // 🔥 THE FIX: Cloudinary automatically injects the secure cloud URL into `req.file.path`
  const cloudImageUrl = req.file.path; 

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePic: cloudImageUrl },
    select: { id: true, profilePic: true }
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});