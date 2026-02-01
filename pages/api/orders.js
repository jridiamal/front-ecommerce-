// api/order/client.js
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
      
      // Mettre à jour automatiquement le statut après 4 jours (96 heures)
      const updatedOrders = await Promise.all(orders.map(async (order) => {
        if (order.status === "En attente") {
          const orderDate = new Date(order.createdAt);
          const now = new Date();
          const hoursDiff = Math.floor((now - orderDate) / (1000 * 60 * 60));
          
          // Après 4 jours (96 heures), changer le statut à "Prête"
          if (hoursDiff >= 96) {
            order.status = "Prête";
            await order.save();
            
            // Générer le numéro de commande
            const orderNumber = `#${order._id.toString().slice(-8)}s${Math.floor(Math.random() * 9) + 1}`;
            
            // Envoyer un email de notification au client
            try {
              await sendEmail({
                to: userEmail,
                subject: "🎉 Votre commande est prête !",
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #166534; text-align: center;">✅ Votre commande est prête !</h2>
                    <p>Bonjour <strong>${order.name}</strong>,</p>
                    <p>Nous sommes heureux de vous informer que votre commande est maintenant prête.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>📋 Détails de la commande :</strong></p>
                      <p><strong>Numéro :</strong> ${orderNumber}</p>
                      <p><strong>Date :</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Total :</strong> <span style="color: #166534; font-weight: bold;">${order.total} DT</span></p>
                    </div>
                    
                    <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>📦 Articles commandés :</strong></p>
                      <ul style="padding-left: 20px;">
                        ${order.line_items.map(item => `
                          <li>${item.quantity}x ${item.price_data?.product_data?.name || item.name || 'Produit'} - ${item.price_data?.unit_amount/100 || item.price || 0} DT</li>
                        `).join('')}
                      </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
                    
                    <p style="text-align: center; color: #64748b; font-size: 14px;">
                      Merci pour votre confiance,<br/>
                      <strong>Société FBM</strong>
                    </p>
                  </div>
                `,
              });
              console.log(`📧 Email de commande prête envoyé à ${userEmail}`);
            } catch (emailError) {
              console.error("⚠️ Erreur d'email commande prête:", emailError.message);
            }
          }
        }
        return order;
      }));
      
      // Ajouter le numéro de commande formaté à la réponse
      const ordersWithFormattedId = updatedOrders.map(order => {
        const orderNumber = `#${order._id.toString().slice(-8)}s${Math.floor(Math.random() * 9) + 1}`;
        return {
          ...order._doc,
          orderNumber: orderNumber
        };
      });
      
      return res.status(200).json(ordersWithFormattedId);
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

      // Générer le numéro de commande formaté
      const orderNumber = `#${newOrder._id.toString().slice(-8)}s${Math.floor(Math.random() * 9) + 1}`;
      
      console.log("✅ Commande créée:", orderNumber);

      // Envoyer un email à l'admin (societefbm484@gmail.com)
      try {
        await sendEmail({
          to: "societefbm484@gmail.com",
          subject: `🚨 NOUVELLE COMMANDE ${orderNumber} - Société FBM`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #fff7ed;">
              <h2 style="color: #ea580c; text-align: center;">🚨 NOUVELLE COMMANDE</h2>
              
              <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>🔢 Numéro de commande :</strong> ${orderNumber}</p>
                <p><strong>👤 Client :</strong> ${name}</p>
                <p><strong>📧 Email :</strong> ${userEmail}</p>
                <p><strong>📱 Téléphone :</strong> ${phone}</p>
                <p><strong>📍 Adresse :</strong> ${streetAddress}, ${country}</p>
                <p><strong>💰 Total :</strong> <span style="color: #166534; font-weight: bold;">${total} DT</span></p>
                <p><strong>🔢 ID Commande :</strong> ${newOrder._id}</p>
              </div>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>🛒 Articles :</strong></p>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #e2e8f0;">
                      <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Produit</th>
                      <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Quantité</th>
                      <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${line_items.map(item => `
                      <tr>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.price_data?.product_data?.name || 'Produit'}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
                        <td style="padding: 8px; border: 1px solid #e2e8f0;">${item.price_data?.unit_amount/100 || 0} DT</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 20px;">
                Cette commande sera automatiquement marquée comme "Prête" après 4 jours.
              </p>
            </div>
          `,
        });
        console.log("📧 Email envoyé à l'admin");
      } catch (emailError) {
        console.error("⚠️ Erreur d'email:", emailError.message);
      }

      // Retourner la commande avec le numéro formaté
      return res.status(201).json({
        ...newOrder.toObject(),
        orderNumber: orderNumber
      });
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
      
      // Ajouter le numéro de commande formaté
      const orderNumber = `#${order._id.toString().slice(-8)}s${Math.floor(Math.random() * 9) + 1}`;
      
      return res.status(200).json({
        ...order.toObject(),
        orderNumber: orderNumber
      });
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

      return res.status(200).json({ 
        message: "Commande annulée avec succès",
        orderNumber: `#${order._id.toString().slice(-8)}s${Math.floor(Math.random() * 9) + 1}`
      });
    } catch (err) {
      console.error("Erreur DELETE orders:", err);
      return res.status(500).json({ error: "Erreur DELETE" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}