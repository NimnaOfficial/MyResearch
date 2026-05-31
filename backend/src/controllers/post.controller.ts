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