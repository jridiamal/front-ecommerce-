// pages/api/checkout.js
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { sendEmail } from "@/lib/mailer";
import clientPromise from "@/lib/mongodb"; // Import depuis MongoDB natif

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

    // 🔴 RÉCUPÉRER LES EMPLOYÉS APPROUVÉS DEPUIS LA BASE DE DONNÉES
    let approvedEmployees = [];
    
    try {
      const client = await clientPromise;
      const db = client.db("company_db"); // Votre nom de base de données
      const employeesCollection = db.collection("employees");
      
      // Récupérer tous les employés avec status "approved"
      approvedEmployees = await employeesCollection.find({ 
        status: "approved" 
      }).project({
        name: 1,
        email: 1,
        _id: 0
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
        name: "المدير العام" 
      });
    }

    // 🔴 1. ENVOYER EMAIL À TOUS LES EMPLOYÉS APPROUVÉS (en arabe/français)
    if (approvedEmployees.length > 0) {
      try {
        const employeeEmails = approvedEmployees.map(emp => emp.email);
        const employeeNames = approvedEmployees.map(emp => emp.name).join('، ');
        
        // HTML pour les employés (bilingue arabe/français)
        const employeeHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>طلب جديد - New Order</title>
            <style>
              body { font-family: 'Arial', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
              .container { max-width: 750px; margin: 20px auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #ff6b35, #ffa500); color: white; padding: 30px; text-align: center; }
              .content { padding: 35px; }
              .section { margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 12px; border-right: 5px solid #ff6b35; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
              .title-ar { color: #2c3e50; font-size: 24px; margin-bottom: 10px; text-align: right; font-weight: bold; }
              .title-fr { color: #34495e; font-size: 20px; margin-bottom: 15px; text-align: left; font-weight: 600; }
              .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .info-table td { padding: 12px 15px; border-bottom: 1px solid #ddd; }
              .info-table td:first-child { font-weight: bold; color: #2c3e50; width: 35%; background-color: #f8f9fa; }
              .alert { background: linear-gradient(135deg, #fff3cd, #ffeaa7); border-right: 5px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 10px; text-align: center; }
              .products-table { width: 100%; border-collapse: collapse; margin: 25px 0; box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
              .products-table th { background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 15px; text-align: center; font-weight: bold; }
              .products-table td { padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: center; }
              .products-table tr:hover { background-color: #f8f9fa; }
              .total-box { background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; font-size: 24px; font-weight: bold; }
              .btn-container { text-align: center; margin: 35px 0; }
              .btn { display: inline-block; background: linear-gradient(135deg, #3498db, #2980b9); color: white; padding: 16px 35px; text-decoration: none; border-radius: 50px; margin: 0 10px; font-weight: bold; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3); }
              .btn:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4); background: linear-gradient(135deg, #2980b9, #3498db); }
              .footer { text-align: center; padding: 25px; background: linear-gradient(135deg, #2c3e50, #34495e); color: #ecf0f1; font-size: 14px; border-top: 1px solid #7f8c8d; }
              .lang-badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-left: 10px; }
              .badge-ar { background-color: #ff6b35; color: white; }
              .badge-fr { background-color: #3498db; color: white; }
              .employee-notice { background: linear-gradient(135deg, #e8f6f3, #d1f2eb); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; border-right: 4px solid #1abc9c; }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- En-tête -->
              <div class="header">
                <h1 style="margin: 0; font-size: 36px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
                  🚨 طلب جديد | NOUVEAU COMMANDE
                </h1>
                <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">
                  يرجى المعالجة الفورية | À traiter immédiatement
                </p>
              </div>
              
              <div class="content">
                <!-- Alerte urgente -->
                <div class="alert">
                  <h2 style="margin: 0; color: #d35400;">
                    ⚠️ تنبيه عاجل | ALERTE URGENTE
                  </h2>
                  <p style="margin: 10px 0 0 0; font-size: 16px;">
                    عميل جديد قام بإرسال طلب. يرجى المتابعة فوراً.
                    <br>
                    Un nouveau client a passé une commande. Veuillez suivre immédiatement.
                  </p>
                </div>
                
                <!-- معلومات العميل -->
                <div class="section">
                  <div class="title-ar">📋 معلومات العميل</div>
                  <div class="title-fr">📋 Informations client</div>
                  
                  <table class="info-table">
                    <tr>
                      <td>الاسم الكامل | Nom complet:</td>
                      <td><strong>${name}</strong></td>
                    </tr>
                    <tr>
                      <td>البريد الإلكتروني | Email:</td>
                      <td>${email}</td>
                    </tr>
                    <tr>
                      <td>رقم الهاتف | Téléphone:</td>
                      <td>${phone}</td>
                    </tr>
                    <tr>
                      <td>العنوان | Adresse:</td>
                      <td>${streetAddress}، ${country}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- تفاصيل الطلب -->
                <div class="section">
                  <div class="title-ar">📦 تفاصيل الطلب</div>
                  <div class="title-fr">📦 Détails de la commande</div>
                  
                  <table class="info-table">
                    <tr>
                      <td>رقم المرجع | Référence:</td>
                      <td><strong style="color: #e74c3c;">CMD-${order._id.toString().slice(-8).toUpperCase()}</strong></td>
                    </tr>
                    <tr>
                      <td>التاريخ والوقت | Date et heure:</td>
                      <td>${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleDateString('fr-FR')}<br>
                          ${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})} - ${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</td>
                    </tr>
                    <tr>
                      <td>الحالة | Statut:</td>
                      <td>
                        <span style="background: #f39c12; color: white; padding: 6px 15px; border-radius: 20px; font-weight: bold;">
                          في الانتظار | En attente
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- المنتجات المطلوبة -->
                <div class="section">
                  <div class="title-ar">🛒 المنتجات المطلوبة</div>
                  <div class="title-fr">🛒 Produits demandés</div>
                  
                  <table class="products-table">
                    <thead>
                      <tr>
                        <th>المنتج | Produit</th>
                        <th>اللون | Couleur</th>
                        <th>الكمية | Quantité</th>
                        <th>السعر | Prix</th>
                        <th>المجموع | Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${line_items.map(item => {
                        const itemTotal = item.price * item.quantity;
                        return `
                          <tr>
                            <td>
                              <strong>${item.productTitle}</strong>
                              <br>
                              <small style="color: #7f8c8d;">${item.reference}</small>
                              ${item.image ? `<br><img src="${item.image}" alt="${item.productTitle}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-top: 8px;">` : ''}
                            </td>
                            <td>${item.color || 'N/A'}</td>
                            <td>${item.quantity}</td>
                            <td>${item.price.toFixed(2)} DT</td>
                            <td><strong>${itemTotal.toFixed(2)} DT</strong></td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
                
                <!-- المبلغ الإجمالي -->
                <div class="total-box">
                  <div style="font-size: 18px; margin-bottom: 10px; opacity: 0.9;">
                    المبلغ الإجمالي | Montant total
                  </div>
                  <div style="font-size: 42px;">
                    ${total.toFixed(2)} DT
                  </div>
                  <div style="font-size: 16px; margin-top: 10px; opacity: 0.9;">
                    دينار تونسي | Dinar tunisien
                  </div>
                </div>
                
                <!-- الموظفون المبلغون -->
                <div class="employee-notice">
                  <h3 style="margin: 0 0 10px 0; color: #16a085;">
                    👥 الموظفون المبلغون | Employés notifiés
                  </h3>
                  <p style="margin: 0; font-size: 16px;">
                    تم إرسال هذه الإشعارة إلى <strong>${approvedEmployees.length}</strong> موظف
                    <br>
                    Cette notification a été envoyée à <strong>${approvedEmployees.length}</strong> employé(s)
                  </p>
                  <p style="margin: 10px 0 0 0; color: #2c3e50;">
                    ${employeeNames}
                  </p>
                </div>
                
                <!-- أزرار التنقل -->
                <div class="btn-container">
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders" class="btn">
                    📋 لوحة التحكم | Tableau de bord
                  </a>
                  
                  <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders/${order._id}" class="btn" style="background: linear-gradient(135deg, #2ecc71, #27ae60);">
                    🔍 عرض الطلب | Voir la commande
                  </a>
                </div>
                
                <!-- خطوات المتابعة -->
                <div class="section" style="background: linear-gradient(135deg, #f0f8ff, #e6f7ff); border-right-color: #3498db;">
                  <div class="title-ar">📝 خطوات المتابعة</div>
                  <div class="title-fr">📝 Étapes à suivre</div>
                  
                  <ol style="margin: 15px 0 0 30px; padding: 0; color: #2c3e50;">
                    <li style="margin-bottom: 10px;">مراجعة تفاصيل الطلب واتصال بالعميل</li>
                    <li style="margin-bottom: 10px;">تجهيز المنتجات المطلوبة والتأكد من التوفر</li>
                    <li style="margin-bottom: 10px;">تحديث حالة الطلب في النظام</li>
                    <li style="margin-bottom: 10px;">تنسيق عملية التسليم مع العميل</li>
                  </ol>
                  
                  <ol style="margin: 15px 0 0 30px; padding: 0; color: #34495e; direction: ltr;">
                    <li style="margin-bottom: 10px;">Vérifier les détails de la commande et contacter le client</li>
                    <li style="margin-bottom: 10px;">Préparer les produits et vérifier la disponibilité</li>
                    <li style="margin-bottom: 10px;">Mettre à jour le statut de la commande dans le système</li>
                    <li style="margin-bottom: 10px;">Coordonner la livraison avec le client</li>
                  </ol>
                </div>
              </div>
              
              <!-- تذييل -->
              <div class="footer">
                <p style="margin: 5px 0;">
                  <strong>شركة FBM | Société FBM</strong>
                </p>
                <p style="margin: 5px 0; font-size: 13px;">
                  نظام إشعارات الطلبات الآلي | Système de notification automatique des commandes
                </p>
                <p style="margin: 5px 0; font-size: 12px; color: #bdc3c7;">
                  © ${new Date().getFullYear()} - جميع الحقوق محفوظة | Tous droits réservés
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        await sendEmail({
          to: employeeEmails,
          subject: `🚨 طلب جديد من ${name} - ${total.toFixed(2)} د.ت | NOUVELLE COMMANDE ${name} - ${total.toFixed(2)} DT`,
          html: employeeHtml,
        });
        
        console.log(`✅ Email envoyé à ${approvedEmployees.length} employé(s) approuvé(s)`);
        
        // Enregistrer les notifications dans la commande
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
      order.employeeNotifications = {
        sent: false,
        message: "Aucun employé approuvé trouvé",
        sentAt: new Date()
      };
    }

    // 🔴 2. ENVOYER EMAIL DE CONFIRMATION AU CLIENT (bilingue)
    try {
      const clientHtml = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 25px; background: #f9fafb; border: 1px solid #e0e0e0; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-right: 4px solid #3498db; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">✅ تم استلام طلبك | Votre commande est confirmée</h1>
          </div>
          <div class="content">
            <p>عزيزي ${name},<br>Cher ${name},</p>
            
            <div class="info-box">
              <h3 style="color: #2c3e50; margin-top: 0;">📋 ملخص طلبك | Récapitulatif</h3>
              <p><strong>رقم المرجع:</strong> CMD-${order._id.toString().slice(-8)}</p>
              <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
              <p><strong>المبلغ الإجمالي:</strong> <span style="color: #27ae60; font-weight: bold;">${total.toFixed(2)} د.ت</span></p>
              <p><strong>الحالة:</strong> <span style="color: #f39c12;">قيد المعالجة | En traitement</span></p>
            </div>
            
            <p>سيقوم فريقنا بالاتصال بك قريباً.<br>Notre équipe vous contactera bientôt.</p>
            <p>شكراً لثقتك بنا.<br>Merci de votre confiance.</p>
          </div>
        </body>
        </html>
      `;
      
      await sendEmail({
        to: email,
        subject: "✅ تأكيد طلبك - Société FBM | Confirmation de votre commande",
        html: clientHtml,
      });
      
      console.log("📧 Email de confirmation envoyé au client");
    } catch (clientEmailError) {
      console.error("⚠️ Erreur email client:", clientEmailError.message);
    }

    // Sauvegarder la commande avec toutes les notifications
    await order.save();

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: `CMD-${order._id.toString().slice(-8)}`,
      message: `تم إنشاء الطلب وإرسال الإشعار إلى ${approvedEmployees.length} موظف`,
      employeesNotified: approvedEmployees.map(emp => emp.name),
      total: total
    });
    
  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    return res.status(500).json({ 
      error: "خطأ في الخادم | Erreur serveur",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
}