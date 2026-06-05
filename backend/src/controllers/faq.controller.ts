import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

export const getAllFaqs = catchAsync(async (req: Request, res: Response) => {
  const faqs = await prisma.faq.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json({ status: 'success', data: faqs });
});

export const createFaq = catchAsync(async (req: Request, res: Response) => {
  const { query, response } = req.body;
  
  if (!query || !response) {
    return res.status(400).json({ message: 'Incomplete payload: Query and Response are required.' });
  }

  const newFaq = await prisma.faq.create({ 
    data: { query, response } 
  });
  
  res.status(201).json({ status: 'success', data: newFaq });
});

export const updateFaq = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 THE FIX: Explicitly cast to string
  const { query, response } = req.body;

  // Safety Check: Does the node exist?
  const existingFaq = await prisma.faq.findUnique({ where: { id } });
  if (!existingFaq) {
    return res.status(404).json({ message: 'Target query node not found.' });
  }

  const updatedFaq = await prisma.faq.update({ 
    where: { id }, 
    data: { query, response } 
  });
  
  res.status(200).json({ status: 'success', data: updatedFaq });
});

export const deleteFaq = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 THE FIX: Explicitly cast to string

  // Safety Check: Does the node exist?
  const existingFaq = await prisma.faq.findUnique({ where: { id } });
  if (!existingFaq) {
    return res.status(404).json({ message: 'Target query node already terminated or not found.' });
  }

  await prisma.faq.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});