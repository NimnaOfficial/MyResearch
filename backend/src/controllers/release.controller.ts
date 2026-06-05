import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';

export const createRelease = catchAsync(async (req: Request, res: Response) => {
  const { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData } = req.body;

  if (!projectName || !version || !releaseNotes) {
    return res.status(400).json({ message: 'Incomplete payload: Project Name, Version, and Notes are required.' });
  }

  const newRelease = await prisma.release.create({
    data: {
      id: crypto.randomUUID(),
      projectName,
      version,
      releaseNotes,
      downloadUrl: downloadUrl || null,
      heroImg: heroImg || null,
      published: published || false,
      advancedData: advancedData || null,
      publishedAt: new Date()
    },
  });

  res.status(201).json({ status: 'success', data: newRelease });
});

export const updateRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData } = req.body;

  const updatedRelease = await prisma.release.update({
    where: { id },
    data: { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData }
  });

  res.status(200).json({ status: 'success', data: updatedRelease });
});

export const deleteRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await prisma.release.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});

export const getReleases = catchAsync(async (req: Request, res: Response) => {
  const isPublic = req.baseUrl.includes('public') || !req.user || req.user.role !== 'admin';
  const where = isPublic ? { publishedAt: { not: null as any } } : {};
  const releases = await prisma.release.findMany({
    where,
    orderBy: { publishedAt: 'desc' }
  });
  res.status(200).json({ status: 'success', results: releases.length, data: releases });
});

export const getSingleRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const release = await prisma.release.findUnique({ where: { id } });
  if (!release) return res.status(404).json({ message: 'Target node not found.' });
  res.status(200).json({ status: 'success', data: release });
});