import transporter from "./mailer.js";

const sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Farm Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your password for your farm account.</p>
      <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
      <p style="margin: 20px 0;">
        <a href="${resetUrl}" style="
            background-color: #2e7d32;
            color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            display: inline-block;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        ">
            Reset Password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `,
  });
};

export default sendResetPasswordEmail;