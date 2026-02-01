// /api/customer/historique.js
import { mongooseConnect } from "@/lib/mongoose";
import { Order } from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }
  const userEmail = session.user.email;

  // ---------------- DELETE ALL -----------------
  if (req.method === "DELETE") {
    try {
      // Supprimer les commandes terminées (Récupérée, Annulée, Prête)
      const result = await Order.deleteMany({
        email: userEmail,
        status: { $in: ["Récupérée", "Annulée", "Prête"] }
      });

      return res.status(200).json({ 
        message: "Historique supprimé",
        deletedCount: result.deletedCount 
      });
    } catch (err) {
      console.error("Erreur DELETE historique:", err);
      return res.status(500).json({ error: "Erreur DELETE historique" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}