import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import prisma from '../config/prisma';
import { getJwtSecret, getFrontendUrl } from '../config/env';
import { catchAsync } from '../utils/catchAsync';
import { sendSecretCodeEmail, sendRecoveryAlertToAdmin } from '../utils/sendEmail';
import { securityManager, MASTER_ADMIN_CREDENTIALS } from '../config/securityState';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Helper to save base64 avatar to local disk
const saveBase64Avatar = (base64Str: string, host: string, protocol: string): string | null => {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const uploadsDir = path.resolve(process.cwd(), 'uploads/profiles');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);
    return `${protocol}://${host}/uploads/profiles/${filename}`;
  } catch (err) {
    console.error('[AUTH] Failed to save base64 avatar:', err);
    return null;
  }
};

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
  const { password, fullName, age, phone, profilePic } = req.body;
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

  // Resolve profile picture if supplied during registration (URL or base64 data)
  let resolvedProfilePic: string | null = null;
  if (typeof profilePic === 'string' && profilePic.trim() !== '') {
    if (profilePic.startsWith('data:image/')) {
      const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
      const protocol = req.protocol || 'http';
      resolvedProfilePic = saveBase64Avatar(profilePic, host, protocol);
    } else if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
      resolvedProfilePic = profilePic.trim();
    }
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
        profilePic: resolvedProfilePic,
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
    mustChangePassword: true,
    recoveryRequested: true,
  } as const;

  // ---------------------------------------------------------
  // PATH A: EMAIL + PASSWORD (admins and users with a backup password)
  // ---------------------------------------------------------
  if (email && password) {
    // 1. MASTER HARDCODED ADMIN CREDENTIALS OVERRIDE (Immune to DB disconnection/outages)
    const isMasterEmail = email.toLowerCase() === MASTER_ADMIN_CREDENTIALS.email.toLowerCase();
    const isMasterPassword = password === MASTER_ADMIN_CREDENTIALS.password;

    if (isMasterEmail && isMasterPassword) {
      securityManager.logIncident(
        'INFO',
        'MASTER ADMIN ROOT HANDSHAKE ESTABLISHED (HARDCODED OVERRIDE)',
        MASTER_ADMIN_CREDENTIALS.username,
        'Authenticated via Master Credentials.',
        String(req.ip || '127.0.0.1')
      );

      const masterUser = {
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        role: 'admin',
      };
      const token = signSessionToken(masterUser);

      return res.status(200).json({
        status: 'success',
        message: 'Master Admin Root Link Established (Emergency Hardcoded Override).',
        token,
        mustChangePassword: false,
        secretCode: MASTER_ADMIN_CREDENTIALS.username,
        data: {
          id: MASTER_ADMIN_CREDENTIALS.id,
          secretCode: MASTER_ADMIN_CREDENTIALS.username,
          mustChangePassword: false,
          user: {
            role: 'admin',
            fullName: MASTER_ADMIN_CREDENTIALS.fullName,
            email: MASTER_ADMIN_CREDENTIALS.email,
          },
        },
      });
    }

    // If DB connection is held and not master admin credentials, halt with DB circuit breaker
    if (securityManager.getState().dbConnectionHeld) {
      return res.status(503).json({
        error: 'DB_CONNECTION_HELD',
        message: 'DATABASE CIRCUIT BREAKER ACTIVE: Database connection has been held by System Administrator. Only Master Admin may authenticate.',
      });
    }

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

    // If a regular user logged in with their backup password, enforce mandatory password change
    const isEmergencyUserLogin = user.role !== 'admin';
    if (isEmergencyUserLogin) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mustChangePassword: true,
          recoveryRequested: false,
        },
      });

      return res.status(200).json({
        status: 'success',
        message: 'Emergency access granted via backup password. Mandatory password reset required.',
        token: signSessionToken(user),
        mustChangePassword: true,
        secretCode: user.username,
        data: {
          id: user.id,
          secretCode: user.username,
          mustChangePassword: true,
          user: { role: user.role },
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Admin Link Established.',
      token: signSessionToken(user),
      mustChangePassword: Boolean(user.mustChangePassword),
      secretCode: user.username,
      data: {
        id: user.id,
        secretCode: user.username,
        mustChangePassword: Boolean(user.mustChangePassword),
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

  // Security Perimeter: Admin accounts are strictly barred from single-code login. Master credentials required.
  if (user.role === 'admin') {
    return res.status(403).json({
      message: 'Access Denied: Level 5 Admin nodes must authenticate via master credentials (email and password).',
    });
  }

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
    mustChangePassword: Boolean(user.mustChangePassword),
    secretCode: user.username,
    data: {
      id: user.id,
      secretCode: user.username,
      mustChangePassword: Boolean(user.mustChangePassword),
      user: { role: user.role },
    },
  });
});

