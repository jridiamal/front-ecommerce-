import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if(!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const userEmail = session.user.email;

  // ---------------- GET -----------------
  if (req.method === "GET") {
    try {
      const orders = await Order.find({ email: userEmail }).sort({ createdAt: -1 });
      return res.status(200).json(orders);
    } catch (err) {
      return res.status(500).json({ error: "Erreur GET" });
    }
  }

  // ---------------- PUT -----------------
  if (req.method === "PUT") {
    try {
      const { id, status, line_items, total } = req.body;
      if (!id) return res.status(400).json({ error: "Missing order id" });

      const order = await Order.findOne({ _id: id, email: userEmail });
      if (!order) return res.status(404).json({ error: "Commande non trouvée" });

      if (status) order.status = status;
      if (line_items) order.line_items = line_items;
      if (total) order.total = total;

      await order.save();
      return res.status(200).json(order);
    } catch (err) {
      return res.status(500).json({ error: "Erreur PUT" });
    }
  }

  // ---------------- DELETE -----------------
  if (req.method === "DELETE") {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ error: "Paramètres manquants" });

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
