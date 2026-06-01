import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendFeedbackNotificationEmail } from '../utils/sendEmail';

export const submitFeedback = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id || null; 
  
  const { rating, category, priority, tags, recommend, message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Telemetry log (message) is required.' });
  }

  // 1. SAVE TO POSTGRESQL (First-Party Database)
  const newFeedback = await prisma.feedback.create({
    data: {
      userId,
      rating,
      category,
      priority,
      tags,
      recommend,
      message
    }
  });

  // 2. IDENTIFY THE SENDER (For the email alert)
  let senderInfo = "GUEST OPERATOR";
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      senderInfo = `${user.fullName || user.username} (${user.email})`;
    }
  }

  // 3. FIRE THE EMAIL TRIGGER (Non-blocking so the frontend doesn't wait)
  sendFeedbackNotificationEmail(
    senderInfo, 
    rating, 
    category, 
    priority, 
    message, 
    tags || "None"
  ).catch(console.error);

  // 4. RESPOND TO FRONTEND IMMEDIATELY
  res.status(201).json({ status: 'success', data: newFeedback });
});