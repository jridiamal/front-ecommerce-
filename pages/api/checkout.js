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

    // 🔹 Validation améliorée
    if (!name || name.length < 3) {
      return res.status(400).json({ error: "Nom invalide (minimum 3 caractères)" });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: "Email invalide" });
    }
    
    if (!phone || !/^(2|4|5|9)\d{7}$/.test(phone)) {
      return res.status(400).json({ error: "Téléphone invalide. Format: 8 chiffres commençant par 2,4,5 ou 9" });
    }
    
    if (!streetAddress || streetAddress.length < 5) {
      return res.status(400).json({ error: "Adresse invalide (minimum 5 caractères)" });
    }

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // 🔹 récupérer les produits
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    const line_items = cartProducts
      .map(p => {
        const product = productsFromDb.find(
          pr => pr._id.toString() === p._id.toString()
        );
        if (!product) return null;

        let colorVariant = null;
        if (
          product?.properties?.colorVariants?.length > 0 &&
          p.colorId
        ) {
          colorVariant =
            product.properties.colorVariants.find(
              v => v._id.toString() === p.colorId
            ) || null;
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
          image: colorVariant
            ? colorVariant.imageUrl
            : product.images?.[0] || "",
        };
      })
      .filter(Boolean);

    if (line_items.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucun produit disponible pour cette commande" });
    }

    const total = line_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 🔹 création commande
    const order = await Order.create({
      name,
      email,
      phone,
      streetAddress,
      country: country || "Tunisie",
      line_items,
      total,
      paid: false,
      status: "En attente",
    });

    console.log(`✅ Commande créée: ${order._id} pour ${email}`);

    // ✅ Retourner une réponse JSON au frontend
    res.status(200).json({
      success: true,
      message: "Commande créée avec succès",
      orderId: order._id,
      order
    });

    // =================================================
    // ⬇️ Emails (non bloquants) - en arrière-plan
    // =================================================
    (async () => {
      try {
        // 🔹 email admin
        await sendEmail({
          to: "societefbm484@gmail.com",
          subject: "🛒 Nouvelle commande client",
          html: `
            <h2>Nouvelle commande de ${name}</h2>
            <p>Email: ${email}</p>
            <p>Téléphone: ${phone}</p>
            <p>Adresse: ${streetAddress}</p>
            <p>Total: ${total} DT</p>
            <p>ID Commande: ${order._id}</p>
            <ul>
              ${line_items
                .map(
                  i =>
                    `<li>${i.quantity}x ${i.productTitle} - ${i.price} DT (Total: ${i.price * i.quantity} DT)</li>`
                )
                .join("")}
            </ul>
          `,
        });

        console.log("📧 Email admin envoyé");

        // 🔹 employés approved
        try {
          const client = await clientPromise;
          const db = client.db("company_db");
          const employeesCol = db.collection("employees");

          const approvedEmployees = await employeesCol
            .find({ status: "approved" })
            .toArray();

          console.log(`📧 Envoi à ${approvedEmployees.length} employés`);

          for (const emp of approvedEmployees) {
            await sendEmail({
              to: emp.email,
              subject: `📦 Nouvelle commande client - ${name}`,
              html: `
                <h3>Nouvelle commande à traiter</h3>
                <p><b>Client:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Téléphone:</b> ${phone}</p>
                <p><b>Adresse:</b> ${streetAddress}</p>
                <p><b>Total:</b> ${total} DT</p>
                <ul>
                  ${line_items
                    .map(
                      i =>
                        `<li>${i.quantity}x ${i.productTitle} - ${i.price} DT</li>`
                    )
                    .join("")}
                </ul>
                <a href="${
                  process.env.NEXTAUTH_URL || "http://localhost:3000"
                }/admin/orders">
                  Voir la commande
                </a>
              `,
            });
          }
        } catch (empError) {
          console.error("Erreur email employés:", empError.message);
        }

        // 🔹 Email de confirmation au client
        await sendEmail({
          to: email,
          subject: "✅ Confirmation de votre commande - Société FBM",
          html: `
            <h2>Merci pour votre commande, ${name} !</h2>
            <p>Votre commande a été enregistrée avec succès.</p>
            <p><strong>Numéro de commande:</strong> ${order._id}</p>
            <p><strong>Total:</strong> ${total} DT</p>
            <p><strong>Statut:</strong> En attente</p>
            <p>Nous vous contacterons dans les plus brefs délais pour confirmer la livraison.</p>
          `,
        });

        console.log("📧 Email client envoyé");

      } catch (err) {
        console.error("POST-CHECKOUT EMAIL ERROR:", err.message);
      }
    })();

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors du checkout." });
  }
}