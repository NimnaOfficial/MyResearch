import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendFeedbackNotificationEmail } from '../utils/sendEmail';

// ==========================================
// 1. SUBMIT TELEMETRY FEEDBACK (USER/GUEST)
// ==========================================
export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || null; 
  const { rating, category, priority, tags, recommend, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Telemetry log (message) is required.' });
  }

  // Save entry to the PostgreSQL database
  const newFeedback = await prisma.feedback.create({
    data: {
      userId,
      rating: rating ? Number(rating) : 5,
      category: category || 'GENERAL',
      priority: priority || 'LOW',
      tags: tags || null,
      recommend: recommend ?? true,
      message
    }
  });

  // Extract metadata profiles for non-blocking email alerts
  let senderInfo = "GUEST OPERATOR";
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      senderInfo = `${user.fullName || user.username} (${user.email})`;
    }
  }

  // Fire non-blocking email notification
  sendFeedbackNotificationEmail(
    senderInfo, 
    Number(rating || 5), 
    category || 'GENERAL', 
    priority || 'LOW', 
    message, 
    tags || "None"
  ).catch((err) => console.error(`[EMAIL ERROR] Notification failed:`, err));

  res.status(201).json({ status: 'success', data: newFeedback });
});

// ==========================================
// 2. FETCH SECURE INBOX FEEDS (ADMIN HUD)
// ==========================================
export const getFeedbacks = catchAsync(async (req: Request, res: Response) => {
  const feedbacks = await prisma.feedback.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          username: true,
          email: true,
          profilePic: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    status: 'success',
    results: feedbacks.length,
    data: feedbacks
  });
});

// ==========================================
// 3. ERADICATE FEEDBACK NODE (ADMIN HUD)
// ==========================================
export const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
  // 🔥 THE FIX: Explicitly cast req.params to tell TypeScript it's a single string
  const { id } = req.params as { id: string };

  await prisma.feedback.delete({
    where: { id }
  });

  res.status(200).json({
    status: 'success',
    message: 'Communication node safely purged from logs.'
  });
});