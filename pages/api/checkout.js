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
    const { name, email, phone, streetAddress, country, cartProducts, userId } = req.body;

    // Récupérer tous les produits depuis MongoDB
    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: { $in: productIds } });

    // Préparer les line_items
    const line_items = cartProducts.map(p => {
      const product = productsFromDb.find(pr => pr._id.toString() === p._id.toString());
      if (!product) return null; // produit non trouvé

      // Chercher la couleur par ID ou par nom
      let colorVariant = null;
      if (p.colorId && product.colors) {
        colorVariant = product.colors.id(p.colorId);
      }
      if (!colorVariant && p.color && product.colors) {
        colorVariant = product.colors.find(c => c.name === p.color);
      }

      if (!colorVariant || colorVariant.outOfStock) return null; // couleur indisponible

      const quantity = Number(p.quantity || 1);
      const price = Number(product.price || 0);

      return {
        productId: product._id,
        productTitle: product.title,
        reference: product.reference,
        color: colorVariant.name,
        colorId: colorVariant._id,
        quantity,
        price,
        image: colorVariant.image,
      };
    }).filter(Boolean); // supprimer les null (produits indisponibles)

    if (line_items.length === 0) {
      return res.status(400).json({ error: "Aucun produit disponible pour cette commande." });
    }

    // Calcul du total
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

    return res.status(201).json(order);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur lors du checkout." });
  }
}
