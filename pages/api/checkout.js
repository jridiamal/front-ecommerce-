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

    // Liste des employés à notifier (vous pouvez ajouter plusieurs emails ici)
    const employees = [
      { email: "societefbm484@gmail.com", name: "Admin FBM" }
      // Ajoutez d'autres emails d'employés ici :
      // { email: "employe1@entreprise.com", name: "Ahmed Ben Ali" },
      // { email: "employe2@entreprise.com", name: "Fatima Mahmoud" },
    ];

    // 1. ENVOYER EMAIL AUX EMPLOYÉS
    try {
      const employeeEmails = employees.map(emp => emp.email);
      
      // HTML simplifié pour les employés
      const employeeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
            .section { background-color: white; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #3b82f6; }
            .btn { display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">🚨 NOUVELLE COMMANDE</h1>
            <p style="margin: 10px 0 0 0;">عميل جديد - طلب جديد</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h3 style="color: #1f2937; margin-top: 0;">👤 معلومات العميل</h3>
              <p><strong>الاسم:</strong> ${name}</p>
              <p><strong>البريد:</strong> ${email}</p>
              <p><strong>الهاتف:</strong> ${phone}</p>
              <p><strong>العنوان:</strong> ${streetAddress}, ${country}</p>
            </div>
            
            <div class="section">
              <h3 style="color: #1f2937; margin-top: 0;">📦 تفاصيل الطلب</h3>
              <p><strong>رقم الطلب:</strong> ${order._id.toString().slice(-8)}</p>
              <p><strong>المجموع:</strong> <span style="color: #059669; font-weight: bold;">${total.toFixed(2)} د.ت</span></p>
              <p><strong>التاريخ:</strong> ${new Date().toLocaleString('ar-TN')}</p>
            </div>
            
            <div class="section">
              <h3 style="color: #1f2937; margin-top: 0;">🛒 المنتجات (${line_items.length})</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${line_items.map(item => `
                  <li style="margin-bottom: 5px;">
                    ${item.quantity}x ${item.productTitle} 
                    ${item.color ? `(${item.color})` : ''}
                    - ${(item.price * item.quantity).toFixed(2)} د.ت
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" class="btn">
                📋 عرض الطلب
              </a>
            </div>
            
            <div style="text-align: center; color: #6b7280; font-size: 14px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <p>إشعار تلقائي - شركة الإخوان بنمرزوق</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail({
        to: employeeEmails,
        subject: `🚨 طلب جديد - ${name} - ${total.toFixed(2)} د.ت`,
        html: employeeHtml,
      });
      
      console.log(`✅ Email envoyé à ${employees.length} employé(s)`);
      
      // Enregistrer la notification
      order.notifications = {
        employeesSent: true,
        employeesCount: employees.length,
        sentAt: new Date()
      };
      
    } catch (emailError) {
      console.error("❌ Erreur email employés:", emailError.message);
      order.notifications = {
        employeesSent: false,
        error: emailError.message,
        sentAt: new Date()
      };
    }

    // 2. EMAIL DE CONFIRMATION AU CLIENT
    try {
      await sendEmail({
        to: email,
        subject: "✅ تأكيد طلبك - شركة الإخوان بنمرزوق",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">شكراً لطلبك!</h1>
            </div>
            <div style="padding: 20px; background-color: #f9fafb;">
              <p>عزيزي ${name},</p>
              <p>لقد استلمنا طلبك بنجاح.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6;">
                <p><strong>رقم الطلب:</strong> ${order._id.toString().slice(-8)}</p>
                <p><strong>المجموع:</strong> ${total.toFixed(2)} د.ت</p>
                <p><strong>الحالة:</strong> قيد المعالجة</p>
              </div>
              
              <p>سنتصل بك قريباً لتأكيد التفاصيل.</p>
              <p>مع التحية،<br>فريق شركة الإخوان بنمرزوق</p>
            </div>
          </div>
        `,
      });
      
      console.log("📧 Email de confirmation envoyé au client");
      
      order.notifications.clientSent = true;
      order.notifications.clientSentAt = new Date();
      
    } catch (clientError) {
      console.error("⚠️ Erreur email client:", clientError.message);
      order.notifications.clientSent = false;
      order.notifications.clientError = clientError.message;
    }

    // Sauvegarder les notifications
    await order.save();

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order._id.toString().slice(-8),
      message: `تم إنشاء الطلب وإرسال الإشعار إلى ${employees.length} موظف`,
      total: total,
      notifications: {
        employees: order.notifications.employeesSent ? "✅ تم الإرسال" : "❌ فشل الإرسال",
        client: order.notifications.clientSent ? "✅ تم الإرسال" : "❌ فشل الإرسال"
      }
    });
    
  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    return res.status(500).json({ 
      error: "خطأ في النظام",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
}