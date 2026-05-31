import nodemailer from 'nodemailer';

export const sendSecretCodeEmail = async (toEmail: string, secretCode: string, verifyUrl: string) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"System Matrix Gateway" <${process.env.EMAIL_USER}>`,
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
        
        <p style="color: #ef4444; font-size: 12px; margin-top: 40px;">WARNING: This code acts as your identity and access key. Store it securely.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};