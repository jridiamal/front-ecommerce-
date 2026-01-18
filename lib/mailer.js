// lib/mailer.js
import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html }) {
  console.log("📧 Préparation d'email à:", to);
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("❌ Configuration SMTP manquante!");
    throw new Error("Configuration SMTP manquante");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.trim(),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Société FBM" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email envoyé:", info.messageId);
    return info;
    
  } catch (error) {
    console.error("❌ Erreur d'envoi d'email:", error.message);
    throw error;
  }
}