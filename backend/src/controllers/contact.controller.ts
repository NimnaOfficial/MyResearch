import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { catchAsync } from '../utils/catchAsync';
import { sendContactMessageEmail } from '../utils/sendEmail';
import { securityManager } from '../config/securityState';

export const submitContactMessage = catchAsync(async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  let senderName = String(name || '').trim();
  let senderEmail = String(email || '').trim().toLowerCase();
  const cleanSubject = String(subject || 'Comm-Link Inquiry').trim().slice(0, 150);
  const cleanMessage = String(message || '').trim().slice(0, 5000);

  if (!cleanMessage) {
    return res.status(400).json({ status: 'error', message: 'Message payload cannot be empty.' });
  }

  const userId = req.user?.id || null;
  const isGuest = !userId;
  const userRole = req.user?.role || 'guest';

  // If user is authenticated, query and use their verified account credentials
  if (req.user) {
    if (req.user.id === 'root_master') {
      senderName = 'Master Administrator';
      senderEmail = 'nimnakgls980@gmail.com';
    } else {
      try {
        const u = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { fullName: true, username: true, email: true },
        });
        if (u) {
          senderName = u.fullName || u.username || senderName || 'Verified Operator';
          senderEmail = u.email || senderEmail;
        }
      } catch (err) {
        senderName = req.user.username || senderName;
      }
    }
  }

  if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return res.status(400).json({ status: 'error', message: 'A valid email address is required.' });
  }

  if (!senderName) {
    senderName = senderEmail.split('@')[0];
  }

  // 1. Record in Database if available (using Feedback model under 'CONTACT' category)
  let savedId = `msg-${Date.now()}`;
  if (!securityManager.getState().dbConnectionHeld) {
    try {
      const record = await prisma.feedback.create({
        data: {
          userId,
          rating: 5,
          category: 'CONTACT',
          priority: isGuest ? 'MEDIUM' : 'HIGH',
          tags: `Subject: ${cleanSubject} | From: ${senderName} <${senderEmail}>`,
          recommend: true,
          message: cleanMessage,
        },
      });
      savedId = record.id;
    } catch (dbErr) {
      console.warn('[CONTACT] Database write warning (falling back to direct mail dispatch):', dbErr);
    }
  }

  // 2. Dispatch real-time cryptographic email via verified Gmail SMTP
  sendContactMessageEmail({
    senderName,
    senderEmail,
    subject: cleanSubject,
    message: cleanMessage,
    isGuest,
    userRole,
  }).catch((emailErr) => {
    console.error('[CONTACT EMAIL ERROR]:', emailErr);
  });

  return res.status(200).json({
    status: 'success',
    message: 'Transmission successfully delivered to Command Matrix.',
    data: {
      messageId: savedId,
      senderName,
      senderEmail,
      isGuest,
      timestamp: new Date().toISOString(),
    },
  });
});
