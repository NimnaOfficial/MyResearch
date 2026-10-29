import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { getJwtSecret, getFrontendUrl } from '../config/env';
import { catchAsync } from '../utils/catchAsync';
import { sendSecretCodeEmail } from '../utils/sendEmail';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// ==========================================
// HELPERS
// ==========================================
const signSessionToken = (user: { id: string; username: string; role: string }) =>
  jwt.sign({ id: user.id, username: user.username, role: user.role }, getJwtSecret(), {
    expiresIn: '7d',
  });

/** Records login telemetry + an audit-log entry for a successful handshake. */
const recordSuccessfulLogin = async (userId: string, req: Request) => {
  const ip = req.ip || req.socket.remoteAddress || 'UNKNOWN_IP';
  const userAgent = req.headers['user-agent'] || 'UNKNOWN_DEVICE';

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastIp: String(ip),
      lastUserAgent: userAgent,
      lastDevice: userAgent,
      lastLogin: new Date(),
      requestCount: { increment: 1 },
      logs: {
        create: { action: 'AUTH_HANDSHAKE_SUCCESS', status: 'OK', ip: String(ip) },
      },
    },
  });
};

const recordFailedLogin = async (userId: string, req: Request) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'AUTH_HANDSHAKE_FAILED',
        status: 'WARN',
        ip: String(req.ip || req.socket.remoteAddress || 'UNKNOWN_IP'),
      },
    });
  } catch (err) {
    console.error('[AUTH] Failed to write audit log:', err);
  }
};

