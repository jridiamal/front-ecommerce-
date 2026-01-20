import nodemailer from "nodemailer";

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true pour 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.trim(), // Important: .trim() pour enlever les espaces
  },
  tls: {
    rejectUnauthorized: false // Pour éviter les erreurs de certificat
  }
});

// Fonction principale d'envoi d'email
export async function sendEmail({ to, subject, html }) {
  try {
    console.log(`📧 Envoi email à: ${to}`);
    
    if (!to || !subject || !html) {
      throw new Error("Paramètres email manquants");
    }

    const mailOptions = {
      from: `"Société FBM" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé: ${info.messageId}`);
    return info;
    
  } catch (error) {
    console.error("❌ Erreur envoi email:", error.message);
    throw error;
  }
}

// Fonction spécifique pour les notifications employés
export async function sendOrderEmail({ to, subject, html }) {
  return sendEmail({ to, subject, html });
}

// Fonction pour notifications aux employés
export async function sendEmployeeNotification({ 
  to, 
  employeeName, 
  senderName, 
  orderId, 
  customerName, 
  totalAmount,
  message 
}) {
  const subject = `Nouvelle commande assignée par ${senderName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
        <h1>Nouvelle Commande Assignée</h1>
      </div>
      <div style="padding: 20px;">
        <p>Bonjour ${employeeName},</p>
        <p>${senderName} vous a assigné une nouvelle commande.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Client:</strong> ${customerName}</p>
          <p><strong>Commande:</strong> ${orderId.slice(-6)}</p>
          <p><strong>Montant:</strong> ${totalAmount.toFixed(2)} TND</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/orders" 
             style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Voir la commande
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}