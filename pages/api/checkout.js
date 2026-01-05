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
      cartProducts, // [{ _id, colorId, quantity }]
      paymentMethod,
    } = req.body;

    if (!cartProducts || cartProducts.length === 0) {
      return res.status(400).json({ error: "Panier vide" });
    }

    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: productIds });

    const line_items = cartProducts.map(p => {
      const product = productsFromDb.find(pr => pr._id.toString() === p._id);
      if (!product) throw new Error("Produit introuvable");

      // Trouver couleur
      const colorVariant = product.colors?.find(c => c._id.toString() === p.colorId);
      if (!colorVariant || colorVariant.outOfStock) {
        throw new Error(`Produit ${product.title} couleur indisponible`);
      }

      return {
        productId: product._id,
        productTitle: product.title,
        reference: product.reference,
        color: colorVariant.name,
        colorId: colorVariant._id,
        quantity: Number(p.quantity || 1),
        price: Number(product.price || 0),
        image: colorVariant.image,
      };
    });

    const total = line_items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create({
      name,
      email,
      phone,
      streetAddress,
      country,
      line_items,
      total,
      paid: false,
      status: "En attente",
      paymentMethod: paymentMethod || "Paiement à la livraison",
    });

    return res.status(201).json(order);

  } catch (err) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
}