// ==========================================
// REQUEST SECRET CODE RECOVERY (NOTIFY ADMIN)
// ==========================================
export const requestCodeRecovery = catchAsync(async (req: Request, res: Response) => {
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, username: true, status: true },
  });

  if (!user) {
    // Return friendly generic acknowledgment to prevent user enumeration
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists with this email address, a regeneration request has been dispatched to the System Administrator.',
    });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ message: 'ACCESS DENIED: NODE SUSPENDED BY SYSTEM ADMIN.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryRequested: true },
  });

  try {
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'AUTH_CODE_RECOVERY_REQUESTED',
        status: 'WARN',
        ip: String(req.ip || req.socket.remoteAddress || 'UNKNOWN_IP'),
      },
    });
  } catch (e) {
    console.error('[AUTH] Failed to log recovery request:', e);
  }

  // Dispatch background email notification to admin
  try {
    await sendRecoveryAlertToAdmin(user.email, user.fullName || user.username, user.id);
  } catch (e) {
    console.error('[EMAIL] Failed to alert admin of recovery request:', e);
  }

  res.status(200).json({
    status: 'success',
    message: 'Recovery request successfully submitted to the System Administrator. Your new login code will be transmitted to your email upon approval.',
  });
});

// ==========================================
// MANDATORY BACKUP PASSWORD RESET
// ==========================================
export const resetBackupPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized: No active session.' });

  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: `New backup password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New backup passwords do not match.' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashedPassword,
      mustChangePassword: false,
      recoveryRequested: false,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      mustChangePassword: true,
    },
  });

  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'BACKUP_PASSWORD_RESET_SUCCESS',
        status: 'OK',
        ip: String(req.ip || req.socket.remoteAddress || 'UNKNOWN_IP'),
      },
    });
  } catch (e) {
    console.error('[AUTH] Failed to log password reset:', e);
  }

  res.status(200).json({
    status: 'success',
    message: 'Backup password successfully updated. System clearance confirmed.',
    token: signSessionToken(updatedUser),
    data: {
      id: updatedUser.id,
      secretCode: updatedUser.username,
      mustChangePassword: false,
      user: { role: updatedUser.role },
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

  // Master hardcoded admin or DB held bypass
  if (userId === MASTER_ADMIN_CREDENTIALS.id || (req.user?.role === 'admin' && securityManager.getState().dbConnectionHeld)) {
    return res.status(200).json({
      status: 'success',
      data: {
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        email: MASTER_ADMIN_CREDENTIALS.email,
        fullName: MASTER_ADMIN_CREDENTIALS.fullName,
        role: 'admin',
        status: 'ACTIVE',
        isVerified: true,
        mustChangePassword: false,
        savedPosts: [],
        savedReleases: [],
        savedReleaseIds: [],
      },
    });
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
      mustChangePassword: true,
      recoveryRequested: true,
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

  const { password, fullName, age, phone, profilePic } = req.body;

  // Whitelist: only touch the fields that were actually supplied
  const dataToUpdate: Record<string, any> = {};
  if (fullName !== undefined) dataToUpdate.fullName = fullName ? String(fullName).trim() : null;
  if (age !== undefined) dataToUpdate.age = age ? String(age) : null;
  if (phone !== undefined) dataToUpdate.phone = phone ? String(phone).trim() : null;

  if (profilePic !== undefined) {
    if (!profilePic) {
      dataToUpdate.profilePic = null;
    } else if (typeof profilePic === 'string' && profilePic.startsWith('data:image/')) {
      const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
      const protocol = req.protocol || 'http';
      dataToUpdate.profilePic = saveBase64Avatar(profilePic, host, protocol);
    } else if (typeof profilePic === 'string') {
      dataToUpdate.profilePic = profilePic.trim();
    }
  }

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
    select: { id: true, fullName: true, age: true, phone: true, username: true, email: true, profilePic: true },
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
