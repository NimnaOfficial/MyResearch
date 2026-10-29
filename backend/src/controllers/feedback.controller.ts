import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendFeedbackNotificationEmail } from '../utils/sendEmail';

const MAX_MESSAGE_LENGTH = 5000;
const clip = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

// ==========================================
// 1. SUBMIT TELEMETRY FEEDBACK (AUTHENTICATED USER)
// ==========================================
export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || null;
  const { rating, category, priority, tags, recommend, message } = req.body;

  const cleanMessage = clip(message, MAX_MESSAGE_LENGTH);
  if (!cleanMessage) {
    return res.status(400).json({ message: 'Telemetry log (message) is required.' });
  }

  const numericRating = rating === undefined || rating === null || rating === '' ? 5 : Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be a whole number between 1 and 5.' });
  }

  const cleanCategory = clip(category, 60) || 'GENERAL';
  const cleanPriority = clip(priority, 30) || 'LOW';
  const cleanTags = tags ? clip(tags, 500) : null;

  const newFeedback = await prisma.feedback.create({
    data: {
      userId,
      rating: numericRating,
      category: cleanCategory,
      priority: cleanPriority,
      tags: cleanTags,
      recommend: typeof recommend === 'boolean' ? recommend : true,
      message: cleanMessage,
    },
  });

  // Extract sender profile for the (non-blocking) admin e-mail alert
  let senderInfo = 'GUEST OPERATOR';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, username: true, email: true },
    });
    if (user) senderInfo = `${user.fullName || user.username} (${user.email})`;
  }

  sendFeedbackNotificationEmail(
    senderInfo,
    numericRating,
    cleanCategory,
    cleanPriority,
    cleanMessage,
    cleanTags || 'None'
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
          profilePic: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    status: 'success',
    results: feedbacks.length,
    data: feedbacks,
  });
});

// ==========================================
// 3. ERADICATE FEEDBACK NODE (ADMIN HUD)
// ==========================================
export const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };

  await prisma.feedback.delete({ where: { id } });

  res.status(200).json({
    status: 'success',
    message: 'Communication node safely purged from logs.',
  });
});
