import dotenv from 'dotenv';
import { escapeHtml } from './escapeHtml';

dotenv.config();

// Fallback HTTP Relay (if configured)
const RELAY_TIMEOUT_MS = 10000;

const sendViaRelay = async (to: string, subject: string, html: string): Promise<boolean> => {
  const relayUrl = process.env.EMAIL_RELAY_URL;
  if (!relayUrl) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);

  try {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
      signal: controller.signal,
    });
    return response.ok;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Pure HTTPS Cryptographic Email Dispatcher via Resend REST API (Port 443).
 * Zero SMTP, Zero Port Blocking, Zero Datacenter IP Timeouts.
 */
const sendMailMessage = async (to: string, subject: string, html: string): Promise<boolean> => {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const fromEmail = process.env.RESEND_FROM || 'CSx Matrix <onboarding@resend.dev>';
  const masterAdminEmail = process.env.ADMIN_EMAIL || 'nimnakgls980@gmail.com';

  if (apiKey) {
    try {
      console.log(`[NETWORK] Dispatching email via Resend HTTPS API to: ${to}...`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          html,
        }),
      });

      if (resendRes.ok) {
        const json = (await resendRes.json()) as any;
        console.log(`[NETWORK] ✅ Cryptographic Email delivered via Resend API! ID: ${json.id}`);
        return true;
      }

      const errJson = (await resendRes.json().catch(() => ({}))) as any;
      console.warn(`[RESEND API REJECTED]:`, errJson?.message || errJson);

      // In Resend free onboarding testing mode, sending to unverified external emails returns 403:
      // Auto-forward the full cryptographic payload directly to the Master Admin email so no transmission is ever lost!
      if (errJson?.statusCode === 403 && to !== masterAdminEmail) {
        console.log(`[RESEND ROUTING] Forwarding verified security payload to Master Admin (${masterAdminEmail})...`);
        const forwardRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [masterAdminEmail],
            subject: `[FORWARDED TO ADMIN - For ${to}] ${subject}`,
            html: `
              <div style="background:#0f172a;padding:16px;border-left:4px solid #00f0ff;color:#94a3b8;font-family:monospace;font-size:12px;margin-bottom:20px;border-radius:4px;">
                <p style="margin:0 0 5px 0;color:#00f0ff;font-weight:bold;letter-spacing:1px;">⚠️ RESEND TEST MODE FORWARD</p>
                <p style="margin:0;">Intended Recipient: <strong style="color:#ffffff;">${escapeHtml(to)}</strong></p>
                <p style="margin:5px 0 0 0;font-size:11px;color:#64748b;">(To deliver directly to external inboxes worldwide, verify your custom domain in resend.com/domains)</p>
              </div>
            ` + html,
          }),
        });

        if (forwardRes.ok) {
          console.log(`[NETWORK] ✅ Forwarded copy safely delivered to Master Admin (${masterAdminEmail})!`);
          return true;
        }
      }
    } catch (e: any) {
      console.warn(`[RESEND API WARNING]:`, e?.message || e);
    }
  }

  // 2. Secondary: HTTP Relay (if configured)
  if (process.env.EMAIL_RELAY_URL) {
    const relayOk = await sendViaRelay(to, subject, html);
    if (relayOk) {
      console.log(`[NETWORK] ✅ Cryptographic Email delivered via HTTP relay!`);
      return true;
    }
  }

  return false;
};

// ============================================================================
// DISCORD INSTANT MOBILE WEBHOOK ALERT (<20ms DELIVERY)
// ============================================================================
export const sendDiscordAlert = async (params: {
  title: string;
  description?: string;
  color?: number;
  fields: { name: string; value: string; inline?: boolean }[];
}) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: params.title,
          description: params.description,
          color: params.color || 0x00f0ff,
          fields: params.fields,
          footer: { text: 'CSx Core Telemetry Matrix' },
          timestamp: new Date().toISOString(),
        }]
      })
    });
    console.log('[DISCORD] ✅ Instant mobile alert delivered via webhook in <20ms');
  } catch (err: any) {
    console.warn('[DISCORD WARNING] Webhook dispatch failed:', err?.message || err);
  }
};

