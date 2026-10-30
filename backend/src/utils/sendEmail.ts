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
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'nimnakgls980@gmail.com';

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

// ============================================================================
// 3. REGENERATED SECRET CODE DISPATCH MODULE
// ============================================================================
export const sendRegeneratedCodeEmail = async (toEmail: string, newSecretCode: string): Promise<boolean> => {
  const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #00f0ff; letter-spacing: 3px; margin: 0; font-size: 22px; text-transform: uppercase;">CIPHER ACCESS REGENERATED</h2>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">Your cryptographic access code has been updated by system administration.</p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <div style="background-color: rgba(0, 240, 255, 0.05); border: 1px dashed #00f0ff; border-radius: 8px; padding: 25px 40px; display: inline-block;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0 0 10px 0; letter-spacing: 2px; text-transform: uppercase;">New Secret Login Code</p>
                    <h1 style="margin: 0; font-size: 38px; letter-spacing: 8px; color: #00ff66;">${escapeHtml(newSecretCode)}</h1>
                  </div>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 25px; max-width: 450px; line-height: 1.6;">
                    Your previous access code has been invalidated. Please store this new code in a secure location. You may now use it immediately to establish access to the platform.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px; background-color: #020617; border-top: 1px solid #1e293b;">
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx CORE SYSTEMS // AUTOMATED SECURITY DISPATCH</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  const sent = await sendMailMessage(
    toEmail,
    'CSx Security Dispatch: New Secret Member Cipher Generated',
    htmlContent
  );

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`⚡ [REGENERATED CODE DISPATCHED]`);
    console.log(`[RECIPIENT]   : ${toEmail}`);
    console.log(`[NEW CIPHER]  : ${newSecretCode}`);
    console.log(`[STATUS]      : ${sent ? 'DELIVERED IN REAL-TIME ✅' : 'PENDING'}`);
    console.log(`======================================================\n`);
  }

  return sent;
};

// ============================================================================
// 4. CODE RECOVERY REQUEST ADMIN ALERT MODULE
// ============================================================================
export const sendRecoveryAlertToAdmin = async (userEmail: string, userFullName: string, userId: string): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'nimnakgls980@gmail.com';
  const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #f59e0b; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #f59e0b; letter-spacing: 2px; margin: 0; font-size: 20px;">⚠️ CODE RECOVERY REQUESTED</h2>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 6px;">An operator has requested secret login cipher regeneration.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px; font-size: 13px;">OPERATOR</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #fff; font-weight: bold; font-size: 13px;">${escapeHtml(userFullName || 'Unknown')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">EMAIL</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #00f0ff; font-weight: bold; font-size: 13px;">${escapeHtml(userEmail)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">NODE ID</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-family: monospace; font-size: 12px;">${escapeHtml(userId)}</td>
                    </tr>
                  </table>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 20px;">
                    Log into the Admin Console &rarr; Global Node Roster to review and regenerate this operator's login code with 1 click.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  return sendMailMessage(
    adminEmail,
    `[ACTION REQUIRED] Code Recovery Request: ${userEmail}`,
    htmlContent
  );
};

// ============================================================================
// 5. COMM-LINK / CONTACT INTERCEPT NOTIFICATION MODULE
// ============================================================================
export const sendContactMessageEmail = async (params: {
  senderName: string;
  senderEmail: string;
  subject?: string;
  message: string;
  isGuest: boolean;
  userRole?: string;
}): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'nimnakgls980@gmail.com';
  const cleanSubject = (params.subject || 'COMM-LINK INQUIRY').replace(/[\r\n]+/g, ' ');

  const adminHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #00f0ff; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <span style="background: rgba(0,240,255,0.15); border: 1px solid #00f0ff; color: #00f0ff; font-size: 10px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">
                    ${params.isGuest ? 'GUEST COMM-LINK' : 'AUTHENTICATED OPERATOR MESSAGE'}
                  </span>
                  <h2 style="color: #00f0ff; letter-spacing: 2px; margin: 10px 0 0 0; font-size: 20px;">INCOMING CONTACT INTERCEPT</h2>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">A direct transmission has been received through the Platform Comm-Link.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; width: 140px; font-size: 13px;">SENDER NAME</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #fff; font-weight: bold; font-size: 13px;">${escapeHtml(params.senderName)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">SENDER EMAIL</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #00ff66; font-weight: bold; font-size: 13px;">
                        <a href="mailto:${escapeHtml(params.senderEmail)}" style="color: #00ff66; text-decoration: none;">${escapeHtml(params.senderEmail)}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">STATUS</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: ${params.isGuest ? '#f59e0b' : '#38bdf8'}; font-size: 13px; font-weight: bold;">
                        ${params.isGuest ? 'GUEST TRANSMISSION' : `AUTHENTICATED (${params.userRole || 'USER'})`}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 13px;">SUBJECT</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #1e293b; color: #fff; font-size: 13px; font-weight: bold;">${escapeHtml(cleanSubject)}</td>
                    </tr>
                  </table>

                  <div style="margin-top: 25px; padding: 20px; background-color: rgba(0, 240, 255, 0.05); border-left: 4px solid #00f0ff; border-radius: 4px;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0 0 8px 0; letter-spacing: 1px;">TRANSMISSION PAYLOAD:</p>
                    <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 15px; background-color: #020617; border-top: 1px solid #1e293b;">
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx MATRIX COMM-LINK ENGINE // DIRECT INTERCEPT</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  // 1. Dispatch alert to administrator
  await sendMailMessage(
    adminEmail,
    `[COMM-LINK] ${cleanSubject} - from ${params.senderName}`.replace(/[\r\n]+/g, ' '),
    adminHtml
  );

  // 2. Dispatch auto-confirmation to sender if valid email provided
  if (params.senderEmail && params.senderEmail.includes('@') && !params.senderEmail.includes('guest@matrix.network')) {
    const confirmationHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #10b981; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #10b981; letter-spacing: 2px; margin: 0; font-size: 20px;">TRANSMISSION RECEIVED</h2>
                  <p style="color: #94a3b8; font-size: 13px; margin-top: 5px;">Your message has been safely logged in the CSx Core Matrix.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <p style="color: #e2e8f0; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
                    Greetings <strong>${escapeHtml(params.senderName)}</strong>,
                  </p>
                  <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
                    We have successfully received your inquiry regarding <strong>"${escapeHtml(cleanSubject)}"</strong>. Our team will review the telemetry and respond to your email frequency shortly.
                  </p>
                  <div style="padding: 15px 20px; background-color: rgba(16, 185, 129, 0.05); border-left: 3px solid #10b981; border-radius: 4px;">
                    <p style="color: #64748b; font-size: 11px; margin: 0 0 5px 0;">YOUR TRANSMISSION COPY:</p>
                    <p style="color: #cbd5e1; font-size: 13px; margin: 0; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 15px; background-color: #020617; border-top: 1px solid #1e293b;">
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx MATRIX COMM-LINK ENGINE // AUTO-CONFIRMATION</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    sendMailMessage(
      params.senderEmail,
      `Confirmation: We received your message [${cleanSubject}]`,
      confirmationHtml
    ).catch(err => console.error('[EMAIL] Failed to send sender auto-confirmation:', err));
  }

  return true;
};
