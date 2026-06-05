import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getAllShowcases = catchAsync(async (req: Request, res: Response) => {
  const showcases = await prisma.showcase.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json({ status: 'success', data: showcases });
});

export const createShowcase = catchAsync(async (req: Request, res: Response) => {
  const { title, videoUrl, thumbnailUrl, description } = req.body;

  if (!title || !videoUrl) {
    return res.status(400).json({ message: 'Incomplete payload: Title and Video URL are required.' });
  }

  const newShowcase = await prisma.showcase.create({ 
    data: { title, videoUrl, thumbnailUrl, description } 
  });
  
  res.status(201).json({ status: 'success', data: newShowcase });
});

export const updateShowcase = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 THE FIX: Explicitly cast to string
  const { title, videoUrl, thumbnailUrl, description } = req.body;

  // Safety Check: Does the node exist?
  const existingShowcase = await prisma.showcase.findUnique({ where: { id } });
  if (!existingShowcase) {
    return res.status(404).json({ message: 'Target media node not found.' });
  }

  const updatedShowcase = await prisma.showcase.update({ 
    where: { id }, 
    data: { title, videoUrl, thumbnailUrl, description } 
  });
  
  res.status(200).json({ status: 'success', data: updatedShowcase });
});

export const deleteShowcase = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 THE FIX: Explicitly cast to string

  // Safety Check: Does the node exist?
  const existingShowcase = await prisma.showcase.findUnique({ where: { id } });
  if (!existingShowcase) {
    return res.status(404).json({ message: 'Target media node already terminated or not found.' });
  }

  await prisma.showcase.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});