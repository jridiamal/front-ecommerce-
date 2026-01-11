import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
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
      return res.status(200).json(orders);
    } catch (err) {
      console.error("Erreur GET orders:", err);
      return res.status(500).json({ error: "Erreur GET" });
    }
  }

  // ---------------- POST -----------------
  if (req.method === "POST") {
    try {
      const { name, phone, streetAddress, country, line_items, total } = req.body;

      if (!line_items || line_items.length === 0) {
        return res.status(400).json({ error: "Le panier est vide" });
      }

      console.log("📦 Création de commande pour:", name);

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

      console.log("✅ Commande créée:", newOrder._id);

      // Envoyer un email à l'admin (societefbm484@gmail.com)
      try {
        await sendEmail({
          to: "societefbm484@gmail.com", // Email de l'admin
          subject: "Nouvelle commande client",
          html: `
            <h2>🚨 NOUVELLE COMMANDE</h2>
            <p><strong>Client :</strong> ${name}</p>
            <p><strong>Email :</strong> ${userEmail}</p>
            <p><strong>Téléphone :</strong> ${phone}</p>
            <p><strong>Adresse :</strong> ${streetAddress}, ${country}</p>
            <p><strong>Total :</strong> ${total} DT</p>
            <p><strong>ID Commande :</strong> ${newOrder._id}</p>
            <hr/>
            <p><strong>Articles :</strong></p>
            <ul>
              ${line_items.map(item => `
                <li>${item.quantity}x ${item.price_data?.product_data?.name || 'Produit'}: ${item.price_data?.unit_amount/100 || 0} DT</li>
              `).join('')}
            </ul>
            <hr/>
            <p>Société FBM</p>
          `,
        });
        console.log("📧 Email envoyé à l'admin");
      } catch (emailError) {
        console.error("⚠️ Erreur d'email:", emailError.message);
        // Continuer même si l'email échoue
      }

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error("❌ Erreur POST orders:", err);
      return res.status(500).json({ error: "Erreur serveur lors du POST" });
    }
  }

  // ---------------- PUT -----------------
  if (req.method === "PUT") {
    try {
      const { id, status, line_items, total } = req.body;
      if (!id) return res.status(400).json({ error: "Missing order id" });

      const order = await Order.findOne({ _id: id, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      if (status) order.status = status;
      if (line_items) order.line_items = line_items;
      if (total) order.total = total;

      await order.save();
      return res.status(200).json(order);
    } catch (err) {
      console.error("Erreur PUT orders:", err);
      return res.status(500).json({ error: "Erreur PUT" });
    }
  }

  // ---------------- DELETE -----------------
  if (req.method === "DELETE") {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: "Paramètres manquants" });

      const order = await Order.findOne({ _id: orderId, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      order.status = "Annulée";
      await order.save();

      return res.status(200).json({ message: "Commande annulée avec succès" });
    } catch (err) {
      console.error("Erreur DELETE orders:", err);
      return res.status(500).json({ error: "Erreur DELETE" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}