import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      name,
      email,
      phone,
      streetAddress,
      country,
      cartProducts,
      paymentMethod = "Paiement à la livraison"
    } = req.body;

    // Validation
    if (!name || !email || !phone || !streetAddress || !cartProducts?.length) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    // Récupérer les produits
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    const line_items = cartProducts
      .map(cartItem => {
        const product = productsFromDb.find(p => p._id.toString() === cartItem._id.toString());
        
        if (!product) return null;

        let colorVariant = null;
        if (product?.properties?.colorVariants?.length > 0 && cartItem.colorId) {
          colorVariant = product.properties.colorVariants.find(
            v => v._id.toString() === cartItem.colorId.toString()
          );
        }

        const quantity = Number(cartItem.quantity) || 1;
        const price = Number(product.price) || 0;

        return {
          productId: product._id.toString(),
          productTitle: product.title,
          reference: product.reference || "N/A",
          color: cartItem.color || colorVariant?.color || "default",
          colorId: colorVariant ? colorVariant._id.toString() : null,
          quantity,
          price,
          image: colorVariant?.imageUrl || product.images?.[0] || "",
        };
      })
      .filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit valide" });
    }

    // Calcul total
    const total = line_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Créer la commande
    const order = await Order.create({
      name,
      email,
      phone,
      streetAddress,
      country: country || "Tunisie",
      line_items,
      total,
      paymentMethod,
      paid: false,
      status: "En attente",
    });

    console.log(`✅ Commande créée: ${order._id}`);

    // Réponse immédiate au client
    res.status(200).json({ 
      success: true, 
      orderId: order._id,
      message: "Commande créée avec succès"
    });

    // ==============================================
    // ENVOI DES EMAILS EN ARRIÈRE-PLAN
    // ==============================================
    
    // 1. Email à l'admin (societefbm484@gmail.com)
    try {
      await sendEmail({
        to: "societefbm484@gmail.com",
        subject: "🛒 NOUVELLE COMMANDE - Société FBM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">NOUVELLE COMMANDE CLIENT</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #334155;">Informations client:</h3>
              <p><strong>👤 Nom:</strong> ${name}</p>
              <p><strong>📧 Email:</strong> ${email}</p>
              <p><strong>📞 Téléphone:</strong> ${phone}</p>
              <p><strong>📍 Adresse:</strong> ${streetAddress}</p>
              <p><strong>🌍 Pays:</strong> ${country || 'Tunisie'}</p>
              <p><strong>💰 Total:</strong> <span style="color: #2563eb; font-weight: bold;">${total} DT</span></p>
              <p><strong>🆔 ID Commande:</strong> ${order._id}</p>
              <p><strong>📅 Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            </div>
            
            <h3 style="color: #334155;">Détails de la commande:</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Produit</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Qté</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Prix</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${line_items.map(item => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                      ${item.productTitle}
                      ${item.color !== 'default' ? `<br/><small>Couleur: ${item.color}</small>` : ''}
                    </td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.price} DT</td>
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${item.price * item.quantity} DT</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">TOTAL:</td>
                  <td style="padding: 10px; font-weight: bold; color: #2563eb;">${total} DT</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="margin-top: 30px; padding: 20px; background: #e0f2fe; border-radius: 10px;">
              <p style="color: #0369a1; margin: 0;">
                <strong>Action requise:</strong> Contacter le client pour confirmer la commande.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px;">
              <p>Société Frères Ben Marzouk</p>
              <p>Email automatique - Ne pas répondre</p>
            </div>
          </div>
        `
      });
      console.log("📧 Email envoyé à l'admin");
    } catch (emailError) {
      console.error("❌ Erreur email admin:", emailError.message);
    }

    // 2. Email aux employés approuvés
    try {
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCol = db.collection("employees");

      const approvedEmployees = await employeesCol
        .find({ status: "approved", active: true })
        .toArray();

      console.log(`📧 Envoi à ${approvedEmployees.length} employés`);

      for (const emp of approvedEmployees) {
        await sendEmail({
          to: emp.email,
          subject: `📦 Nouvelle commande à traiter - ${name}`,
          html: `
            <div style="font-family: Arial, sans-serif;">
              <h3>Nouvelle commande client</h3>
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Client:</strong> ${name}</p>
                <p><strong>Téléphone:</strong> ${phone}</p>
                <p><strong>Adresse:</strong> ${streetAddress}</p>
                <p><strong>Total:</strong> ${total} DT</p>
                <p><strong>ID Commande:</strong> ${order._id}</p>
              </div>
              
              <p><strong>Articles:</strong></p>
              <ul>
                ${line_items.map(item => 
                  `<li>${item.quantity}x ${item.productTitle} - ${item.price * item.quantity} DT</li>`
                ).join('')}
              </ul>
              
              <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" 
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                  Voir la commande dans l'admin
                </a>
              </div>
            </div>
          `
        });
      }
    } catch (employeeError) {
      console.error("❌ Erreur email employés:", employeeError.message);
    }

    // 3. Email de confirmation au client
    try {
      await sendEmail({
        to: email,
        subject: "✅ Confirmation de commande - Société FBM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Merci pour votre commande, ${name} !</h1>
              <p style="color: #64748b;">Votre commande a été enregistrée avec succès.</p>
            </div>
            
            <div style="background: #f0f9ff; padding: 25px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #334155; margin-top: 0;">Récapitulatif de commande</h3>
              
              <p><strong>📋 Numéro de commande:</strong> ${order._id}</p>
              <p><strong>📅 Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
              <p><strong>📞 Votre téléphone:</strong> ${phone}</p>
              <p><strong>📍 Adresse de livraison:</strong> ${streetAddress}</p>
              <p><strong>💰 Montant total:</strong> <span style="color: #2563eb; font-weight: bold; font-size: 18px;">${total} DT</span></p>
              <p><strong>📦 Statut:</strong> <span style="color: #f59e0b; font-weight: 600;">En attente de confirmation</span></p>
            </div>
            
            <h3 style="color: #334155;">Détails des articles:</h3>
            <div style="margin: 20px 0;">
              ${line_items.map(item => `
                <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #e2e8f0;">
                  ${item.image ? `
                    <img src="${item.image}" alt="${item.productTitle}" 
                         style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
                  ` : ''}
                  <div style="flex: 1;">
                    <div style="font-weight: 600;">${item.productTitle}</div>
                    ${item.color !== 'default' ? `<div style="font-size: 14px; color: #64748b;">Couleur: ${item.color}</div>` : ''}
                    <div style="font-size: 14px; color: #64748b;">Quantité: ${item.quantity} × ${item.price} DT</div>
                  </div>
                  <div style="font-weight: 700;">${item.price * item.quantity} DT</div>
                </div>
              `).join('')}
            </div>
            
            <div style="text-align: center; padding: 20px; background: #dcfce7; border-radius: 10px; margin-top: 30px;">
              <p style="color: #166534; font-weight: 600;">
                Nous allons vous contacter dans les plus brefs délais pour confirmer la livraison.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p>Société Frères Ben Marzouk</p>
              <p>Pour toute question, contactez-nous au: ${phone}</p>
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        `
      });
      console.log("📧 Email de confirmation envoyé au client");
    } catch (clientEmailError) {
      console.error("❌ Erreur email client:", clientEmailError.message);
    }

  } catch (error) {
    console.error("❌ ERREUR CHECKOUT:", error);
    
    return res.status(500).json({ 
      error: "Erreur lors de la création de la commande",
      details: error.message 
    });
  }
}