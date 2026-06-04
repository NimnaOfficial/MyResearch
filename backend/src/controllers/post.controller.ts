import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';

// ==========================================
// 1. INJECT NEW DATACORE (ADMIN CREATE)
// ==========================================
export const createPost = catchAsync(async (req: Request, res: Response) => {
  const { title, content, type, published, heroImg, advancedData } = req.body;
  const authorId = req.user?.id; 

  if (!authorId) return res.status(401).json({ message: 'Unauthorized execution.' });
  if (!title || !content) return res.status(400).json({ message: 'Incomplete payload: Title and Abstract are required.' });

  // 🚀 AUTOMATIC SLUG GENERATOR: URL-friendly + Unique Hash
  const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + crypto.randomBytes(3).toString('hex');
  const generatedId = crypto.randomUUID();

  const newPost = await prisma.post.create({
    data: {
      id: generatedId,
      title,
      slug: generatedSlug,
      content,
      type: type || 'Research',
      published: published || false,
      heroImg: heroImg || null,
      advancedData: advancedData || null,
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
  const id = req.params.id as string; // 🔥 FIXED: Explicitly cast to string
  const { title, content, type, published, heroImg, advancedData } = req.body;

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      title,
      content,
      type,
      published,
      heroImg,
      advancedData,
    }
  });

  res.status(200).json({ status: 'success', data: updatedPost });
});

// ==========================================
// 3. TERMINATE DATACORE (ADMIN DELETE)
// ==========================================
export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 FIXED: Explicitly cast to string
  await prisma.post.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});

// ==========================================
// 4. FETCH DATACORES (ADMIN OR PUBLIC)
// ==========================================
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  // If request comes from public gateway, only show published. If Admin, show all.
  const isPublic = req.baseUrl.includes('public') || !req.user || req.user.role !== 'admin';
  
  const posts = await prisma.post.findMany({
    where: isPublic ? { published: true } : {},
    orderBy: { createdAt: 'desc' },
    // 🔥 FIXED: Mapped to the exact schema relation names
    include: {
      author: { select: { username: true, fullName: true, profilePic: true } },
      Category: true,
    }
  });

  res.status(200).json({
    status: 'success',
    results: posts.length,
    data: posts,
  });
});

// ==========================================
// 5. FETCH SINGLE DATACORE DETAIL (VIEWING)
// ==========================================
export const getSinglePost = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string; // 🔥 FIXED: Explicitly cast to string
  
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { username: true, fullName: true, profilePic: true } }
    }
  });

  if (!post) return res.status(404).json({ message: 'Target node not found.' });

  res.status(200).json({ status: 'success', data: post });
});

// ==========================================
// 6. VAULT TOGGLE (USER SAVE POST)
// ==========================================
export const toggleSavePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ message: 'Unauthorized access.' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { savedPosts: true }
  });

  if (!user) return res.status(404).json({ message: 'User not found in the matrix.' });

  const isAlreadySaved = user.savedPosts.some((post: any) => post.id === postId);

  if (isAlreadySaved) {
    await prisma.user.update({
      where: { id: userId },
      data: { savedPosts: { disconnect: { id: postId } } }
    });
    return res.status(200).json({ status: 'success', message: 'Removed from Vault' });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { savedPosts: { connect: { id: postId } } }
    });
    return res.status(200).json({ status: 'success', message: 'Added to Vault' });
  }
});