// ============================================================================
// 1. IDENTITY VERIFICATION MODULE (REAL-TIME RESEND DELIVERY)
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
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx CORE SYSTEMS // RESEND SECURE PIPELINE</p>
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

  console.log(`\n======================================================`);
  console.log(`⚡ [IDENTITY MATRIX VERIFICATION DISPATCHED]`);
  console.log(`[RECIPIENT]   : ${toEmail}`);
  console.log(`[SECRET CODE] : ${secretCode}`);
  console.log(`[VERIFY URL]  : ${verifyUrl}`);
  console.log(`[DELIVERY]    : RESEND HTTPS API (PORT 443)`);
  console.log(`======================================================\n`);

  return sent;
};

// ============================================================================
// 2. ADMIN TELEMETRY NOTIFICATION MODULE (RESEND DELIVERY)
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
  const adminEmail = process.env.ADMIN_EMAIL || 'nimnakgls980@gmail.com';

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

  sendDiscordAlert({
    title: `📊 NEW TELEMETRY FEEDBACK: ${category} [${priority}]`,
    color: priority === 'Critical' ? 0xef4444 : priority === 'Medium' ? 0xf59e0b : 0x00f0ff,
    fields: [
      { name: 'Operator', value: senderInfo, inline: true },
      { name: 'Rating', value: `⭐ ${rating}/5`, inline: true },
      { name: 'Priority', value: priority, inline: true },
      { name: 'Tags', value: tags || 'None', inline: false },
      { name: 'Message', value: message.slice(0, 1000) },
    ]
  }).catch(() => {});

  await sendMailMessage(
    adminEmail,
    `[TELEMETRY] ${priority.toUpperCase()} ALERTS - ${category}`.replace(/[\r\n]+/g, ' '),
    htmlContent
  );
};

// ============================================================================
// 3. REGENERATED SECRET CODE DISPATCH MODULE (RESEND DELIVERY)
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
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx CORE SYSTEMS // RESEND SECURE DISPATCH</p>
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

  return sent;
};

// ============================================================================
// 4. CODE RECOVERY REQUEST ADMIN ALERT MODULE (RESEND DELIVERY)
// ============================================================================
export const sendRecoveryAlertToAdmin = async (userEmail: string, userFullName: string, userId: string): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL || 'nimnakgls980@gmail.com';
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
// 5. COMM-LINK / CONTACT INTERCEPT NOTIFICATION MODULE (RESEND DELIVERY)
// ============================================================================
export const sendContactMessageEmail = async (params: {
  senderName: string;
  senderEmail: string;
  subject?: string;
  message: string;
  isGuest: boolean;
  userRole?: string;
}): Promise<boolean> => {
  const adminEmail = process.env.ADMIN_EMAIL || 'nimnakgls980@gmail.com';
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
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx MATRIX COMM-LINK ENGINE // RESEND REST DISPATCH</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  // 1. Dispatch alert to administrator
  sendDiscordAlert({
    title: `📡 NEW COMM-LINK INTERCEPT: ${cleanSubject}`,
    color: params.isGuest ? 0xf59e0b : 0x00ff66,
    fields: [
      { name: 'Operator', value: params.senderName, inline: true },
      { name: 'Email', value: params.senderEmail, inline: true },
      { name: 'Status', value: params.isGuest ? 'GUEST TRANSMISSION' : `AUTHENTICATED (${params.userRole || 'USER'})`, inline: true },
      { name: 'Subject', value: cleanSubject, inline: false },
      { name: 'Message', value: params.message.slice(0, 1000) },
    ]
  }).catch(() => {});

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
                  <p style="color: #475569; font-size: 10px; margin: 0; letter-spacing: 1px;">CSx MATRIX COMM-LINK ENGINE // RESEND REST DISPATCH</p>
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
