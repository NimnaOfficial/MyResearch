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

// Add this function to your post.controller.ts
export const toggleSavePost = async (req: Request, res: Response) => {
  const postId = req.params.id;
  const userId = (req as any).user.id; // Assuming your auth middleware attaches the user

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { savedPosts: { select: { id: true } } }
    });

    const isAlreadySaved = user?.savedPosts.some((p: any) => p.id === postId);

    if (isAlreadySaved) {
      // Disconnect (Unsave)
      await prisma.user.update({
        where: { id: userId },
        data: { savedPosts: { disconnect: { id: req.params.id as string } } }
      });
      return res.json({ saved: false });
    } else {
      // Connect (Save)
      await prisma.user.update({
        where: { id: userId },
        data: { savedPosts: { connect: { id: req.params.id as string } } }
      });
      return res.json({ saved: true });
    }
  } catch (error) {
    console.error("Save Toggle Error:", error);
    res.status(500).json({ message: "Failed to toggle save status." });
  }
};