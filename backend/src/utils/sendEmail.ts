import dotenv from 'dotenv';
import { escapeHtml } from './escapeHtml';
dotenv.config();

// Google Apps Script relay (plain HTTPS, so Render's SMTP block does not matter).
// Configure it with EMAIL_RELAY_URL. The legacy URL below is only a temporary fallback
// so existing deployments keep delivering mail; set the env var, rotate the script URL, then delete it.
const LEGACY_RELAY_URL =
  'https://script.google.com/macros/s/AKfycbwbPWENsU1co5MdQfB6PLjClsAmUa1fgoL-6sltghRNIat3SPUm0btlsA0pqANJZjoGbA/exec';

const RELAY_TIMEOUT_MS = 15000;

const getRelayUrl = (): string => {
  if (process.env.EMAIL_RELAY_URL) return process.env.EMAIL_RELAY_URL;
  console.warn('[MAIL] EMAIL_RELAY_URL is not set - using the legacy built-in relay URL. Please configure the env var.');
  return LEGACY_RELAY_URL;
};

/** Sends one e-mail through the HTTP relay. Throws on any failure. */
const sendViaRelay = async (to: string, subject: string, html: string): Promise<void> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);

  try {
    const response = await fetch(getRelayUrl(), {
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

// ============================================================================
// 1. IDENTITY VERIFICATION MODULE (HTTP RELAY)
// ============================================================================
export const sendSecretCodeEmail = async (toEmail: string, secretCode: string, verifyUrl: string) => {
  // In local development without an explicit EMAIL_RELAY_URL, log immediately for zero-latency offline workflow
  if (!process.env.EMAIL_RELAY_URL && process.env.NODE_ENV !== 'production') {
    console.log(`\n======================================================`);
    console.log(`⚡ [LOCAL DEV MAIL EMULATOR]`);
    console.log(`[RECIPIENT]   : ${toEmail}`);
    console.log(`[SECRET CODE] : ${secretCode}`);
    console.log(`[VERIFY URL]  : ${verifyUrl}`);
    console.log(`======================================================\n`);
    return;
  }
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

  try {
    console.log(`[NETWORK] Transmitting verification payload via HTTP relay to ${toEmail}...`);
    await sendViaRelay(toEmail, 'System Initialization: Verify Your Identity', htmlContent);
    console.log(`[NETWORK] Cryptographic Email successfully delivered!`);
  } catch (error: any) {
    console.error(`[RELAY ERROR] HTTP Email failed:`, error.message);
    // The secret code is a credential: only ever print it outside production
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`DEV ENVIRONMENT BYPASS ACTIVE`);
      console.log(`[YOUR SECRET CODE IS] -> ${secretCode}`);
      console.log(`======================================================\n`);
    }
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

  // Alerts go to the configured admin mailbox
  const adminEmail = process.env.EMAIL_USER || 'nimna909@gmail.com';

  if (!process.env.EMAIL_RELAY_URL && process.env.NODE_ENV !== 'production') {
    console.log(`[LOCAL DEV MAIL EMULATOR] Telemetry Feedback from ${senderInfo} (Priority: ${priority}, Category: ${category})`);
    return;
  }

  // Every user-supplied value is escaped: feedback text must never inject HTML into the admin's inbox
  const htmlContent = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #01030a; padding: 40px 0; width: 100%; font-family: 'Courier New', Courier, monospace;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #050b14; border: 1px solid #1e293b; border-radius: 8px; overflow: hidden; text-align: left;">
              <tr>
                <td style="padding: 30px; border-bottom: 1px solid #1e293b; background-color: #020617;">
                  <h2 style="color: #00ff66; letter-spacing: 2px; margin: 0; font-size: 20px;">NEW TELEMETRY INTERCEPTED</h2>
                  <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">A new log has been injected into the PostgreSQL Matrix.</p>
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

  try {
    await sendViaRelay(
      adminEmail,
      `[TELEMETRY] ${priority.toUpperCase()} ALERTS - ${category}`.replace(/[\r\n]+/g, ' '),
      htmlContent
    );
    console.log(`[NETWORK] Telemetry Email Notification successfully delivered!`);
  } catch (error: any) {
    console.error(`[RELAY ERROR] Telemetry Email failed to send:`, error.message);
  }
};
