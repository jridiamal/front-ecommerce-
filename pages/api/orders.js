import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";

export default async function handler(req, res) {
  await mongooseConnect();

  // ---------------- GET -----------------
  if (req.method === "GET") {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } catch (err) {
      return res.status(500).json({ error: "Erreur GET" });
    }
  }

  // ---------------- PUT (Modifier / Confirmer / Annuler) -----------------
  if (req.method === "PUT") {
    try {
      const { id, status, line_items, total } = req.body;

      if (!id) return res.status(400).json({ error: "Missing order id" });

      const updateData = {};
      if (status) updateData.status = status;
      if (line_items) updateData.line_items = line_items;
      if (total) updateData.total = total;

      const updated = await Order.findByIdAndUpdate(id, updateData, { new: true });

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: "Erreur PUT" });
    }
  }

  // ---------------- DELETE -----------------
  if (req.method === "DELETE") {
    try {
      const { orderId, userEmail } = req.body;
      if (!orderId || !userEmail) return res.status(400).json({ error: "Paramètres manquants" });

      const order = await Order.findOne({ _id: orderId, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      order.status = "Annulée";
      await order.save();

      return res.status(200).json({ message: "Commande annulée avec succès" });
    } catch (err) {
      return res.status(500).json({ error: "Erreur DELETE" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
