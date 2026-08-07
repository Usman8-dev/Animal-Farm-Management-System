import transporter from "./mailer.js";

const sendVerificationEmail = async (email, verificationToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

  await transporter.sendMail({
    from: `"Farm Management System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <p>Welcome! Please verify your email address to unlock full access.</p>
        <p style="margin: 20px 0;">
        <a href="${verifyUrl}" style="
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
            Verify Email Address
        </a>
        </p>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

export default sendVerificationEmail;
