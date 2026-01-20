// lib/mailer.js
import nodemailer from "nodemailer";

// Configuration SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
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

// Fonction d'envoi d'email
export async function sendEmail({ to, subject, html }) {
  try {
    console.log(`📧 Envoi email à: ${to}`);
    
    const mailOptions = {
      from: `"شركة FBM | Société FBM" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      // Encodage pour supporter l'arabe
      encoding: 'UTF-8'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé avec succès!`);
    return info;
    
  } catch (error) {
    console.error("❌ ERREUR D'ENVOI D'EMAIL:", error.message);
    throw error;
  }
}