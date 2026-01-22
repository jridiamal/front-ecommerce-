import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const {
      name,
      email,
      phone,
      streetAddress,
      country,
      cartProducts,
      paymentMethod,
      userId,
    } = req.body;

    // 🔒 Validation أساسية
    if (!name || !phone || !streetAddress) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // 🔹 IDs المنتجات
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    // 🔹 بناء line_items (snapshot)
    const line_items = cartProducts.map(item => {
      const product = productsFromDb.find(
        p => p._id.toString() === item._id.toString()
      );
      if (!product) return null;

      let colorVariant = null;
      if (product?.properties?.colorVariants?.length && item.colorId) {
        colorVariant = product.properties.colorVariants.find(
          v => v._id.toString() === item.colorId
        );
      }

      const quantity = Number(item.quantity || 1);
      const price = Number(product.price || 0);

      return {
        productId: product._id.toString(),
        productTitle: product.title,
        reference: product.reference || "N/A",
        color: colorVariant?.color || item.color || "default",
        colorId: colorVariant ? colorVariant._id.toString() : null,
        quantity,
        price,
        image: colorVariant?.imageUrl || product.images?.[0] || "",
      };
    }).filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Produits invalides" });
    }

    const total = line_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 🔥 إنشاء commande (CRITICAL)
    const order = await Order.create({
      userId,
      name,
      email,
      phone,
      streetAddress,
      country,
      paymentMethod: paymentMethod || "Paiement à la livraison",
      line_items,
      total,
      paid: false,
      status: "En attente",
    });

    console.log("✅ ORDER SAVED:", order._id);

    // ================================
    // 📧 EMAILS (NON-BLOCKING)
    // ================================

    // 🔹 Email admin
    sendEmail({
      to: "societefbm484@gmail.com",
      subject: "🛒 Nouvelle commande client",
      html: `
        <h2>Nouvelle commande</h2>
        <p><b>Client:</b> ${name}</p>
        <p><b>Téléphone:</b> ${phone}</p>
        <p><b>Total:</b> ${total} DT</p>
        <p><b>ID:</b> ${order._id}</p>
      `,
    });

    // 🔹 Emails employés approved
    try {
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCol = db.collection("employees");

      const employees = await employeesCol
        .find({ status: "approved" })
        .toArray();

      for (const emp of employees) {
        sendEmail({
          to: emp.email,
          subject: `📦 Nouvelle commande - ${name}`,
          html: `
            <h3>Nouvelle commande à traiter</h3>
            <p><b>Client:</b> ${name}</p>
            <p><b>Téléphone:</b> ${phone}</p>
            <p><b>Total:</b> ${total} DT</p>
            <a href="${
              process.env.NEXTAUTH_URL || "http://localhost:3000"
            }/orders">
              Voir la commande
            </a>
          `,
        });
      }
    } catch (empErr) {
      console.error("⚠️ Employees email error:", empErr.message);
      // ❌ ما نطيّحوش checkout
    }

    // 🔥 RESPONSE FINAL (IMPORTANT)
    return res.status(200).json({
      success: true,
      orderId: order._id,
    });

  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    return res.status(500).json({
      error: "Erreur serveur lors du checkout",
    });
  }
}
