// /api/checkout.js
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

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
      userId,
    } = req.body;

    // Sécurité basique
    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    // Récupérer les produits depuis la DB
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: productIds });

    // Créer les line_items
    const line_items = cartProducts
      .map(p => {
        const product = productsFromDb.find(
          pr => pr._id.toString() === p._id
        );
        if (!product) return null;

        let colorVariant = null;

        // Si le produit a des couleurs
        if (
          product?.properties?.colorVariants?.length > 0 &&
          p.colorId
        ) {
          colorVariant = product.properties.colorVariants.find(
            v => v._id.toString() === p.colorId
          );
          if (!colorVariant) return null;
        }

        const quantity = Number(p.quantity || 1);
        const price = Number(product.price || 0);

        return {
          productId: product._id,
          productTitle: product.title,
          reference: product.reference,
          color: colorVariant ? colorVariant.color : "default",
          colorId: colorVariant ? colorVariant._id : null,
          quantity,
          price,
          image: colorVariant
            ? colorVariant.imageUrl
            : product.images?.[0],
        };
      })
      .filter(Boolean);

    if (line_items.length === 0) {
      return res
        .status(400)
        .json({ error: "Aucun produit disponible pour cette commande" });
    }

    // Calcul du total
    const total = line_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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

    return res.status(201).json(order);
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return res
      .status(500)
      .json({ error: "Erreur serveur lors du checkout." });
  }
}
