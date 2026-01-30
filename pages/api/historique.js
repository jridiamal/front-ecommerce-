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

  if (req.method === "GET") {
    try {
      // Récupérer uniquement les commandes avec statut historique
      const historique = await Order.find({
        email: userEmail,
        status: { $in: ["Annulée", "Livrée", "Prête"] },
      }).sort({ createdAt: -1 });

      return res.status(200).json(historique);
    } catch (err) {
      console.error("Erreur GET historique:", err);
      return res.status(500).json({ error: "Erreur GET historique" });
    }
  }

  // ---------------- DELETE ALL -----------------
  if (req.method === "DELETE") {
    try {
      // Marquer les commandes historiques comme "Supprimée" au lieu de les supprimer
      await Order.updateMany(
        { 
          email: userEmail, 
          status: { $in: ["Annulée", "Livrée", "Prête"] } 
        },
        { $set: { status: "Supprimée" } }
      );

      return res.status(200).json({ message: "Historique marqué comme supprimé" });
    } catch (err) {
      console.error("Erreur DELETE historique:", err);
      return res.status(500).json({ error: "Erreur DELETE historique" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}