import { Request, Response } from 'express';
import prisma from '../config/prisma';

// Universal error catcher wrapper
const catchAsync = (fn: Function) => (req: Request, res: Response, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// @desc    Get all registered users in the matrix
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      username: true, 
      email: true, 
      fullName: true, 
      role: true, 
      profilePic: true,
      createdAt: true,
      // Count how many posts and saved items they have for activity tracking
      _count: {
        select: { posts: true, savedPosts: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ status: 'success', results: users.length, data: users });
});

// @desc    Update User Role (Promote/Demote)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const targetId = String(req.params.id); // <-- Fix: Force strict String type
  const { role } = req.body;

  if (role !== 'user' && role !== 'admin') {
    return res.status(400).json({ message: 'Invalid role assignment.' });
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetId },
    data: { role },
    select: { id: true, username: true, role: true }
  });

  res.status(200).json({ status: 'success', data: updatedUser });
});

// @desc    Permanently Delete a User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const targetId = String(req.params.id); // <-- Fix: Force strict String type

  if (req.user?.id === targetId) {
    return res.status(400).json({ message: 'Security Protocol: You cannot terminate your own admin instance.' });
  }

  await prisma.user.delete({
    where: { id: targetId }
  });

  res.status(200).json({ status: 'success', message: 'User permanently extracted from the matrix.' });
});