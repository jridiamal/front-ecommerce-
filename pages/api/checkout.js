import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { sendEmail } from "@/lib/mailer";
import clientPromise from "@/lib/mongodb"; // Ajoutez cette importation
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, phone, streetAddress, country, cartProducts, userId } = req.body;

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    const line_items = cartProducts
      .map(p => {
        const product = productsFromDb.find(pr => pr._id.toString() === p._id.toString());
        if (!product) return null;

        let colorVariant = null;
        if (product?.properties?.colorVariants?.length > 0 && p.colorId) {
          colorVariant = product.properties.colorVariants.find(v => v._id.toString() === p.colorId) || null;
        }

        const quantity = Number(p.quantity || 1);
        const price = Number(product.price || 0);

        return {
          productId: product._id.toString(),
          productTitle: product.title,
          reference: product.reference || "N/A",
          color: colorVariant?.color || p.color || "default",
          colorId: colorVariant ? colorVariant._id.toString() : null,
          quantity,
          price,
          image: colorVariant ? colorVariant.imageUrl : product.images?.[0] || "",
        };
      })
      .filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit disponible pour cette commande" });
    }

    const total = line_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Créer la commande
    const order = await Order.create({
      userId,
      name,
      email,
      phone,
      streetAddress,
      country,
      line_items,
      total,
      paid: false,
      status: "En attente",
    });

    console.log("✅ Commande créée:", order._id);

    // 🔴 CORRECTION: RÉCUPÉRER TOUS LES EMPLOYÉS APPROUVÉS
    let approvedEmployees = [];
    
    try {
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCollection = db.collection("employees");
      
      // Récupérer tous les employés avec status "approved"
      approvedEmployees = await employeesCollection.find({ 
        status: "approved" 
      }).toArray();
      
      console.log(`👥 ${approvedEmployees.length} employé(s) approuvé(s) trouvé(s)`);
      
    } catch (dbError) {
      console.error("❌ Erreur base de données employés:", dbError.message);
      // Fallback: email admin seulement
      approvedEmployees = [
        { email: "societefbm484@gmail.com", name: "Admin FBM" }
      ];
    }

    // S'assurer qu'il y a au moins l'admin
    const adminExists = approvedEmployees.some(emp => emp.email === "societefbm484@gmail.com");
    if (!adminExists) {
      approvedEmployees.push({ 
        email: "societefbm484@gmail.com", 
        name: "Admin FBM" 
      });
    }

    // 1. ENVOYER EMAIL À TOUS LES EMPLOYÉS APPROUVÉS
    if (approvedEmployees.length > 0) {
      try {
        // Préparer les emails des employés
        const employeeEmails = approvedEmployees.map(emp => emp.email);
        
        // Construire le HTML détaillé pour les employés
        const employeeHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvelle Commande</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 700px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; }
              .info-box { background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6; }
              .product-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .product-table th { background-color: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
              .product-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
              .btn-primary { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 5px; }
              .alert { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🚨 NOUVELLE COMMANDE CLIENT</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">À traiter immédiatement</p>
              </div>
              
              <div class="content">
                <div class="alert">
                  <strong>⚠️ ACTION REQUISE :</strong> Un client vient de passer une nouvelle commande. Veuillez la traiter dans les plus brefs délais.
                </div>
                
                <div class="info-box">
                  <h2 style="color: #1f2937; margin-top: 0;">📋 Informations client</h2>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; width: 120px;"><strong>👤 Nom :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>📧 Email :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>📞 Téléphone :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${phone}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>📍 Adresse :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${streetAddress}, ${country}</td>
                    </tr>
                  </table>
                </div>
                
                <div class="info-box">
                  <h2 style="color: #1f2937; margin-top: 0;">📦 Détails de la commande</h2>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0; width: 120px;"><strong>🆔 Référence :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${order._id.toString().slice(-8).toUpperCase()}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>📅 Date/heure :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold;">${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>💰 Montant total :</strong></td>
                      <td style="padding: 8px 0; font-weight: bold; color: #059669; font-size: 20px;">${total.toFixed(2)} DT</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>📊 Statut :</strong></td>
                      <td style="padding: 8px 0;">
                        <span style="background-color: #fbbf24; color: #78350f; padding: 4px 12px; border-radius: 20px; font-weight: bold;">
                          En attente de traitement
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1f2937; margin-top: 0;">🛍️ Articles commandés</h2>
                  <table class="product-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th style="text-align: center;">Référence</th>
                        <th style="text-align: center;">Couleur</th>
                        <th style="text-align: center;">Qté</th>
                        <th style="text-align: right;">Prix unitaire</th>
                        <th style="text-align: right;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${line_items.map(item => {
                        const itemTotal = item.price * item.quantity;
                        return `
                          <tr>
                            <td>
                              <div style="display: flex; align-items: center;">
                                ${item.image ? `<img src="${item.image}" alt="${item.productTitle}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;">` : ''}
                                <span>${item.productTitle}</span>
                              </div>
                            </td>
                            <td style="text-align: center;">${item.reference}</td>
                            <td style="text-align: center;">${item.color}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${item.price.toFixed(2)} DT</td>
                            <td style="text-align: right; font-weight: bold;">${itemTotal.toFixed(2)} DT</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #f8fafc;">
                        <td colspan="5" style="text-align: right; padding: 15px; font-weight: bold;">Total général :</td>
                        <td style="text-align: right; padding: 15px; font-weight: bold; color: #059669; font-size: 18px;">
                          ${total.toFixed(2)} DT
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="color: #4b5563; margin-bottom: 20px;">
                    <strong>${approvedEmployees.length} employé(s) notifié(s) :</strong> 
                    ${approvedEmployees.map(emp => emp.name).join(', ')}
                  </p>
                  
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" class="btn-primary">
                    📊 Accéder au tableau de bord
                  </a>
                  
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders/${order._id}" class="btn-primary" style="background-color: #059669;">
                    🔍 Voir cette commande
                  </a>
                </div>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
                  <h3 style="color: #1f2937; margin-top: 0;">📝 Instructions :</h3>
                  <ol style="margin: 10px 0 0 20px; padding: 0;">
                    <li>Consultez les détails de la commande</li>
                    <li>Contactez le client pour confirmation</li>
                    <li>Préparez les articles commandés</li>
                    <li>Mettez à jour le statut dans le système</li>
                  </ol>
                </div>
              </div>
              
              <div class="footer">
                <p style="margin: 5px 0;"><strong>Société FBM - Notification de commande</strong></p>
                <p style="margin: 5px 0; font-size: 13px;">Notification automatique envoyée à tous les employés approuvés</p>
                <p style="margin: 5px 0; font-size: 12px;">© ${new Date().getFullYear()} Société FBM - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Envoyer l'email à tous les employés approuvés
        await sendEmail({
          to: employeeEmails,
          subject: `🚨 NOUVELLE COMMANDE - ${name} - ${total.toFixed(2)} DT`,
          html: employeeHtml,
        });
        
        console.log(`✅ Email envoyé à ${approvedEmployees.length} employé(s) approuvé(s)`);
        
        // Enregistrer qui a été notifié
        order.employeeNotifications = {
          sent: true,
          to: employeeEmails,
          employeeCount: approvedEmployees.length,
          employeeNames: approvedEmployees.map(emp => emp.name),
          sentAt: new Date()
        };
        
      } catch (emailError) {
        console.error("❌ Erreur envoi email aux employés:", emailError.message);
        
        order.employeeNotifications = {
          sent: false,
          error: emailError.message,
          sentAt: new Date()
        };
      }
    } else {
      console.log("ℹ️ Aucun employé approuvé à notifier");
    }

    // 2. ENVOYER EMAIL DE CONFIRMATION AU CLIENT
    try {
      const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0;">✅ Commande confirmée !</h1>
          </div>
          <div style="padding: 25px; background-color: #f9fafb; border: 1px solid #e5e7eb;">
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Votre commande a été reçue avec succès. Notre équipe a été notifiée et vous contactera bientôt.</p>
            
            <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Récapitulatif :</h3>
              <p><strong>Référence :</strong> ${order._id.toString().slice(-8).toUpperCase()}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Total :</strong> ${total.toFixed(2)} DT</p>
              <p><strong>Statut :</strong> <span style="color: #f59e0b;">En préparation</span></p>
            </div>
            
            <p>Merci pour votre confiance,<br><strong>L'équipe Société FBM</strong></p>
          </div>
        </div>
      `;
      
      await sendEmail({
        to: email,
        subject: "✅ Confirmation de votre commande - Société FBM",
        html: clientHtml,
      });
      
      console.log("📧 Email de confirmation envoyé au client");
    } catch (clientEmailError) {
      console.error("⚠️ Erreur email client:", clientEmailError.message);
    }

    // Sauvegarder les notifications
    await order.save();

    return res.status(201).json({
      success: true,
      orderId: order._id,
      message: `Commande créée et ${approvedEmployees.length} employé(s) notifié(s)`,
      employeesNotified: approvedEmployees.map(emp => emp.name)
    });
    
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur lors du checkout." });
  }
}