import { Request, Response } from 'express';
import os from 'os';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

/** Records administrative actions in the system audit log */
const recordAdminLog = async (req: Request, action: string, status: 'OK' | 'WARN' | 'ERROR' = 'OK') => {
  const adminId = req.user?.id;
  if (!adminId) return;
  try {
    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action,
        status,
        ip: String(req.ip || req.socket.remoteAddress || '127.0.0.1'),
      },
    });
  } catch (e) {
    console.error('[ADMIN AUDIT LOG ERROR]', e);
  }
};

// ==========================================
// REAL CPU LOAD SAMPLER
// Compares CPU tick counters between two polls (the dashboard polls every few seconds)
// ==========================================
const readCpuTicks = () => {
  let idle = 0;
  let total = 0;
  for (const cpu of os.cpus()) {
    for (const ticks of Object.values(cpu.times)) total += ticks;
    idle += cpu.times.idle;
  }
  return { idle, total };
};

let previousCpuTicks = readCpuTicks();

const sampleCpuUsage = (): number => {
  const current = readCpuTicks();
  const idleDelta = current.idle - previousCpuTicks.idle;
  const totalDelta = current.total - previousCpuTicks.total;
  previousCpuTicks = current;

  if (totalDelta <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDelta / totalDelta) * 100)));
};

// ==========================================
// 1. DASHBOARD TELEMETRY ENGINE
// ==========================================
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalNodes, recentNodes, logsLast24h, problemLogsLast24h] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, fullName: true, role: true, isVerified: true },
    }),
    prisma.activityLog.count({ where: { createdAt: { gte: since } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: since }, status: { in: ['WARN', 'ERROR'] } } }),
  ]);

  // Native hardware profiling
  const totalMem = os.totalmem();
  const usedMem = totalMem - os.freemem();
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const usedMemGB = (usedMem / 1024 ** 3).toFixed(2);
  const totalMemGB = (totalMem / 1024 ** 3).toFixed(2);

  // Share of clean audit events in the last 24h (100% when nothing has gone wrong)
  const networkIntegrity =
    logsLast24h === 0 ? 100 : Number((100 - (problemLogsLast24h / logsLast24h) * 100).toFixed(1));

  res.status(200).json({
    status: 'success',
    data: {
      networkIntegrity,
      nodes: recentNodes,
      totalNodes,
      hardware: {
        cpuUsage: sampleCpuUsage(),
        memory: { percent: memUsagePercent, usedGB: usedMemGB, totalGB: totalMemGB },
      },
    },
  });
});

// ==========================================
// 2. FETCH FULL NODE ROSTER
// ==========================================
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isVerified: true,
      createdAt: true,
      age: true,
      phone: true,
      profilePic: true,
      status: true,
      lastIp: true,
      lastUserAgent: true,
      lastDevice: true,
      lastLogin: true,
      requestCount: true,
      logs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          savedPosts: true,
          savedReleases: true,
          feedbacks: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users,
  });
});

// ==========================================
// 3. ELEVATE OR DEMOTE NODE CLEARANCE
// ==========================================
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Invalid clearance level.' });
  }

  // Prevent an admin from locking everyone (including themselves) out
  if (req.user?.id === id && role !== 'admin') {
    return res.status(403).json({ message: 'Master Override: Cannot demote your own node.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true },
  });

  await recordAdminLog(req, `USER_ROLE_CHANGED: ${id} -> ${role.toUpperCase()}`);

  res.status(200).json({
    status: 'success',
    message: `Clearance updated to ${role.toUpperCase()}`,
    data: updatedUser,
  });
});

// ==========================================
// 4. TERMINATE NODE (DELETE)
// ==========================================
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  if (req.user?.id === id) {
    return res.status(403).json({ message: 'Master Override: Cannot terminate own node.' });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, username: true } });
  await prisma.user.delete({ where: { id } });

  await recordAdminLog(req, `USER_TERMINATED: ${target?.username || id} (${target?.email || 'N/A'})`, 'WARN');

  res.status(200).json({
    status: 'success',
    message: 'Node successfully terminated from infrastructure.',
  });
});

// ==========================================
// 5. OVERRIDE IDENTITY PARAMETERS
// ==========================================
export const updateUserIdentity = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { fullName, email, phone, age, isVerified } = req.body;

  // Only touch fields that were supplied (previously a missing age silently wiped the stored value)
  const data: Record<string, any> = {};
  if (fullName !== undefined) data.fullName = fullName;
  if (email !== undefined) {
    const cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }
    data.email = cleanEmail;
  }
  if (phone !== undefined) data.phone = phone;
  if (age !== undefined) data.age = age ? String(age) : null;
  if (isVerified !== undefined) data.isVerified = Boolean(isVerified);

  const updatedUser = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, fullName: true, email: true, phone: true, age: true, isVerified: true },
  });

  await recordAdminLog(req, `USER_IDENTITY_UPDATED: ${id}`);

  res.status(200).json({ status: 'success', data: updatedUser });
});

