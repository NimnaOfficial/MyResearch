import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';

// ==========================================
// 1. INJECT NEW RELEASE NODE (ADMIN CREATE)
// ==========================================
export const createRelease = catchAsync(async (req: Request, res: Response) => {
  const { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData, publishedAt } = req.body;

  if (!projectName || !version || !releaseNotes) {
    return res.status(400).json({ message: 'Incomplete payload: Project Name, Version, and Notes are required.' });
  }

  // Parse custom deployment date from the Forge, fallback to today
  const deploymentDate = publishedAt ? new Date(publishedAt) : new Date();

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
      publishedAt: deploymentDate
    },
  });

  res.status(201).json({ status: 'success', data: newRelease });
});

// ==========================================
// 2. OVERWRITE EXISTING RELEASE (ADMIN UPDATE)
// ==========================================
export const updateRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData, publishedAt } = req.body;

  // 1. Safety Check: Does the node exist?
  const existingRelease = await prisma.release.findUnique({ where: { id } });
  if (!existingRelease) {
    return res.status(404).json({ message: 'Target release node not found in the matrix.' });
  }

  const deploymentDate = publishedAt ? new Date(publishedAt) : existingRelease.publishedAt;

  // 2. Update the Node
  const updatedRelease = await prisma.release.update({
    where: { id },
    data: { 
      projectName, 
      version, 
      releaseNotes, 
      downloadUrl: downloadUrl || null, 
      heroImg, 
      published, 
      advancedData,
      publishedAt: deploymentDate
    }
  });

  res.status(200).json({ status: 'success', data: updatedRelease });
});

// ==========================================
// 3. TERMINATE RELEASE NODE (ADMIN DELETE)
// ==========================================
export const deleteRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  // 1. Safety Check: Does the node exist?
  const existingRelease = await prisma.release.findUnique({ where: { id } });
  if (!existingRelease) {
    return res.status(404).json({ message: 'Target release node already terminated or not found.' });
  }

  await prisma.release.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});

// ==========================================
// 4. FETCH RELEASE DIRECTORY (ADMIN OR PUBLIC)
// ==========================================
export const getReleases = catchAsync(async (req: Request, res: Response) => {
  // If request comes from public gateway, only show published. If Admin, show all.
  const isPublic = req.baseUrl.includes('public') || !req.user || req.user.role !== 'admin';
  
  // 🔥 FIX: Correctly mapping the public filter to the "published" boolean flag
  const where = isPublic ? { published: true } : {}; 
  
  const releases = await prisma.release.findMany({
    where,
    orderBy: { publishedAt: 'desc' } // Order by deployment date chronologically
  });

  res.status(200).json({ status: 'success', results: releases.length, data: releases });
});

// ==========================================
// 5. FETCH SINGLE RELEASE DETAIL
// ==========================================
export const getSingleRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  const release = await prisma.release.findUnique({ where: { id } });
  
  if (!release) {
    return res.status(404).json({ message: 'Target release node not found.' });
  }
  
  res.status(200).json({ status: 'success', data: release });
});