// ==========================================
// INITIALIZE IDENTITY (REGISTER)
// ==========================================
export const registerUser = catchAsync(async (req: Request, res: Response) => {
  const { password, fullName, age, phone } = req.body;
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!password || !email) {
    return res.status(400).json({ message: 'Incomplete payload. Password and Email required.' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Invalid email address.' });
  }
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ message: `Backup password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
  }

  // Emails are unique regardless of letter case (normalized to lowercase)
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return res.status(409).json({
      message: 'Cryptographic collision: That identity or identifier already exists in the matrix.',
    });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // The secret code doubles as the unique username; retry on the (very unlikely) collision
  let newUser = null;
  let generatedSecretCode = '';
  for (let attempt = 0; attempt < 5 && !newUser; attempt++) {
    generatedSecretCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    const taken = await prisma.user.findUnique({
      where: { username: generatedSecretCode },
      select: { id: true },
    });
    if (taken) continue;

    newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        username: generatedSecretCode,
        fullName: fullName ? String(fullName).trim() : null,
        age: age ? String(age) : null,
        phone: phone ? String(phone).trim() : null,
        status: 'ACTIVE',
      },
    });
  }

  if (!newUser) {
    return res.status(500).json({ message: 'Could not allocate a unique identity. Please retry.' });
  }

  // Dedicated purpose claim: this token can verify an email but can never act as a login session
  const verifyToken = jwt.sign({ id: newUser.id, purpose: 'verify' }, getJwtSecret(), {
    expiresIn: '1h',
  });
  const verifyUrl = `${getFrontendUrl()}/verify?token=${verifyToken}`;

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

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Missing verification token.' });
  }

  let userId: string;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    if (decoded.purpose !== 'verify' || !decoded.id) throw new Error('Not a verification token');
    userId = decoded.id as string;
  } catch {
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }

  try {
    await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
  } catch {
    return res.status(400).json({ message: 'Invalid or expired verification token.' });
  }

  res.status(200).json({ status: 'success', message: 'Email verified successfully. Link active.' });
});

// ==========================================
// DECRYPT TOKEN (LOGIN) - DUAL PATH
// ==========================================
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { secretCode, password } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  const userSelect = {
    id: true,
    username: true,
    passwordHash: true,
    isVerified: true,
    role: true,
    status: true,
  } as const;

  // ---------------------------------------------------------
  // PATH A: EMAIL + PASSWORD (admins and users with a backup password)
  // ---------------------------------------------------------
  if (email && password) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    });

    if (!user) return res.status(401).json({ message: 'Access Denied: Invalid credentials.' });

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      await recordFailedLogin(user.id, req);
      return res.status(401).json({ message: 'Access Denied: Invalid credentials.' });
    }

    // Admin accounts are provisioned by seed script and are exempt from e-mail verification
    if (user.role !== 'admin' && !user.isVerified) {
      return res.status(403).json({ message: 'Access Denied: Email has not been verified.' });
    }

    await recordSuccessfulLogin(user.id, req);

    return res.status(200).json({
      status: 'success',
      message: 'Admin Link Established.',
      token: signSessionToken(user),
      data: {
        id: user.id,
        secretCode: user.username,
        user: { role: user.role },
      },
    });
  }

  // ---------------------------------------------------------
  // PATH B: STANDARD LOGIN (Secret Code Only)
  // ---------------------------------------------------------
  if (!secretCode || typeof secretCode !== 'string') {
    return res.status(400).json({ message: 'Cryptographic code required.' });
  }

  const user = await prisma.user.findUnique({
    where: { username: secretCode.trim() },
    select: userSelect,
  });

  if (!user) return res.status(401).json({ message: 'Access Denied: Invalid cipher code.' });

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({ message: 'Access Denied: Email has not been verified.' });
  }

  await recordSuccessfulLogin(user.id, req);

  res.status(200).json({
    status: 'success',
    message: 'Link Established.',
    token: signSessionToken(user),
    data: {
      id: user.id,
      secretCode: user.username,
      user: { role: user.role },
    },
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
      status: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'Identity not found in the matrix.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'Active session severed. Node suspended.' });
  }

  // Saved releases live in a separate query so /me keeps working even if the
  // optional "_SavedReleases" table has not been created in the database yet.
  let savedReleases: any[] = [];
  let savedReleaseIds: string[] = [];
  try {
    const withReleases: any = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: {
        savedReleases: {
          select: {
            id: true,
            projectName: true,
            version: true,
            releaseNotes: true,
            published: true,
            createdAt: true,
          },
        },
      },
    });
    savedReleases = withReleases?.savedReleases || [];
    savedReleaseIds = savedReleases.map((r: any) => r.id);
  } catch (err) {
    console.warn('[AUTH] savedReleases unavailable (run prisma/manual/add_saved_releases.sql).');
  }

  res.status(200).json({ status: 'success', data: { ...user, savedReleases, savedReleaseIds } });
});

// ==========================================
// UPDATE PERSONAL IDENTITY (/update)
// ==========================================
export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized: No active session.' });

  const { password, fullName, age, phone } = req.body;

  // Whitelist: only touch the fields that were actually supplied
  const dataToUpdate: Record<string, any> = {};
  if (fullName !== undefined) dataToUpdate.fullName = fullName ? String(fullName).trim() : null;
  if (age !== undefined) dataToUpdate.age = age ? String(age) : null;
  if (phone !== undefined) dataToUpdate.phone = phone ? String(phone).trim() : null;

  if (typeof password === 'string' && password.trim() !== '') {
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res
        .status(400)
        .json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }
    dataToUpdate.passwordHash = await bcrypt.hash(password, 12);
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return res.status(400).json({ message: 'No valid fields supplied for update.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: { id: true, fullName: true, age: true, phone: true, username: true, email: true },
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

  // Seamlessly support both Cloudinary (remote URL in req.file.path) and local disk storage
  const isRemote = (req.file as any).path && String((req.file as any).path).startsWith('http');
  const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
  const protocol = req.protocol || 'http';
  const imageUrl = isRemote
    ? (req.file as any).path
    : `${protocol}://${host}/uploads/profiles/${req.file.filename}`;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { profilePic: imageUrl },
    select: { id: true, profilePic: true },
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});
