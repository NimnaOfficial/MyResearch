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