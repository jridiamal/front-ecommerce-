import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
  console.log("👉 دخلنا لـ checkout API");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await mongooseConnect();
    console.log("✅ MongoDB connected");

    const { name, email, cartProducts } = req.body;
    console.log("📦 Data جات من الفرونت:", req.body);

    if (!cartProducts || cartProducts.length === 0) {
      console.log("❌ الكارت فارغ");
      return res.status(400).json({ error: "Cart empty" });
    }

    const order = await Order.create({
      name,
      email,
      line_items: cartProducts,
      paid: false,
    });

    console.log("✅ الكومندة تخلقت:", order._id);

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("🔥 Error في checkout:", err);
    return res.status(500).json({ error: "Erreur lors de la commande" });
  }
}
