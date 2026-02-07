import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/WishedProduct";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: "productId manquant" });
  }

  // Si l'utilisateur n'est pas connecté, retourner false
  if (!session?.user?.email) {
    return res.json({ wished: false });
  }

  const userEmail = session.user.email;

  try {
    const existing = await Wishlist.findOne({
      userEmail,
      product: productId,
    });

    return res.json({ wished: !!existing });
  } catch (error) {
    console.error("Erreur vérification wishlist:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}