import { NextApiRequest, NextApiResponse } from 'next';
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await mongooseConnect();

  if (req.method !== "POST") {
    return res.status(405).json({ 
      success: false, 
      error: "Method not allowed" 
    });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      streetAddress, 
      country, 
      cartProducts, 
      userId,
      paymentMethod = "Paiement à la livraison"
    } = req.body;

    // Validation des données requises
    if (!name || !email || !phone || !streetAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "Informations client incomplètes" 
      });
    }

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Panier vide" 
      });
    }

    // 🔹 Récupérer les produits depuis la DB
    const productIds = cartProducts.map((p: any) => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    const line_items = cartProducts.map((p: any) => {
      const product = productsFromDb.find(pr => pr._id.toString() === p._id.toString());
      if (!product) {
        console.error(`Produit non trouvé: ${p._id}`);
        return null;
      }

      let colorVariant = null;
      if (product?.properties?.colorVariants?.length > 0 && p.colorId) {
        colorVariant = product.properties.colorVariants.find(
          (v: any) => v._id.toString() === p.colorId
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
        image: colorVariant ? colorVariant.imageUrl : product.images?.[0] || "",
      };
    }).filter(Boolean);

    if (line_items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Aucun produit disponible pour cette commande" 
      });
    }

    // Calcul du total
    const total = line_items.reduce(
      (sum: number, item: any) => sum + (item.price * item.quantity), 
      0
    );

    // 🔹 Créer la commande
    const order = await Order.create({
      userId: userId || null,
      name,
      email,
      phone,
      streetAddress,
      country: country || "Tunisie",
      line_items,
      total,
      paid: false,
      status: "En attente",
      paymentMethod,
      createdAt: new Date(),
    });

    // 🔹 Envoyer email à l'admin
    try {
      await sendEmail({
        to: "societefbm484@gmail.com",
        subject: "🛒 Nouvelle commande client",
        html: `
          <h2>Nouvelle commande de ${name}</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Téléphone:</strong> ${phone}</p>
          <p><strong>Adresse:</strong> ${streetAddress}</p>
          <p><strong>Total:</strong> ${total} DT</p>
          <p><strong>ID Commande:</strong> ${order._id}</p>
          <h3>Produits commandés:</h3>
          <ul>
            ${line_items.map((i: any) => 
              `<li>${i.quantity}x ${i.productTitle} (${i.color}) - ${i.price} DT = ${i.quantity * i.price} DT</li>`
            ).join("")}
          </ul>
          <p><strong>Total général:</strong> ${total} DT</p>
        `,
      });
    } catch (emailError) {
      console.error("Erreur email admin:", emailError);
      // Continuer même si l'email échoue
    }

    // 🔹 Récupérer tous les employés approved depuis MongoDB
    try {
      const client = await clientPromise;
      const db = client.db("company_db");
      const employeesCol = db.collection("employees");

      const approvedEmployees = await employeesCol.find({ status: "approved" }).toArray();

      // 🔹 Envoyer email à chaque employé
      for (const emp of approvedEmployees) {
        try {
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
              <h4>Produits:</h4>
              <ul>
                ${line_items.map((i: any) => 
                  `<li>${i.quantity}x ${i.productTitle} (${i.color}) - ${i.price} DT</li>`
                ).join("")}
              </ul>
              <p><strong>ID Commande:</strong> ${order._id}</p>
              <br/>
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/orders" 
                 style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Voir la commande
              </a>
            `,
          });
        } catch (empEmailError) {
          console.error(`Erreur email employé ${emp.email}:`, empEmailError);
        }
      }
    } catch (employeesError) {
      console.error("Erreur récupération employés:", employeesError);
    }

    // 🔹 Retourner une réponse JSON claire et propre
    return res.status(201).json({ 
      success: true, 
      message: "Commande créée avec succès",
      orderId: order._id.toString(),
      orderDate: order.createdAt,
      total: total
    });

  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    
    return res.status(500).json({ 
      success: false, 
      error: "Erreur serveur lors du checkout.",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}