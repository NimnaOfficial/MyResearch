import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';
import { isAdminRequester, sanitizeReleaseForPublic } from '../utils/publicView';

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
};

// ==========================================
// 1. INJECT NEW RELEASE NODE (ADMIN CREATE)
// ==========================================
export const createRelease = catchAsync(async (req: Request, res: Response) => {
  const { projectName, version, releaseNotes, downloadUrl, heroImg, published, advancedData, publishedAt } = req.body;

  if (!projectName || !version || !releaseNotes) {
    return res.status(400).json({ message: 'Incomplete payload: Project Name, Version, and Notes are required.' });
  }

  // Custom deployment date from the Forge, fallback to now
  const deploymentDate = parseDate(publishedAt) ?? new Date();

  const newRelease = await prisma.release.create({
    data: {
      id: crypto.randomUUID(),
      projectName,
      version,
      releaseNotes,
      downloadUrl: downloadUrl || null,
      heroImg: heroImg || null,
      published: published === true,
      advancedData: advancedData || null,
      publishedAt: deploymentDate,
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

  const existingRelease = await prisma.release.findUnique({ where: { id } });
  if (!existingRelease) {
    return res.status(404).json({ message: 'Target release node not found in the matrix.' });
  }

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
      publishedAt: parseDate(publishedAt) ?? existingRelease.publishedAt,
    },
  });

  res.status(200).json({ status: 'success', data: updatedRelease });
});

// ==========================================
// 3. TERMINATE RELEASE NODE (ADMIN DELETE)
// ==========================================
export const deleteRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existingRelease = await prisma.release.findUnique({ where: { id } });
  if (!existingRelease) {
    return res.status(404).json({ message: 'Target release node already terminated or not found.' });
  }

  await prisma.release.delete({ where: { id } });
  res.status(204).send();
});

// ==========================================
// 4. FETCH RELEASE DIRECTORY (ADMIN OR PUBLIC)
// ==========================================
export const getReleases = catchAsync(async (req: Request, res: Response) => {
  const releases = await prisma.release.findMany({ orderBy: { publishedAt: 'desc' } });

  // Admins see everything. Everyone else sees drafts only as teasers (no notes / download link / details).
  const data = isAdminRequester(req.user) ? releases : releases.map(sanitizeReleaseForPublic);

  res.status(200).json({ status: 'success', results: data.length, data });
});

// ==========================================
// 5. FETCH SINGLE RELEASE DETAIL
// ==========================================
export const getSingleRelease = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const release = await prisma.release.findUnique({ where: { id } });

  if (!release || (!release.published && !isAdminRequester(req.user))) {
    return res.status(404).json({ message: 'Target release node not found.' });
  }

  res.status(200).json({ status: 'success', data: release });
});

// ==========================================
// 6. VAULT TOGGLE (USER SAVE RELEASE)
// ==========================================
export const toggleSaveRelease = catchAsync(async (req: Request, res: Response) => {
  const releaseId = req.params.id as string;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized access.' });

  const release = await prisma.release.findUnique({
    where: { id: releaseId },
    select: { id: true, published: true },
  });
  if (!release || (!release.published && !isAdminRequester(req.user))) {
    return res.status(404).json({ message: 'Target release node not found.' });
  }

  try {
    const userDelegate: any = prisma.user;
    const alreadySaved = await userDelegate.findFirst({
      where: { id: userId, savedReleases: { some: { id: releaseId } } },
      select: { id: true },
    });

    if (alreadySaved) {
      await userDelegate.update({
        where: { id: userId },
        data: { savedReleases: { disconnect: { id: releaseId } } },
      });
      return res.status(200).json({ status: 'success', saved: false, message: 'Removed from Vault' });
    }

    await userDelegate.update({
      where: { id: userId },
      data: { savedReleases: { connect: { id: releaseId } } },
    });
    return res.status(200).json({ status: 'success', saved: true, message: 'Added to Vault' });
  } catch (err) {
    console.error('[RELEASE SAVE] Failed (is the _SavedReleases table created?):', err);
    return res.status(503).json({
      message: 'Vault storage for projects is not initialised yet. Ask the administrator to apply the database update.',
    });
  }
});
