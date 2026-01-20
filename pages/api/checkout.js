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
      return res.status(400).json({ error: "Aucun produit disponible" });
    }

    const total = line_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 1. CRÉER LA COMMANDE
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

    console.log("✅ Commande créée");

    // 2. LISTE DES EMPLOYÉS QUI DOIVENT RECEVOIR L'EMAIL
    // ⚠️ MODIFIEZ ICI : Ajoutez les emails de vos employés
    const employeeEmails = [
      "societefbm484@gmail.com",  // Admin (toujours)
      // "employe1@gmail.com",     // Employé 1
      // "employe2@gmail.com",     // Employé 2
      // "employe3@gmail.com",     // Employé 3
      // AJOUTEZ TOUS LES EMAILS DE VOS EMPLOYÉS ICI
    ];

    // 3. EMAIL SIMPLE POUR LES EMPLOYÉS
    const employeeMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="background-color: #ff4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🚨 NOUVELLE COMMANDE</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">عندي طلب جديد للعملاء</p>
        </div>
        
        <div style="padding: 20px;">
          <h2>👤 معلومات العميل:</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>الهاتف:</strong> ${phone}</p>
          <p><strong>العنوان:</strong> ${streetAddress}</p>
          
          <h2>📦 تفاصيل الطلب:</h2>
          <p><strong>رقم الطلب:</strong> ${order._id.toString().slice(-8)}</p>
          <p><strong>المجموع:</strong> <span style="color: green; font-weight: bold;">${total} د.ت</span></p>
          
          <h2>🛒 المنتجات:</h2>
          <ul>
            ${line_items.map(item => `
              <li>${item.quantity} × ${item.productTitle} (${item.price} د.ت)</li>
            `).join('')}
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" 
               style="background-color: #0088cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              🔍 عرض الطلب في النظام
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; text-align: center; color: #666;">
            <p>هذا إشعار تلقائي - يرجى عدم الرد على هذا البريد</p>
            <p>شركة الإخوان بنمرزوق © ${new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    `;

    // 4. ENVOYER L'EMAIL À TOUS LES EMPLOYÉS
    try {
      await sendEmail({
        to: employeeEmails.join(', '), // Envoie à tous les employés en même temps
        subject: `🚨 طلب جديد من ${name} - ${total} د.ت`,
        html: employeeMessage
      });
      console.log(`📧 Email envoyé à ${employeeEmails.length} employé(s)`);
    } catch (emailError) {
      console.log("⚠️ Email non envoyé aux employés:", emailError.message);
    }

    // 5. EMAIL DE CONFIRMATION AU CLIENT (optionnel)
    try {
      await sendEmail({
        to: email,
        subject: "✅ تم استلام طلبك",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
              <h1>شكراً لطلبك!</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p>عزيزي ${name},</p>
              <p>تم استلام طلبك بنجاح وسنتصل بك قريباً.</p>
              <p><strong>رقم طلبك:</strong> ${order._id.toString().slice(-8)}</p>
              <p><strong>المجموع:</strong> ${total} د.ت</p>
              <p>شكراً لثقتك بنا!</p>
            </div>
          </div>
        `
      });
      console.log("📧 Email de confirmation envoyé au client");
    } catch (clientError) {
      console.log("⚠️ Email client non envoyé:", clientError.message);
    }

    // 6. RÉPONSE
    return res.status(201).json({
      success: true,
      orderId: order._id,
      message: "Commande créée avec succès",
      employeesNotified: employeeEmails.length
    });

  } catch (err) {
    console.error("Erreur:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}