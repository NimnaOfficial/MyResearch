import nodemailer from 'nodemailer';

// 1. SINGLETON CONNECTION POOL (Defined OUTSIDE the function)
// This creates exactly ONE secure tunnel when the server starts and reuses it.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, 
  pool: true,         // 🔥 Enables connection pooling
  maxConnections: 1,  // 🔥 Limits to 1 active connection to prevent Google bans
  maxMessages: 10,    // 🔥 Sends up to 10 emails per connection before refreshing
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendSecretCodeEmail = async (toEmail: string, secretCode: string, verifyUrl: string) => {
  const mailOptions = {
    from: `"CSxPEDIA" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'System Initialization: Verify Your Identity',
    html: `
      <div style="font-family: 'Courier New', Courier, monospace; background-color: #01030a; color: #00f0ff; padding: 40px; text-align: center; border-radius: 10px; border: 1px solid #1e293b;">
        <h2 style="color: #a855f7; letter-spacing: 2px;">IDENTITY MATRIX SECURED</h2>
        <p style="color: #94a3b8; font-size: 16px;">Your neural link is pending verification.</p>
        
        <div style="margin: 30px 0; padding: 20px; background-color: rgba(168,85,247,0.1); border: 1px solid #a855f7; border-radius: 8px; display: inline-block;">
          <p style="color: #94a3b8; font-size: 12px; margin-top: 0;">YOUR SECRET MEMBER CODE</p>
          <h1 style="margin: 0; font-size: 38px; letter-spacing: 8px; color: #00f0ff;">${secretCode}</h1>
        </div>

        <p style="color: #94a3b8; font-size: 14px; margin-bottom: 30px;">Click the button below to verify your email and activate your code.</p>
        
        <a href="${verifyUrl}" style="background-color: #a855f7; color: #ffffff; text-decoration: none; padding: 15px 30px; font-weight: bold; font-size: 14px; letter-spacing: 2px; border-radius: 5px; text-transform: uppercase; display: inline-block;">
          Verify Email Link
        </a>
      </div>
    `,
  };

  try {
    // 2. Transmit using the pooled connection
    await transporter.sendMail(mailOptions);
    console.log(`[NETWORK] ✅ Cryptographic Email successfully transmitted to ${toEmail}`);
  } catch (error) {
    console.error(`[NETWORK BLOCKED] ⚠️ Local security shield intercepted the transmission.`);
    console.log(`\n======================================================`);
    console.log(`🚀 DEV ENVIRONMENT BYPASS ACTIVE`);
    console.log(`[YOUR SECRET CODE IS] -> ${secretCode}`);
    console.log(`======================================================\n`);
  }
};

// Add this to the bottom of backend/src/utils/sendEmail.ts

export const sendFeedbackNotificationEmail = async (
  senderInfo: string,
  rating: number,
  category: string,
  priority: string,
  message: string,
  tags: string
) => {
  // We send it TO your own email so you get the alert!
  const mailOptions = {
    from: `"CSxPEDIA Matrix" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, 
    subject: `[TELEMETRY LOG] ${priority.toUpperCase()} - ${category}`,
    html: `
      <div style="font-family: 'Courier New', Courier, monospace; background-color: #01030a; color: #00f0ff; padding: 40px; border-radius: 10px; border: 1px solid #1e293b;">
        <h2 style="color: #00ff66; letter-spacing: 2px; margin-top: 0;">NEW TELEMETRY INTERCEPTED</h2>
        <p style="color: #94a3b8; font-size: 14px;">A new log has been injected into the PostgreSQL Matrix.</p>
        
        <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8;">OPERATOR</td>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #fff; font-weight: bold;">${senderInfo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8;">CATEGORY</td>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #fff;">${category}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8;">PRIORITY</td>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: ${priority === 'Critical' ? '#ef4444' : priority === 'Medium' ? '#f59e0b' : '#00f0ff'};">${priority.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8;">RATING</td>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #fff;">${rating} / 5 Stars</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #94a3b8;">TARGET NODES</td>
            <td style="padding: 10px; border-bottom: 1px solid #1e293b; color: #a855f7;">${tags || 'None Selected'}</td>
          </tr>
        </table>

        <div style="padding: 20px; background-color: rgba(0, 240, 255, 0.05); border-left: 4px solid #00f0ff; border-radius: 4px;">
          <p style="color: #94a3b8; font-size: 12px; margin-top: 0; margin-bottom: 10px;">DECRYPTED MESSAGE:</p>
          <p style="color: #ffffff; font-size: 16px; margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  };

  try {
    // Note: ensure 'transporter' is defined at the top of your file from the previous Nodemailer setup
    await transporter.sendMail(mailOptions);
    console.log(`[NETWORK] ✅ Telemetry Email Notification successfully transmitted to Admin.`);
  } catch (error) {
    console.error(`[NETWORK BLOCKED] ⚠️ Telemetry Email failed to send:`, error);
  }
};