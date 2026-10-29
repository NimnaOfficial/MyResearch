import { Request, Response } from 'express';
import os from 'os';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

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

  await prisma.user.delete({ where: { id } });

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

  res.status(200).json({ status: 'success', data: updatedUser });
});

// ==========================================
// 8. FETCH LOG SYSTEM ENTRIES
// ==========================================
export const getSystemLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await prisma.activityLog.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    data: logs,
  });
});
