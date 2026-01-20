// pages/api/checkout.js
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { sendEmail } from "@/lib/mailer";
import clientPromise from "@/lib/mongodb";

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

    // RÉCUPÉRER LES EMPLOYÉS DEPUIS MONGODB
    try {
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCol = db.collection("employees");

      const approvedEmployees = await employeesCol.find({ 
        status: "approved" 
      }).toArray();

      console.log(`👥 ${approvedEmployees.length} employé(s) trouvé(s)`);

      // ENVOYER À TOUS LES EMPLOYÉS
      for (const emp of approvedEmployees) {
        try {
          await sendEmail({
            to: emp.email,
            subject: `🚨 طلب جديد من ${name}`,
            html: `
              <div dir="rtl" style="font-family: Arial; padding: 20px;">
                <h2 style="color: red;">🚨 عندي طلب جديد للعملاء</h2>
                <p><strong>العميل:</strong> ${name}</p>
                <p><strong>الهاتف:</strong> ${phone}</p>
                <p><strong>المجموع:</strong> ${total} د.ت</p>
                <p><strong>رقم الطلب:</strong> ${order._id.toString().slice(-8)}</p>
                <a href="${process.env.NEXTAUTH_URL}/admin/orders">
                  🔍 عرض الطلب
                </a>
              </div>
            `
          });
          console.log(`📧 Email envoyé à ${emp.email}`);
        } catch (err) {
          console.log(`❌ Erreur pour ${emp.email}:`, err.message);
        }
      }

    } catch (dbErr) {
      console.log("❌ Erreur MongoDB:", dbErr.message);
    }

    return res.status(201).json(order);

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}