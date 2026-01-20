// pages/api/checkout.js
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

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    const line_items = cartProducts.map(p => {
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
    }).filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit disponible" });
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

    // ============================================
    // 1. EMAIL AUX EMPLOYÉS (EN FRANÇAIS)
    // ============================================
    
    // Liste des emails des employés
    const employeeEmails = [
      "societefbm484@gmail.com",  // Admin
      // Ajoutez d'autres emails ici :
      // "employe1@entreprise.com",
      // "employe2@entreprise.com",
    ];

    try {
      // Message en français pour les employés
      const employeeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .email-container {
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              border: 1px solid #e5e7eb;
            }
            .header {
              background: linear-gradient(135deg, #dc2626, #ef4444);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 18px;
              opacity: 0.9;
            }
            .content {
              padding: 35px;
            }
            .alert-box {
              background: linear-gradient(135deg, #fef3c7, #fde68a);
              border-left: 5px solid #f59e0b;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .section {
              background: #f8fafc;
              padding: 25px;
              border-radius: 10px;
              margin-bottom: 25px;
              border: 1px solid #e2e8f0;
            }
            .section h3 {
              color: #1e40af;
              margin-top: 0;
              margin-bottom: 20px;
              font-size: 20px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 12px;
              padding-bottom: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-label {
              font-weight: bold;
              color: #4b5563;
              width: 150px;
              flex-shrink: 0;
            }
            .info-value {
              color: #111827;
              font-weight: 500;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .product-table th {
              background: #3b82f6;
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 600;
            }
            .product-table td {
              padding: 15px;
              border-bottom: 1px solid #e5e7eb;
            }
            .total-box {
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 25px;
              border-radius: 10px;
              text-align: center;
              margin: 30px 0;
            }
            .total-amount {
              font-size: 48px;
              font-weight: bold;
              margin: 10px 0;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #2563eb, #1d4ed8);
              color: white;
              text-decoration: none;
              padding: 16px 35px;
              border-radius: 8px;
              font-weight: bold;
              font-size: 16px;
              margin: 10px;
              transition: all 0.3s ease;
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
            }
            .footer {
              text-align: center;
              padding: 25px;
              color: #6b7280;
              font-size: 14px;
              border-top: 1px solid #e5e7eb;
              background: #f9fafb;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            
            <!-- EN-TÊTE -->
            <div class="header">
              <h1>🚨 NOUVELLE COMMANDE CLIENT</h1>
              <p>À traiter immédiatement</p>
            </div>
            
            <!-- CONTENU -->
            <div class="content">
              
              <!-- ALERTE -->
              <div class="alert-box">
                <h3 style="margin: 0; color: #92400e; display: flex; align-items: center;">
                  <span style="margin-right: 10px;">⚠️</span>
                  ACTION REQUISE : Un client vient de passer une nouvelle commande
                </h3>
                <p style="margin: 10px 0 0 0; color: #92400e;">
                  Veuillez traiter cette commande dans les plus brefs délais.
                </p>
              </div>
              
              <!-- INFORMATIONS CLIENT -->
              <div class="section">
                <h3>👤 INFORMATIONS CLIENT</h3>
                <div class="info-row">
                  <div class="info-label">Nom complet :</div>
                  <div class="info-value">${name}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Email :</div>
                  <div class="info-value">${email}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Téléphone :</div>
                  <div class="info-value">${phone}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Adresse :</div>
                  <div class="info-value">${streetAddress}, ${country}</div>
                </div>
              </div>
              
              <!-- DÉTAILS COMMANDE -->
              <div class="section">
                <h3>📦 DÉTAILS DE LA COMMANDE</h3>
                <div class="info-row">
                  <div class="info-label">Référence :</div>
                  <div class="info-value">
                    <strong style="color: #dc2626;">CMD-${order._id.toString().slice(-8).toUpperCase()}</strong>
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Date & Heure :</div>
                  <div class="info-value">
                    ${new Date().toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} à ${new Date().toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">Statut :</div>
                  <div class="info-value">
                    <span style="
                      background: #fbbf24;
                      color: #78350f;
                      padding: 6px 15px;
                      border-radius: 20px;
                      font-weight: bold;
                      display: inline-block;
                    ">
                      En attente de traitement
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- PRODUITS COMMANDÉS -->
              <div class="section">
                <h3>🛒 PRODUITS COMMANDÉS (${line_items.length} article${line_items.length > 1 ? 's' : ''})</h3>
                
                <table class="product-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Référence</th>
                      <th>Couleur</th>
                      <th style="text-align: center;">Quantité</th>
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
                              ${item.image ? `
                                <img src="${item.image}" 
                                     alt="${item.productTitle}" 
                                     style="width: 50px; height: 50px; 
                                            object-fit: cover; 
                                            border-radius: 6px; 
                                            margin-right: 12px;">
                              ` : ''}
                              <span>${item.productTitle}</span>
                            </div>
                          </td>
                          <td>${item.reference}</td>
                          <td>${item.color || '-'}</td>
                          <td style="text-align: center;">
                            <span style="
                              background: #dbeafe;
                              color: #1e40af;
                              padding: 5px 12px;
                              border-radius: 15px;
                              font-weight: bold;
                            ">
                              ${item.quantity}
                            </span>
                          </td>
                          <td style="text-align: right;">${item.price.toFixed(2)} DT</td>
                          <td style="text-align: right; font-weight: bold;">${itemTotal.toFixed(2)} DT</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
              
              <!-- MONTANT TOTAL -->
              <div class="total-box">
                <div style="font-size: 18px; opacity: 0.9; margin-bottom: 10px;">
                  MONTANT TOTAL DE LA COMMANDE
                </div>
                <div class="total-amount">${total.toFixed(2)} DT</div>
                <div style="font-size: 16px; opacity: 0.9;">
                  Dinar tunisien
                </div>
              </div>
              
              <!-- BOUTONS D'ACTION -->
              <div style="text-align: center; margin: 40px 0 20px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" class="btn">
                  📋 Accéder au tableau de bord
                </a>
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders/${order._id}" class="btn" style="background: linear-gradient(135deg, #10b981, #059669);">
                  🔍 Voir cette commande
                </a>
              </div>
              
              <!-- INSTRUCTIONS -->
              <div class="section" style="background: #eff6ff; border-color: #3b82f6;">
                <h3 style="color: #1e40af;">📝 ÉTAPES À SUIVRE</h3>
                <ol style="margin: 15px 0 0 25px; padding: 0; color: #374151;">
                  <li style="margin-bottom: 12px;">
                    <strong>Vérification :</strong> Consulter les détails de la commande ci-dessus
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong>Contact client :</strong> Appeler le client pour confirmer la commande
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong>Préparation :</strong> Vérifier la disponibilité des produits
                  </li>
                  <li style="margin-bottom: 12px;">
                    <strong>Mise à jour :</strong> Modifier le statut de la commande dans le système
                  </li>
                  <li>
                    <strong>Suivi :</strong> Coordonner la livraison avec le client
                  </li>
                </ol>
              </div>
              
            </div>
            
            <!-- PIED DE PAGE -->
            <div class="footer">
              <p style="margin: 5px 0;">
                <strong>Société FBM - Système de notification automatique</strong>
              </p>
              <p style="margin: 5px 0; font-size: 13px;">
                Cette notification a été envoyée à ${employeeEmails.length} employé${employeeEmails.length > 1 ? 's' : ''}
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #9ca3af;">
                © ${new Date().getFullYear()} Société FBM - Tous droits réservés
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `;

      // Envoyer l'email à tous les employés
      await sendEmail({
        to: employeeEmails.join(', '),
        subject: `🚨 NOUVELLE COMMANDE - ${name} - ${total.toFixed(2)} DT`,
        html: employeeHtml
      });

      console.log(`✅ Email envoyé à ${employeeEmails.length} employé(s)`);

    } catch (emailError) {
      console.error("❌ Erreur envoi email employés:", emailError.message);
    }

    // ============================================
    // 2. EMAIL DE CONFIRMATION AU CLIENT
    // ============================================
    try {
      const clientHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 25px; text-align: center; }
            .content { padding: 25px; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ Commande confirmée !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Nous avons bien reçu votre commande. Notre équipe vous contactera bientôt pour confirmer les détails.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p><strong>Référence :</strong> CMD-${order._id.toString().slice(-8)}</p>
              <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>Montant total :</strong> <span style="color: #10b981; font-weight: bold;">${total.toFixed(2)} DT</span></p>
              <p><strong>Statut :</strong> En préparation</p>
            </div>
            
            <p>Merci pour votre confiance !</p>
            <p>L'équipe Société FBM</p>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: email,
        subject: "✅ Confirmation de votre commande - Société FBM",
        html: clientHtml
      });

      console.log("📧 Email de confirmation envoyé au client");

    } catch (clientError) {
      console.error("⚠️ Erreur email client:", clientError.message);
    }

    // ============================================
    // 3. RÉPONSE
    // ============================================
    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: `CMD-${order._id.toString().slice(-8)}`,
      message: `Commande créée et ${employeeEmails.length} employé(s) notifié(s)`,
      total: total
    });

  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur lors du checkout." });
  }
}