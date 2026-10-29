import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';
import { isAdminRequester, sanitizePostForPublic } from '../utils/publicView';

const authorSelect = { select: { username: true, fullName: true, profilePic: true } } as const;

// ==========================================
// 1. INJECT NEW DATACORE (ADMIN CREATE)
// ==========================================
export const createPost = catchAsync(async (req: Request, res: Response) => {
  const { title, content, type, published, heroImg, advancedData, categoryId } = req.body;
  const authorId = req.user?.id;

  if (!authorId) return res.status(401).json({ message: 'Unauthorized execution.' });
  if (!title || !content) {
    return res.status(400).json({ message: 'Incomplete payload: Title and Abstract are required.' });
  }

  // AUTOMATIC SLUG GENERATOR: URL-friendly + unique hash
  const baseSlug = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';
  const generatedSlug = `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`;

  const newPost = await prisma.post.create({
    data: {
      id: crypto.randomUUID(),
      title,
      slug: generatedSlug,
      content,
      type: type || 'Research',
      published: published === true,
      heroImg: heroImg || null,
      advancedData: advancedData || null,
      categoryId: categoryId || null,
      authorId,
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Data core compiled successfully.',
    data: newPost,
  });
});

// ==========================================
// 2. OVERWRITE EXISTING DATACORE (ADMIN UPDATE)
// ==========================================
export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { title, content, type, published, heroImg, advancedData, categoryId } = req.body;

  const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return res.status(404).json({ message: 'Target node not found.' });

  const dataToUpdate: Record<string, any> = {
    title,
    content,
    type,
    published,
    heroImg,
    advancedData,
  };
  if (categoryId !== undefined) {
    dataToUpdate.categoryId = categoryId || null;
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: dataToUpdate,
  });

  res.status(200).json({ status: 'success', data: updatedPost });
});

// ==========================================
// 3. TERMINATE DATACORE (ADMIN DELETE)
// ==========================================
export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return res.status(404).json({ message: 'Target node already terminated or not found.' });

  await prisma.post.delete({ where: { id } });
  res.status(204).send();
});

// ==========================================
// 4. FETCH DATACORES (ADMIN OR PUBLIC)
// ==========================================
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = isAdminRequester(req.user);

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: authorSelect,
      Category: true,
    },
  });

  // Admins get everything. Everyone else gets published posts in full, drafts only as body-less teasers.
  const data = isAdmin ? posts : posts.map(sanitizePostForPublic);

  res.status(200).json({
    status: 'success',
    results: data.length,
    data,
  });
});

// ==========================================
// 5. FETCH SINGLE DATACORE DETAIL (VIEWING)
// ==========================================
export const getSinglePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: authorSelect },
  });

  // Drafts do not exist as far as non-admins are concerned
  if (!post || (!post.published && !isAdminRequester(req.user))) {
    return res.status(404).json({ message: 'Target node not found.' });
  }

  res.status(200).json({ status: 'success', data: post });
});

// ==========================================
// 6. VAULT TOGGLE (USER SAVE POST)
// ==========================================
export const toggleSavePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized access.' });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, published: true } });
  if (!post || (!post.published && !isAdminRequester(req.user))) {
    return res.status(404).json({ message: 'Target node not found.' });
  }

  const alreadySaved = await prisma.user.findFirst({
    where: { id: userId, savedPosts: { some: { id: postId } } },
    select: { id: true },
  });

  if (alreadySaved) {
    await prisma.user.update({
      where: { id: userId },
      data: { savedPosts: { disconnect: { id: postId } } },
    });
    return res.status(200).json({ status: 'success', saved: false, message: 'Removed from Vault' });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { savedPosts: { connect: { id: postId } } },
  });
  return res.status(200).json({ status: 'success', saved: true, message: 'Added to Vault' });
});
