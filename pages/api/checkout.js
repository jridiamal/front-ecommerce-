// /api/checkout.ts
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
    const { name, email, phone, streetAddress, country, cartProducts, userId } = req.body;

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // 🔹 Récupérer les produits depuis la DB
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
        productTitle: product.title,          // snapshot nom produit
        reference: product.reference || "N/A",// snapshot reference
        color: colorVariant?.color || p.color || "default",
        colorId: colorVariant ? colorVariant._id.toString() : null,
        quantity,
        price,
        image: colorVariant ? colorVariant.imageUrl : product.images?.[0] || "",
      };
    }).filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit disponible pour cette commande" });
    }

    const total = line_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 🔹 Créer la commande
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

    // 🔹 Envoyer email à l'admin
    await sendEmail({
      to: "societefbm484@gmail.com",
      subject: "🛒 Nouvelle commande client",
      html: `
        <h2>Nouvelle commande de ${name}</h2>
        <p>Total: ${total} DT</p>
        <p>ID Commande: ${order._id}</p>
        <ul>
          ${line_items.map(i => `<li>${i.quantity}x ${i.productTitle} - ${i.price} DT</li>`).join("")}
        </ul>
      `,
    });

    // 🔹 Récupérer tous les employés approved depuis MongoDB
    const client = await clientPromise;
    const db = client.db("company_db");
    const employeesCol = db.collection("employees");

    const approvedEmployees = await employeesCol.find({ status: "approved" }).toArray();

    // 🔹 Envoyer email à chaque employé
    for (const emp of approvedEmployees) {
      await sendEmail({
        to: emp.email,
        subject: `📦 Nouvelle commande client - ${name}`,
        html: `
          <h3>Nouvelle commande à traiter</h3>
          <p><b>Client:</b> ${name}</p>
          <p><b>Téléphone:</b> ${phone}</p>
          <p><b>Total:</b> ${total} DT</p>
          <ul>
            ${line_items.map(i => `<li>${i.quantity}x ${i.productTitle} - ${i.price} DT</li>`).join("")}
          </ul>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/orders">
            Voir la commande
          </a>
        `,
      });
    }

    return res.status(201).json(order);

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erreur serveur lors du checkout." });
  }
}
