import { Request, Response } from 'express';
import os from 'os';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

// ==========================================
// 1. DASHBOARD TELEMETRY ENGINE
// ==========================================
export const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const totalNodes = await prisma.user.count();
  
  const recentNodes = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, fullName: true, role: true, isVerified: true }
  });

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const usedMemGB = (usedMem / (1024 ** 3)).toFixed(2);
  const totalMemGB = (totalMem / (1024 ** 3)).toFixed(2);

  // Simulated CPU load for the UI widget
  const cpuLoad = Math.floor(Math.random() * (45 - 25 + 1) + 25); 

  res.status(200).json({
    status: 'success',
    data: {
      networkIntegrity: 99.8,
      nodes: recentNodes,
      totalNodes,
      hardware: {
        cpuUsage: cpuLoad,
        memory: { percent: memUsagePercent, usedGB: usedMemGB, totalGB: totalMemGB }
      }
    }
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
      // 🔥 THE FIX: Tell Prisma to grab these columns!
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
        orderBy: { createdAt: 'desc' }
      }       
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
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

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, username: true, role: true }
  });

  res.status(200).json({
    status: 'success',
    message: `Clearance updated to ${role.toUpperCase()}`,
    data: updatedUser
  });
});

// ==========================================
// 4. TERMINATE NODE (DELETE)
// ==========================================
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  // Optional: Prevent the Master Admin from deleting themselves
  if (req.user?.id === id) {
    return res.status(403).json({ message: 'Master Override: Cannot terminate own node.' });
  }

  await prisma.user.delete({
    where: { id }
  });

  res.status(200).json({ // Using 200 instead of 204 so we can send a success message back to the UI
    status: 'success',
    message: 'Node successfully terminated.'
  });
});

// ==========================================
// 5. OVERRIDE IDENTITY PARAMETERS
// ==========================================
export const updateUserIdentity = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; 
  // We are now extracting 'isVerified' so the toggle box works perfectly
  const { fullName, email, phone, age, isVerified } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { 
      fullName, 
      email, 
      phone, 
      age: age ? String(age) : null,
      // Only update verification status if it was included in the request
      ...(isVerified !== undefined && { isVerified }) 
    },
    select: { id: true, fullName: true, email: true, phone: true, age: true, isVerified: true }
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});

// ==========================================
// 6. FORCE CIPHER OVERRIDE (FIXED)
// ==========================================
export const forceCipherOverride = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; 
  const { newCipher } = req.body;
  const bcrypt = require('bcryptjs');

  // 🔥 THE FIX: Update the 'username' column, because that is where the secret code lives!
  await prisma.user.update({
    where: { id },
    data: { 
      username: newCipher, 
      
      // OPTIONAL: If you also use a 'password' column for admins, update it too
      // password: await bcrypt.hash(newCipher, 12) 
    } 
  });

  res.status(200).json({ status: 'success', message: 'Cipher successfully overwritten.' });
});

// ==========================================
// 7. SUSPEND / RESTORE NETWORK ACCESS
// ==========================================
export const toggleUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // TS FIX
  const { status } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status }
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});