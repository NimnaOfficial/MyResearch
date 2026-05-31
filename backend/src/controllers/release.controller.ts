import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';

// ==========================================
// LOG A NEW SOFTWARE RELEASE
// ==========================================
export const createRelease = catchAsync(async (req: Request, res: Response) => {
  const { projectName, version, releaseNotes, downloadUrl } = req.body;
  const authorId = req.user?.id; // Protected by requireAuth

  if (!authorId) return res.status(401).json({ message: 'Unauthorized execution.' });
  if (!projectName || !version || !downloadUrl) {
    return res.status(400).json({ message: 'Incomplete release payload.' });
  }

  const generatedId = crypto.randomUUID();

  const newRelease = await prisma.release.create({
    data: {
      id: generatedId,
      projectName,
      version,
      releaseNotes: releaseNotes || 'Standard stability updates and node optimizations.',
      downloadUrl,
      publishedAt: new Date(),
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'System release deployed to the matrix.',
    data: newRelease,
  });
});

// ==========================================
// FETCH ALL SYSTEM RELEASES
// ==========================================
export const getReleases = catchAsync(async (req: Request, res: Response) => {
  const releases = await prisma.release.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    results: releases.length,
    data: releases,
  });
});