import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    await mongooseConnect();

    const { name, email, phone, streetAddress, country, cartProducts } = req.body;

    if (!name || !email || !phone || !streetAddress || !country || !cartProducts?.length) {
      return res.status(400).json({ success: false, error: "Champs manquants ou panier vide" });
    }

    // جلب المنتجات من DB
    const productsFromDb = await Product.find({
      _id: { $in: cartProducts.map(p => p._id) },
    });

    let total = 0;

    // تجهيز line_items مع كل المعلومات المهمة للموظف
    const line_items = cartProducts.map(p => {
      const product = productsFromDb.find(prod => prod._id.toString() === p._id);
      const quantity = p.quantity || 1;
      const price = product?.price || 0;

      total += price * quantity;

      return {
        productId: p._id,
        productTitle: product?.title || "Produit inconnu", // اسم المنتج
        quantity,
        price,
        color: p.color || null,                         // اللون اللي اختاره العميل
        reference: product?.reference || null,         // المرجع من DB
        image: product?.images?.[0] || "https://via.placeholder.com/100", // صورة المنتج
      };
    });

    // رسوم التوصيل
    const deliveryFee = cartProducts.length > 0 ? 8 : 0;
    total += deliveryFee;

    // إنشاء الطلبية
    const order = await Order.create({
      name,
      email,
      phone,
      streetAddress,
      country,
      line_items,
      paid: false,
      status: "En attente",
      total,
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      orderId: order._id,
      total,
      currency: "TND"
    });

  } catch (err) {
    console.error("Erreur API /checkout:", err);
    return res.status(500).json({ success: false, error: "Erreur serveur" });
  }
}