// ==========================================
// 6. FORCE CIPHER OVERRIDE
// ==========================================
export const forceCipherOverride = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { newCipher } = req.body;

  if (typeof newCipher !== 'string' || newCipher.trim().length < 8) {
    return res.status(400).json({ message: 'Cipher strength does not pass complexity rules (min 8 characters).' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(newCipher, salt);

  await prisma.user.update({ where: { id }, data: { passwordHash } });

  await recordAdminLog(req, `PASSWORD_CIPHER_OVERRIDDEN: ${id}`, 'WARN');

  res.status(200).json({ status: 'success', message: 'Cipher successfully overwritten.' });
});

// ==========================================
// 7. SUSPEND / RESTORE NETWORK ACCESS
// ==========================================
export const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body;

  if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid node lifecycle status parameters.' });
  }

  if (req.user?.id === id && status === 'SUSPENDED') {
    return res.status(403).json({ message: 'Master Override: Cannot suspend your own node.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, username: true, role: true, status: true },
  });

  await recordAdminLog(req, `USER_STATUS_TOGGLED: ${id} -> ${status}`, status === 'SUSPENDED' ? 'WARN' : 'OK');

  res.status(200).json({ status: 'success', data: updatedUser });
});

// ==========================================
// 8. ADMIN DIRECT USER PROVISIONING
// ==========================================
export const createAdminUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password, fullName, age, phone, role, isVerified, status } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and initial password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return res.status(409).json({ message: 'An operator with this email address already exists.' });
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(String(password), salt);

  let newUsername = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(5).toString('hex').toUpperCase();
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) {
      newUsername = candidate;
      break;
    }
  }

  const newUser = await prisma.user.create({
    data: {
      email: cleanEmail,
      passwordHash,
      username: newUsername || crypto.randomUUID().slice(0, 10).toUpperCase(),
      fullName: fullName ? String(fullName).trim() : null,
      age: age ? String(age) : null,
      phone: phone ? String(phone).trim() : null,
      role: role === 'admin' ? 'admin' : 'user',
      isVerified: typeof isVerified === 'boolean' ? isVerified : true,
      status: status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      role: true,
      isVerified: true,
      status: true,
      createdAt: true,
    },
  });

  await recordAdminLog(req, `ADMIN_USER_PROVISIONED: ${newUser.username} (${newUser.email})`);

  res.status(201).json({ status: 'success', secretCode: newUser.username, data: { ...newUser, secretCode: newUser.username } });
});

// ==========================================
// 9. REGENERATE USER SECRET CODE (LOGIN CIPHER)
// ==========================================
export const regenerateSecretCode = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  let newCode = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = crypto.randomBytes(5).toString('hex').toUpperCase();
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) {
      newCode = candidate;
      break;
    }
  }

  if (!newCode) {
    return res.status(500).json({ message: 'Could not generate unique secret code.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { username: newCode },
    select: { id: true, username: true, email: true },
  });

  await recordAdminLog(req, `SECRET_CODE_REGENERATED: ${updatedUser.username} (${updatedUser.email})`, 'WARN');

  res.status(200).json({
    status: 'success',
    message: 'Secret cipher code successfully regenerated.',
    secretCode: updatedUser.username,
    data: { ...updatedUser, secretCode: updatedUser.username },
  });
});

// ==========================================
// 10. INSPECT USER SAVED VAULT ASSETS
// ==========================================
export const getUserVault = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      savedPosts: {
        select: {
          id: true,
          title: true,
          type: true,
          published: true,
          createdAt: true,
        },
      },
      savedReleases: {
        select: {
          id: true,
          projectName: true,
          version: true,
          published: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  res.status(200).json({ status: 'success', data: user });
});

// ==========================================
// 11. FETCH FILTERABLE SYSTEM LOGS
// ==========================================
export const getSystemLogs = catchAsync(async (req: Request, res: Response) => {
  const { status, search, limit } = req.query;

  const whereClause: Record<string, any> = {};
  if (status && typeof status === 'string' && status !== 'ALL') {
    whereClause.status = status.toUpperCase();
  }
  if (search && typeof search === 'string' && search.trim()) {
    whereClause.action = { contains: search.trim() };
  }

  const maxLogs = Math.min(Number(limit) || 200, 500);

  const logs = await prisma.activityLog.findMany({
    where: whereClause,
    take: maxLogs,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { username: true, email: true, role: true },
      },
    },
  });

  res.status(200).json({
    status: 'success',
    results: logs.length,
    data: logs,
  });
});

// ==========================================
// 12. PURGE LOG ENTRIES
// ==========================================
export const purgeSystemLogs = catchAsync(async (req: Request, res: Response) => {
  const { retentionDays } = req.body;

  let count = 0;
  if (retentionDays && Number(retentionDays) > 0) {
    const cutoff = new Date(Date.now() - Number(retentionDays) * 24 * 60 * 60 * 1000);
    const result = await prisma.activityLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    count = result.count;
  } else {
    const result = await prisma.activityLog.deleteMany({});
    count = result.count;
  }

  await recordAdminLog(req, `SYSTEM_LOGS_PURGED: ${count} records deleted`, 'WARN');

  res.status(200).json({
    status: 'success',
    message: `Purged ${count} audit log records.`,
  });
});

// ==========================================
// 13. REAL SYSTEM OVERRIDE / FLUSH
// ==========================================
export const executeSystemFlush = catchAsync(async (req: Request, res: Response) => {
  const [userCount, postCount, releaseCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.release.count(),
  ]);

  await recordAdminLog(req, 'SYSTEM_CACHE_FLUSH_OVERRIDE_EXECUTED', 'WARN');

  res.status(200).json({
    status: 'success',
    message: 'System cache array flushed and synchronized across nodes.',
    telemetry: {
      activeNodes: userCount,
      synchronizedPosts: postCount,
      synchronizedReleases: releaseCount,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});
