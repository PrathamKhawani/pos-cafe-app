import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: `"Odoo POS Cafe" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your OTP for Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 16px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested a password reset. Please use the following One-Time Password (OTP) to proceed:</p>
        <div style="text-align: center; margin: 40px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f8fafc; padding: 15px 30px; border-radius: 10px; border: 2px dashed #cbd5e1;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 Odoo POS Cafe - Secure Auth System</p>
      </div>
    `,
  };

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP Email Sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};
