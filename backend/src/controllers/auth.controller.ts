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
  console.log("[PAYLOAD CHECK]:", req.body);

  const { password, email, fullName, age, phone } = req.body;

  if (!password || !email) {
    return res.status(400).json({ message: 'Incomplete payload. Password and Email required.' });
  }

  const generatedSecretCode = crypto.randomBytes(5).toString('hex').toUpperCase();

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash: passwordHash,
      username: generatedSecretCode,         
      fullName: fullName || null,
      age: age ? String(age) : null,
      phone: phone || null,
      status: 'ACTIVE' // Explicitly setting default status
    }
  });

  const jwtSecret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
  const verifyToken = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '1h' });

  const frontendUrl = process.env.FRONTEND_URL || 'https://csxpidia.vercel.app';
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
// DECRYPT TOKEN (LOGIN) - DUAL PATH
// ==========================================
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { secretCode, email, password } = req.body;

  // ---------------------------------------------------------
  // PATH A: MASTER ADMIN OVERRIDE (Email + Password)
  // ---------------------------------------------------------
  if (email && password) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      // 🔥 FIX: Added 'status: true' so the bouncer can read it
      select: { id: true, username: true, passwordHash: true, isVerified: true, role: true, status: true } 
    });

    if (!user) return res.status(401).json({ message: 'Access Denied: Invalid credentials.' });
    
    // 🔥 THE SUSPENSION BOUNCER
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Access Denied: Invalid credentials.' });

    // ==========================================
    // 🚨 TELEMETRY TRACKER INJECTION
    // ==========================================
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN_DEVICE';
    const device = req.headers['user-agent'] || 'UNKNOWN';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastIp: String(ip),
        lastUserAgent: userAgent,
        lastDevice: device,
        lastLogin: new Date(),
        requestCount: { increment: 1 },
        logs: {
          create: {
            action: 'AUTH_HANDSHAKE_SUCCESS',
            status: 'OK',
            ip: String(ip)
          }
        }
      }
    });
    // ==========================================

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Admin Link Established.',
      token,
      data: { 
        id: user.id, 
        secretCode: user.username, 
        user: { role: user.role } 
      }
    });
  }

  // ---------------------------------------------------------
  // PATH B: STANDARD GUEST LOGIN (Secret Code Only)
  // ---------------------------------------------------------
  if (!secretCode) return res.status(400).json({ message: 'Cryptographic code required.' });

  const user = await prisma.user.findUnique({ 
    where: { username: secretCode },
    // 🔥 FIX: Added 'status: true' so the bouncer can read it
    select: { id: true, username: true, passwordHash: true, isVerified: true, role: true, status: true }
  });

  if (!user) return res.status(401).json({ message: 'Access Denied: Invalid cipher code.' });
  
  // 🔥 THE SUSPENSION BOUNCER
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Access Denied: Email has not been verified.' });
  }

  // ==========================================
    // 🚨 TELEMETRY TRACKER INJECTION
    // ==========================================
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'UNKNOWN_IP';
    const userAgent = req.headers['user-agent'] || 'UNKNOWN_DEVICE';
    const device = req.headers['user-agent'] || 'UNKNOWN';

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastIp: String(ip),
        lastUserAgent: userAgent,
        lastDevice: device,
        lastLogin: new Date(),
        requestCount: { increment: 1 },
        logs: {
          create: {
            action: 'AUTH_HANDSHAKE_SUCCESS',
            status: 'OK',
            ip: String(ip)
          }
        }
      }
    });
    // ==========================================

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production',
    { expiresIn: '7d' }
  );

  res.status(200).json({
    status: 'success',
    message: 'Link Established.',
    token,
    data: { 
      id: user.id, 
      secretCode: user.username,
      user: { role: user.role }
    }
  });
});

// ==========================================
// FETCH PERSONAL IDENTITY (/me)
// ==========================================
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: No active session.' });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      age: true,
      phone: true,
      profilePic: true,
      isVerified: true,
      createdAt: true,
      savedPosts: true, 
      role: true, 
      status: true
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'Identity not found in the matrix.' });
  }

  // Double-check active session status
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'Active session severed. Node suspended.' });
  }

  res.status(200).json({ status: 'success', data: user });
});

// ==========================================
// UPDATE PERSONAL IDENTITY (/update)
// ==========================================
export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized: No active session.' });

  const { email, password, fullName, age, phone } = req.body;
  const dataToUpdate: any = { fullName, age: age ? String(age) : null, phone };

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

  const cloudImageUrl = req.file.path; 

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePic: cloudImageUrl },
    select: { id: true, profilePic: true }
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});