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

    const productIds = cartProducts.map(p => p._id);
    const productsFromDb = await Product.find({ _id: productIds });

    const line_items = cartProducts.map(p => {
      const product = productsFromDb.find(
        pr => pr._id.toString() === p._id
      );

      const colorVariant = product?.colors?.id(p.colorId);

      // ⛔ sécurité backend
      if (!colorVariant || colorVariant.outOfStock) {
        throw new Error("Color out of stock");
      }

      const quantity = Number(p.quantity || 1);
      const price = Number(product?.price || 0);

      return {
        productId: product._id,
        productTitle: product.title,
        reference: product.reference,
        color: colorVariant.name,
        colorId: colorVariant._id,
        quantity,
        price,
        image: colorVariant.image, // ✅ image correcte
      };
    });

    const total = line_items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

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

    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
}
