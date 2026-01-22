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

    // Validation des données
    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nom invalide (minimum 3 caractères)" });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "Email invalide" });
    }
    
    if (!phone || !/^(2|4|5|9)\d{7}$/.test(phone)) {
      return res.status(400).json({ error: "Numéro de téléphone invalide. Format: 8 chiffres commençant par 2,4,5 ou 9" });
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      return res.status(400).json({ error: "Adresse invalide (minimum 5 caractères)" });
    }

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Récupérer les produits depuis la base de données
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    // Préparer les line_items
    const line_items = cartProducts
      .map(cartItem => {
        const product = productsFromDb.find(
          p => p._id.toString() === cartItem._id.toString()
        );
        
        if (!product) {
          console.warn(`Produit non trouvé: ${cartItem._id}`);
          return null;
        }

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
      return res.status(400).json({ error: "Aucun produit disponible pour cette commande" });
    }

    // Calculer le total
    const total = line_items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

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

    console.log(`✅ Commande créée: ${order._id} pour ${name}`);

    // Réponse immédiate
    res.status(200).json({ 
      success: true, 
      orderId: order._id,
      message: "Commande créée avec succès",
      order 
    });

    // Envoyer les emails en arrière-plan (non bloquant)
    (async () => {
      try {
        // Email à l'admin
        await sendEmail({
          to: "societefbm484@gmail.com",
          subject: "🛒 Nouvelle commande client",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Nouvelle commande de ${name}</h2>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Téléphone:</strong> ${phone}</p>
                <p><strong>Adresse:</strong> ${streetAddress}, ${country}</p>
                <p><strong>Total:</strong> ${total} DT</p>
                <p><strong>ID Commande:</strong> ${order._id}</p>
                <p><strong>Méthode de paiement:</strong> ${paymentMethod}</p>
              </div>
              
              <h3 style="color: #334155;">Articles commandés:</h3>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Produit</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Qté</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0;">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  ${line_items.map(item => `
                    <tr>
                      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                          ${item.image ? `<img src="${item.image}" alt="${item.productTitle}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" />` : ''}
                          <div>
                            <div style="font-weight: 600;">${item.productTitle}</div>
                            ${item.color !== 'default' ? `<div style="font-size: 12px; color: #64748b;">Couleur: ${item.color}</div>` : ''}
                          </div>
                        </div>
                      </td>
                      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.quantity}</td>
                      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.price * item.quantity} DT</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
                Société FBM - ${new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          `
        });

        console.log("📧 Email envoyé à l'admin");

        // Email aux employés approuvés
        try {
          const client = await clientPromise;
          const db = client.db("company_db");
          const employeesCol = db.collection("employees");

          const approvedEmployees = await employeesCol
            .find({ status: "approved", active: true })
            .toArray();

          console.log(`📧 Envoi d'emails à ${approvedEmployees.length} employés`);

          for (const emp of approvedEmployees) {
            await sendEmail({
              to: emp.email,
              subject: `📦 Nouvelle commande client - ${name}`,
              html: `
                <div style="font-family: Arial, sans-serif;">
                  <h3>Nouvelle commande à traiter</h3>
                  <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p><strong>Client:</strong> ${name}</p>
                    <p><strong>Téléphone:</strong> ${phone}</p>
                    <p><strong>Total:</strong> ${total} DT</p>
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
        } catch (employeeEmailError) {
          console.error("Erreur email employés:", employeeEmailError.message);
        }

        // Email de confirmation au client
        await sendEmail({
          to: email,
          subject: "✅ Confirmation de votre commande - Société FBM",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #2563eb;">Merci pour votre commande, ${name}!</h1>
              </div>
              
              <div style="background: #f0f9ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="font-size: 18px; color: #334155;">
                  Votre commande a été reçue et est en cours de traitement.
                </p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 15px;">
                  <p><strong>📋 Numéro de commande:</strong> ${order._id}</p>
                  <p><strong>💰 Total:</strong> <span style="color: #2563eb; font-weight: 700;">${total} DT</span></p>
                  <p><strong>📦 Statut:</strong> <span style="color: #f59e0b; font-weight: 600;">En attente</span></p>
                  <p><strong>📞 Téléphone:</strong> ${phone}</p>
                  <p><strong>📍 Adresse de livraison:</strong> ${streetAddress}, ${country}</p>
                </div>
              </div>
              
              <div style="margin: 25px 0; padding: 20px; background: #f8fafc; border-radius: 10px;">
                <h3 style="color: #334155; margin-bottom: 15px;">Récapitulatif de votre commande:</h3>
                ${line_items.map(item => `
                  <div style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">
                    ${item.image ? `
                      <img src="${item.image}" alt="${item.productTitle}" 
                           style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;" />
                    ` : ''}
                    <div style="flex: 1;">
                      <div style="font-weight: 600;">${item.productTitle}</div>
                      ${item.color !== 'default' ? `<div style="font-size: 13px; color: #64748b;">Couleur: ${item.color}</div>` : ''}
                      <div style="font-size: 14px; color: #64748b;">Qté: ${item.quantity} × ${item.price} DT</div>
                    </div>
                    <div style="font-weight: 700;">${item.price * item.quantity} DT</div>
                  </div>
                `).join('')}
              </div>
              
              <div style="text-align: center; padding: 20px; background: #dcfce7; border-radius: 10px; margin-top: 20px;">
                <p style="color: #166534; font-weight: 600;">
                  Nous vous contacterons dans les plus brefs délais pour confirmer la livraison.
                </p>
                <p style="color: #64748b; font-size: 14px; margin-top: 10px;">
                  Pour toute question, contactez-nous au +216 XX XXX XXX
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                <p>Société Frères Ben Marzouk</p>
                <p>${new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
            </div>
          `
        });

        console.log("📧 Email de confirmation envoyé au client");

      } catch (emailError) {
        console.error("⚠️ Erreur d'envoi d'email:", emailError.message);
      }
    })();

  } catch (err) {
    console.error("❌ ERREUR CHECKOUT:", err);
    
    // Message d'erreur plus détaillé
    let errorMessage = "Erreur serveur lors de la création de la commande";
    
    if (err.name === 'ValidationError') {
      errorMessage = "Erreur de validation des données";
    } else if (err.code === 11000) {
      errorMessage = "Erreur de duplication de commande";
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: err.message,
      code: err.code
    });
  }
}