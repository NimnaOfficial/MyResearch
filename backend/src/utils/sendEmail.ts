import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { escapeHtml } from './escapeHtml';

dotenv.config();

// Direct Gmail SMTP Transporter for Real-Time Email Delivery
let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter | null => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return cachedTransporter;
};

// Fallback HTTP Relay (if configured)
const RELAY_TIMEOUT_MS = 10000;

const sendViaRelay = async (to: string, subject: string, html: string): Promise<void> => {
  const relayUrl = process.env.EMAIL_RELAY_URL;
  if (!relayUrl) throw new Error('EMAIL_RELAY_URL is not configured.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);

  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP relay rejected the payload (status ${response.status}).`);
    }
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Dispatches an e-mail in real-time via Gmail SMTP.
 * Falls back to HTTP relay if SMTP fails, and logs to terminal for local tracking.
 */
const sendMailMessage = async (to: string, subject: string, html: string): Promise<boolean> => {
  const transporter = getTransporter();

  // 1. Primary: Direct Real-Time SMTP Delivery via Gmail
  if (transporter) {
    try {
      console.log(`[NETWORK] Dispatching real-time email via Gmail SMTP to: ${to}...`);
      const info = await transporter.sendMail({
        from: `"CSx CORE Systems" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[NETWORK] ✅ Cryptographic Email delivered in real time! Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      console.error(`[SMTP WARNING] Direct Gmail SMTP failed (${err?.message || err}). Trying fallback...`);
    }
  }

  // 2. Secondary: HTTP Relay (if configured)
  if (process.env.EMAIL_RELAY_URL) {
    try {
      console.log(`[NETWORK] Dispatching email via HTTP relay to: ${to}...`);
      await sendViaRelay(to, subject, html);
      console.log(`[NETWORK] ✅ Cryptographic Email delivered via HTTP relay!`);
      return true;
    } catch (relayErr: any) {
      console.error(`[RELAY ERROR] HTTP relay rejected transmission:`, relayErr?.message || relayErr);
    }
  }

  return false;
};

// ============================================================================
// 1. IDENTITY VERIFICATION MODULE (REAL-TIME DELIVERY)
// ============================================================================
export const sendSecretCodeEmail = async (toEmail: string, secretCode: string, verifyUrl: string) => {
  const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden;">
              <tr>
                <td align="center" style="padding: 40px 20px 20px 20px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #a855f7; letter-spacing: 4px; margin: 0; font-size: 24px; text-transform: uppercase;">IDENTITY MATRIX SECURED</h2>
                  <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">Your neural link is pending verification.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <div style="background-color: rgba(168, 85, 247, 0.05); border: 1px dashed #a855f7; border-radius: 8px; padding: 30px; display: inline-block;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; letter-spacing: 2px; text-transform: uppercase;">Your Secret Member Code</p>
                    <h1 style="margin: 0; font-size: 42px; letter-spacing: 10px; color: #00f0ff;">${escapeHtml(secretCode)}</h1>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 0 20px 40px 20px;">
                  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">Click the secure link below to verify your email and activate your code.</p>
                  <a href="${escapeHtml(verifyUrl)}" style="background-color: #a855f7; color: #ffffff; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 14px; letter-spacing: 2px; border-radius: 4px; text-transform: uppercase; display: inline-block;">
                    Verify Connection
                  </a>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px; background-color: #020617; border-top: 1px solid #1e293b;">
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx CORE SYSTEMS // DO NOT REPLY</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  const sent = await sendMailMessage(
    toEmail,
    'System Initialization: Verify Your Identity',
    htmlContent
  );

  // In non-production environments, also display in console for instant developer feedback
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`⚡ [IDENTITY MATRIX DISPATCHED]`);
    console.log(`[RECIPIENT]   : ${toEmail}`);
    console.log(`[SECRET CODE] : ${secretCode}`);
    console.log(`[VERIFY URL]  : ${verifyUrl}`);
    console.log(`[STATUS]      : ${sent ? 'DELIVERED IN REAL-TIME VIA GMAIL SMTP ✅' : 'PENDING'}`);
    console.log(`======================================================\n`);
  }
};

// ============================================================================
// 2. ADMIN TELEMETRY NOTIFICATION MODULE
// ============================================================================
export const sendFeedbackNotificationEmail = async (
  senderInfo: string,
  rating: number,
  category: string,
  priority: string,
  message: string,
  tags: string
) => {
  const priorityColor = priority === 'Critical' ? '#ef4444' : priority === 'Medium' ? '#f59e0b' : '#00f0ff';
  const adminEmail = process.env.EMAIL_USER || 'nimna909@gmail.com';

  const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #00ff66; letter-spacing: 2px; margin: 0; font-size: 20px;">NEW TELEMETRY INTERCEPTED</h2>
                  <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">A new log has been injected into the DataCore Matrix.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 150px; font-size: 14px;">OPERATOR</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-weight: bold; font-size: 14px;">${escapeHtml(senderInfo)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">CATEGORY</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-size: 14px;">${escapeHtml(category)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">PRIORITY</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: ${priorityColor}; font-weight: bold; letter-spacing: 1px; font-size: 14px;">${escapeHtml(priority.toUpperCase())}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">RATING</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-size: 14px;">${escapeHtml(rating)} / 5 Stars</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">TARGET NODES</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #a855f7; font-size: 14px;">${escapeHtml(tags || 'None Selected')}</td>
                    </tr>
                  </table>
                  <div style="margin-top: 30px; padding: 20px; background-color: rgba(0, 240, 255, 0.05); border-left: 4px solid #00f0ff; border-radius: 4px;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; letter-spacing: 1px;">DECRYPTED MESSAGE:</p>
                    <p style="color: #ffffff; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  await sendMailMessage(
    adminEmail,
    `[TELEMETRY] ${priority.toUpperCase()} ALERTS - ${category}`.replace(/[\r\n]+/g, ' '),
    htmlContent
  );
};
