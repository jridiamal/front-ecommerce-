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

      // 1. Envoyer un email à l'admin (societefbm484@gmail.com)
      try {
        await sendEmail({
          to: "societefbm484@gmail.com", // Email de l'admin
          subject: "🛒 Nouvelle commande client",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
              <div style="background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="margin: 0;">🚨 NOUVELLE COMMANDE</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Client: ${name}</p>
              </div>
              
              <div style="padding: 25px; background-color: #f9fafb;">
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #374151; margin-top: 0;">Informations client</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280; width: 40%;">Nom:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${userEmail}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Téléphone:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${phone}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Adresse:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${streetAddress}, ${country}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #374151; margin-top: 0;">Détails de la commande</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">ID Commande:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${newOrder._id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Date:</td>
                      <td style="padding: 8px 0; font-weight: bold;">${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6b7280;">Total:</td>
                      <td style="padding: 8px 0; font-weight: bold; color: #10b981; font-size: 18px;">${total} DT</td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px;">
                  <h3 style="color: #374151; margin-top: 0;">Articles commandés</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left;">Produit</th>
                        <th style="padding: 10px; text-align: center;">Quantité</th>
                        <th style="padding: 10px; text-align: right;">Prix</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${line_items.map(item => `
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 10px;">${item.price_data?.product_data?.name || 'Produit'}</td>
                          <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                          <td style="padding: 10px; text-align: right;">${(item.price_data?.unit_amount/100 || 0).toFixed(2)} DT</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" 
                     style="display: inline-block; background-color: #10b981; color: white; 
                            padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                            font-weight: bold; font-size: 16px;">
                    Voir la commande dans l'admin
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0;">Société FBM - Gestion des Commandes</p>
                <p style="margin: 5px 0;">Notification automatique</p>
              </div>
            </div>
          `,
        });
        console.log("📧 Email envoyé à l'admin");
      } catch (emailError) {
        console.error("⚠️ Erreur d'email admin:", emailError.message);
      }

      // 2. Envoyer un email aux employés approuvés
      try {
        // Liste des employés approuvés (remplacez par vos vraies adresses)
        const approvedEmployees = [
          { email: "societefbm484@gmail.com", name: "Admin FBM" },
          // Ajoutez d'autres emails d'employés ici:
          // { email: "employe1@example.com", name: "Employé 1" },
          // { email: "employe2@example.com", name: "Employé 2" },
        ];

        console.log(`👥 ${approvedEmployees.length} employés à notifier`);

        // 3. Envoyer un email à chaque employé approuvé
        if (approvedEmployees.length > 0) {
          const emailPromises = approvedEmployees.map(async (employee) => {
            try {
              // Construire l'HTML de l'email pour l'employé
              const employeeHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                  <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">📋 NOUVELLE COMMANDE CLIENT</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">À traiter</p>
                  </div>
                  
                  <div style="padding: 25px; background-color: #f9fafb;">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                      Bonjour <strong>${employee.name}</strong>,
                    </p>
                    
                    <p style="color: #374151;">
                      Un nouveau client vient de passer une commande sur le site.
                    </p>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                      <h3 style="color: #374151; margin-top: 0;">Récapitulatif de la commande</h3>
                      
                      <div style="margin-bottom: 15px;">
                        <p style="margin: 5px 0;"><strong>👤 Client:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>📞 Téléphone:</strong> ${phone}</p>
                        <p style="margin: 5px 0;"><strong>📍 Adresse:</strong> ${streetAddress}, ${country}</p>
                        <p style="margin: 5px 0;"><strong>💰 Total:</strong> <span style="color: #10b981; font-weight: bold;">${total} DT</span></p>
                        <p style="margin: 5px 0;"><strong>🆔 Référence:</strong> ${newOrder._id.toString().slice(-8)}</p>
                        <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      
                      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <h4 style="color: #374151; margin-top: 0; margin-bottom: 10px;">Articles commandés:</h4>
                        <ul style="margin: 0; padding-left: 20px;">
                          ${line_items.map(item => `
                            <li style="margin-bottom: 5px;">
                              ${item.quantity}x ${item.price_data?.product_data?.name || 'Produit'} 
                              - ${(item.price_data?.unit_amount/100 || 0).toFixed(2)} DT
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    </div>
                    
                    <p style="color: #374151; margin-bottom: 25px;">
                      Cette commande nécessite une prise en charge rapide.
                      Veuillez vous connecter au tableau de bord pour la traiter.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/orders" 
                         style="display: inline-block; background-color: #3b82f6; color: white; 
                                padding: 12px 30px; text-decoration: none; border-radius: 6px; 
                                font-weight: bold; font-size: 16px;">
                        📊 Accéder au tableau de bord
                      </a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">
                      <em>Statut actuel: <strong style="color: #f59e0b;">En attente</strong></em>
                    </p>
                  </div>
                  
                  <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 5px 0;"><strong>Société FBM - Notification de commande</strong></p>
                    <p style="margin: 5px 0;">Ceci est une notification automatique envoyée à tous les employés approuvés.</p>
                    <p style="margin: 5px 0; font-size: 12px;">© ${new Date().getFullYear()} Société FBM</p>
                  </div>
                </div>
              `;

              // Envoyer l'email à l'employé
              await sendEmail({
                to: employee.email,
                subject: `📦 Nouvelle commande client - ${name}`,
                html: employeeHtml
              });

              console.log(`📧 Email envoyé à l'employé: ${employee.name} (${employee.email})`);
              return { success: true, employee: employee.name };
              
            } catch (empEmailError) {
              console.error(`❌ Erreur email pour ${employee.email}:`, empEmailError.message);
              return { 
                success: false, 
                employee: employee.name, 
                error: empEmailError.message 
              };
            }
          });

          // Attendre que tous les emails soient envoyés
          const results = await Promise.allSettled(emailPromises);
          
          // Analyser les résultats
          const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
          const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
          
          console.log(`📊 Résultat des emails employés: ${successful} succès, ${failed} échecs`);
          
          // Enregistrer dans la commande le résultat des notifications
          newOrder.employeeNotifications = {
            sent: successful,
            failed: failed,
            total: approvedEmployees.length,
            sentAt: new Date()
          };
          await newOrder.save();
          
        } else {
          console.log("ℹ️ Aucun employé approuvé configuré");
        }

      } catch (employeesError) {
        console.error("❌ Erreur lors de l'envoi aux employés:", employeesError.message);
        // Continuer même si l'envoi aux employés échoue
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