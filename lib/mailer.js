import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.trim(),
  },

  // 🔥 مهم تحت الضغط
  pool: true,
  maxConnections: 5,
  maxMessages: 100,

  // ⏱️ حماية من التعليق
  socketTimeout: 10000,
  connectionTimeout: 10000,

  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

// 🔁 retry logic
async function safeSendMail(mailOptions, retries = 2) {
  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    if (retries > 0) {
      console.warn("🔁 Retry email...", retries);
      return safeSendMail(mailOptions, retries - 1);
    }
    throw err;
  }
}

// ✅ هذه ما تكسّرش السيستام
export async function sendEmail({ to, subject, html }) {
  try {
    if (!to || !subject || !html) {
      console.error("❌ Email params missing");
      return { success: false };
    }

    const mailOptions = {
      from: `"Société FBM" <${process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      html,
    };

    const info = await safeSendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);

    return { success: true, info };
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    return { success: false, error: err.message };
  }
}

// 🔹 backward compatibility
export async function sendOrderEmail(data) {
  return sendEmail(data);
}

export async function sendEmployeeNotification({
  to,
  employeeName,
  senderName,
  orderId,
  customerName,
  totalAmount,
  message,
}) {
  const subject = `Nouvelle commande assignée par ${senderName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px;margin:auto">
      <h2>Nouvelle commande</h2>
      <p>Bonjour ${employeeName},</p>
      <p>Nouvelle commande assignée.</p>

      <ul>
        <li><b>Client:</b> ${customerName}</li>
        <li><b>Commande:</b> ${orderId.slice(-6)}</li>
        <li><b>Total:</b> ${Number(totalAmount).toFixed(2)} TND</li>
      </ul>

      ${message ? `<p><b>Message:</b> ${message}</p>` : ""}

      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/orders">
        Voir la commande
      </a>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
