import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

dotenv.config(); // Force load the environment variables!

// ============================================================================
// 1. CORE TRANSMISSION ENGINE (NATIVE IPV4 SOCKET ENFORCEMENT)
// ============================================================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // 🔥 THE ULTIMATE SHIELD: Tells the Node.js 'net' module to strictly 
  // reject IPv6 sockets and only bind to IPv4 at the OS level.
  family: 4, 
  // Fail-fast timeout configuration
  connectionTimeout: 3000, 
  greetingTimeout: 3000,
  socketTimeout: 3000,
} as SMTPTransport.Options);

// 🔥 THE DIAGNOSTIC PING
transporter.verify(function (error, success) {
  if (error) {
    console.log("🚨 SMTP PING FAILED 🚨");
    console.log(error.message); 
  } else {
    console.log("✅ GOOGLE SMTP SERVER IS ONLINE (IPV4 NATIVE SOCKET BOUND)");
  }
});

// ============================================================================
// 2. IDENTITY VERIFICATION MODULE
// ============================================================================
export const sendSecretCodeEmail = async (toEmail: string, secretCode: string, verifyUrl: string) => {
  const mailOptions = {
    from: `"CSxPEDIA SECURE" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'System Initialization: Verify Your Identity',
    html: `
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
                    <h1 style="margin: 0; font-size: 42px; letter-spacing: 10px; color: #00f0ff;">${secretCode}</h1>
                  </div>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 0 20px 40px 20px;">
                  <p style="color: #94a3b8; font-size: 14px; margin-bottom: 25px;">Click the secure link below to verify your email and activate your code.</p>
                  <a href="${verifyUrl}" style="background-color: #a855f7; color: #ffffff; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 14px; letter-spacing: 2px; border-radius: 4px; text-transform: uppercase; display: inline-block;">
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
    `,
  };

  try {
    console.log(`[NETWORK] Transmitting payload to ${toEmail} via IPv4 Socket...`);
    await transporter.sendMail(mailOptions);
    console.log(`[NETWORK] ✅ Cryptographic Email successfully transmitted.`);
  } catch (error: any) {
    console.error(`[FIREWALL BLOCKED] ⚠️ Mailer Error:`, error.message);
    console.log(`\n======================================================`);
    console.log(`🚀 DEV ENVIRONMENT / CLOUD BYPASS ACTIVE`);
    console.log(`[YOUR SECRET CODE IS] -> ${secretCode}`);
    console.log(`======================================================\n`);
  }
};

// ============================================================================
// 3. ADMIN TELEMETRY NOTIFICATION MODULE
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

  const mailOptions = {
    from: `"CSxPEDIA Matrix" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, 
    subject: `[TELEMETRY] ${priority.toUpperCase()} ALERTS - ${category}`,
    html: `
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
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-weight: bold; font-size: 14px;">${senderInfo}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">CATEGORY</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-size: 14px;">${category}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">PRIORITY</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: ${priorityColor}; font-weight: bold; letter-spacing: 1px; font-size: 14px;">${priority.toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">RATING</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #fff; font-size: 14px;">${rating} / 5 Stars</td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #94a3b8; font-size: 14px;">TARGET NODES</td>
                      <td style="padding: 12px 0; border-bottom: 1px solid #1e293b; color: #a855f7; font-size: 14px;">${tags || 'None Selected'}</td>
                    </tr>
                  </table>

                  <div style="margin-top: 30px; padding: 20px; background-color: rgba(0, 240, 255, 0.05); border-left: 4px solid #00f0ff; border-radius: 4px;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 10px 0; letter-spacing: 1px;">DECRYPTED MESSAGE:</p>
                    <p style="color: #ffffff; font-size: 15px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                  </div>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[NETWORK] ✅ Telemetry Email successfully transmitted.`);
  } catch (error: any) {
    console.error(`[FIREWALL BLOCKED] ⚠️ Telemetry Email failed to send:`, error.message);
  }
};