// /api/customer/orders.js (pour client)
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if(!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const userEmail = session.user.email;

  // ---------------- GET -----------------
  if (req.method === "GET") {
    try {
      const orders = await Order.find({ email: userEmail }).sort({ createdAt: -1 });
      
      // Mettre à jour automatiquement le statut après 4 jours
      const updatedOrders = await Promise.all(orders.map(async (order) => {
        if (order.status === "En attente") {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const hoursDiff = Math.floor((now - orderDate) / (1000 * 60 * 60));
          
          // Après 4 jours (96 heures), changer le statut à "Prête"
          if (hoursDiff >= 96) {
            order.status = "Prête";
            await order.save();
            
            // Envoyer un email de notification au client
            try {
              await sendEmail({
                to: userEmail,
                subject: "🎉 Votre commande est prête !",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #166534;">✅ Votre commande est prête !</h2>
                    <p>Bonjour <strong>${order.name}</strong>,</p>
                    <p>Votre commande <strong>#${order._id.toString().slice(-8)}</strong> est maintenant prête.</p>
                    <p><strong>Total :</strong> ${order.total} DT</p>
                    <p>Merci pour votre confiance.</p>
                  </div>
                `,
              });
            } catch (emailError) {
              console.error("⚠️ Erreur d'email:", emailError);
            }
          }
        }
        return order;
      }));
      
      return res.status(200).json(updatedOrders);
    } catch (err) {
      console.error("Erreur GET orders:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ---------------- POST -----------------
  if (req.method === "POST") {
    try {
      const { name, phone, streetAddress, country, line_items, total } = req.body;

      if (!line_items || line_items.length === 0) {
        return res.status(400).json({ error: "Le panier est vide" });
      }

      // Créer la commande
      const newOrder = await Order.create({
        userId: session.user.id,
        name,
        email: userEmail,
        phone,
        streetAddress,
        country,
        line_items,
        total,
        status: "En attente",
      });

      // Envoyer un email à l'admin
      try {
        await sendEmail({
          to: "societefbm484@gmail.com",
          subject: "🚨 NOUVELLE COMMANDE",
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h2 style="color: #ea580c;">Nouvelle commande #${newOrder._id.toString().slice(-8)}</h2>
              <p><strong>Client :</strong> ${name}</p>
              <p><strong>Email :</strong> ${userEmail}</p>
              <p><strong>Total :</strong> ${total} DT</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("⚠️ Erreur d'email:", emailError);
      }

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error("❌ Erreur POST orders:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ---------------- DELETE (annulation) -----------------
  if (req.method === "DELETE") {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: "Paramètres manquants" });

      const order = await Order.findOne({ _id: orderId, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      if (order.status !== "En attente") {
        return res.status(400).json({ 
          error: "Seules les commandes en attente peuvent être annulées" 
        });
      }

      order.status = "Annulée";
      order.cancelledAt = new Date();
      await order.save();

      return res.status(200).json({ message: "Commande annulée avec succès" });
    } catch (err) {
      console.error("Erreur DELETE orders:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}