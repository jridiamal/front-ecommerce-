// pages/api/checkout.js - VERSION ULTRA SIMPLE
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, streetAddress, country, cartProducts, userId } = req.body;

    // Créer la commande simplement
    const order = await Order.create({
      userId,
      name,
      email,
      phone,
      streetAddress,
      country,
      line_items: cartProducts,
      total: 0, // Calculer si nécessaire
      paid: false,
      status: "En attente",
    });

    console.log("✅ Commande créée:", order._id);

    // EMAIL TRÈS SIMPLE POUR EMPLOYÉS
    try {
      await sendEmail({
        to: "societefbm484@gmail.com", // Seulement l'admin pour commencer
        subject: `Nouvelle commande de ${name}`,
        html: `<p>Nouvelle commande reçue de ${name} (${phone}).</p>
               <p>Total: ${req.body.total || 0} DT</p>
               <p><a href="${process.env.NEXTAUTH_URL}/admin/orders">Voir commande</a></p>`
      });
      console.log("📧 Email envoyé à l'admin");
    } catch (e) {
      console.log("⚠️ Email non envoyé (mais commande créée):", e.message);
    }

    return res.status(201).json(order);
    
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(500).json({ error: "Erreur" });
  }
}