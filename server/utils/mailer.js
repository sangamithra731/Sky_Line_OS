import nodemailer from "nodemailer";

let transporter;

export async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    console.log("📧 Using configured SMTP:", process.env.SMTP_HOST);
    return transporter;
  }

  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log("📧 Using Ethereal test:", testAccount.user);
  return transporter;
}

export async function sendMail({ to, subject, html }) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"Skyline Club" <noreply@skyline.edu>',
      to, subject, html,
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`📧 Sent → ${to}`);
    console.log(`   Preview: ${previewUrl}`);
    return { success: true, previewUrl };
  } catch (err) {
    console.error("📧 Email failed:", err.message);
    return { success: false, error: err.message };
  }
}