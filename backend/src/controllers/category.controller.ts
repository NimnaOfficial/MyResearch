import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { posts: true } },
    },
    orderBy: { name: 'asc' },
  });

  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: categories,
  });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const cleanName = name.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `cat-${Date.now()}`;

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return res.status(409).json({ message: 'A category with this name already exists.' });
  }

  const category = await prisma.category.create({
    data: {
      id: crypto.randomUUID(),
      name: cleanName,
      slug,
    },
  });

  res.status(201).json({ status: 'success', data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }

  const cleanName = name.trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const category = await prisma.category.update({
    where: { id },
    data: { name: cleanName, slug },
  });

  res.status(200).json({ status: 'success', data: category });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  // Set categoryId to null on associated posts before deleting
  await prisma.post.updateMany({
    where: { categoryId: id },
    data: { categoryId: null },
  });

  await prisma.category.delete({ where: { id } });

  res.status(200).json({ status: 'success', message: 'Category deleted successfully.' });
});
