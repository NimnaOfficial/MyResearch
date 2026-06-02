import { Request, Response } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';
import { catchAsync } from '../utils/catchAsync';

// ==========================================
// CREATE NEW RESEARCH OR BLOG POST
// ==========================================
export const createPost = catchAsync(async (req: Request, res: Response) => {
  const { title, slug, content, type, published } = req.body;
  const authorId = req.user?.id; 

  if (!authorId) return res.status(401).json({ message: 'Unauthorized execution.' });
  if (!title || !slug || !content) return res.status(400).json({ message: 'Incomplete post payload.' });

  // Manually generate system variables to bypass Prisma caching errors
  const generatedId = crypto.randomUUID();
  const timestamp = new Date();

  const newPost = await prisma.post.create({
    data: {
      id: generatedId,
      title,
      slug,
      content,
      type: type || 'BLOG',
      published: published || false,
      createdAt: timestamp,
      updatedAt: timestamp,
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
// FETCH ALL PUBLISHED POSTS
// ==========================================
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    // Using Capitalized 'User' and 'Category' to satisfy the strict Prisma cache
    include: {
      User: { select: { username: true } },
      Category: true,
    }
  });

  res.status(200).json({
    status: 'success',
    results: posts.length,
    data: posts,
  });
});

export const toggleSavePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.id as string;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized access.' });
  }

  // 1. Universally safe Prisma query (No nested 'where' clauses inside 'select')
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { savedPosts: true }
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found in the matrix.' });
  }

  // 2. Manually check if the post exists in their vault
  const isAlreadySaved = user.savedPosts.some((post: any) => post.id === postId);

  // 3. Toggle the Relational Connection
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