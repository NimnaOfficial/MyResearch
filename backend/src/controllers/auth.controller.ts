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
  // ADD THIS RADAR PING:
  console.log("[RADAR] Incoming registration request received:", req.body.email);

  const { password, email } = req.body;

  if (!password || !email) {
    return res.status(400).json({ message: 'Incomplete payload. Password and Email required.' });
  }

  const generatedSecretCode = crypto.randomBytes(5).toString('hex').toUpperCase();
  const generatedId = crypto.randomUUID(); 

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // 1. Create the unverified user
  const newUser = await prisma.user.create({
    data: {
      id: generatedId,
      email,
      username: generatedSecretCode, 
      passwordHash,
      isVerified: false, // Explicitly set to false initially
    },
  });

  // 2. Generate a secure, short-lived Verification Token (expires in 1 hour)
  const jwtSecret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
  const verifyToken = jwt.sign({ id: newUser.id }, jwtSecret, { expiresIn: '1h' });

  // 3. Create the frontend URL they will click
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyUrl = `${frontendUrl}/verify?token=${verifyToken}`;

  // 4. Transmit the email
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

  if (!token) {
    return res.status(400).json({ message: 'Missing verification token.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_matrix_key_override_in_production';
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    // Update the database to mark them as verified
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
  
  // NEW: Block login if they haven't verified their email yet!
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