import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { sendEmail } from "@/lib/mailer"; // IMPORTANT: Ajoutez cette importation

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

    // 🔴 CORRECTION: ENVOYER LES EMAILS ICI (pas dans api/orders)
    try {
      // 1. Email à l'admin
      await sendEmail({
        to: "societefbm484@gmail.com",
        subject: `🆕 NOUVELLE COMMANDE - ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
              <h1>NOUVELLE COMMANDE</h1>
              <p>Client: ${name}</p>
            </div>
            <div style="padding: 20px; background-color: #f9fafb;">
              <h3>Informations client:</h3>
              <p><strong>Nom:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Téléphone:</strong> ${phone}</p>
              <p><strong>Adresse:</strong> ${streetAddress}, ${country}</p>
              
              <h3>Détails commande:</h3>
              <p><strong>ID:</strong> ${order._id}</p>
              <p><strong>Total:</strong> ${total} DT</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
              
              <h3>Produits:</h3>
              <ul>
                ${line_items.map(item => `
                  <li>${item.quantity}x ${item.productTitle} - ${item.price} DT</li>
                `).join('')}
              </ul>
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" 
                   style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Voir la commande
                </a>
              </div>
            </div>
          </div>
        `,
      });
      console.log("📧 Email envoyé à l'admin");
    } catch (emailError) {
      console.error("❌ Erreur email admin:", emailError.message);
    }

    // 2. Email de confirmation au client (optionnel mais recommandé)
    try {
      await sendEmail({
        to: email,
        subject: "✅ Confirmation de commande - Société FBM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h1>Merci pour votre commande!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Bonjour ${name},</p>
              <p>Votre commande a été reçue avec succès.</p>
              <p><strong>Référence:</strong> ${order._id.toString().slice(-8)}</p>
              <p><strong>Total:</strong> ${total} DT</p>
              <p>Nous vous contacterons bientôt.</p>
              <p>Cordialement,<br>Société FBM</p>
            </div>
          </div>
        `,
      });
      console.log("📧 Email de confirmation envoyé au client");
    } catch (clientEmailError) {
      console.error("⚠️ Erreur email client:", clientEmailError.message);
    }

    return res.status(201).json(order);
    
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur lors du checkout." });
  }
}