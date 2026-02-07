import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/WishedProduct";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const userEmail = session.user.email;

  // ================= GET =================
  if (req.method === "GET") {
    try {
      const wishlist = await Wishlist
        .find({ userEmail })
        .populate({
          path: "product",
          select: "_id title images price properties"
        });

      console.log(`Wishlist trouvée pour ${userEmail}: ${wishlist.length} items`);
      
      // Filtrer les favoris avec produits null (produits supprimés)
      const cleanedWishlist = wishlist.filter(item => item.product);

      return res.status(200).json(cleanedWishlist);
    } catch (error) {
      console.error("Erreur GET wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ================= POST =================
  if (req.method === "POST") {
    try {
      const { productId } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "productId manquant" });
      }

      const existing = await Wishlist.findOne({
        userEmail,
        product: productId,
      });

      // toggle favoris
      if (existing) {
        await Wishlist.deleteOne({ _id: existing._id });
        console.log(`Favori retiré: ${productId} pour ${userEmail}`);
        return res.json({ wished: false });
      }

      await Wishlist.create({
        userEmail,
        product: productId,
      });

      console.log(`Favori ajouté: ${productId} pour ${userEmail}`);
      return res.json({ wished: true });
    } catch (error) {
      console.error("Erreur POST wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ================= DELETE =================
  if (req.method === "DELETE") {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: "productId manquant" });
      }

      const result = await Wishlist.deleteOne({
        userEmail,
        product: productId,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      console.log(`Favori supprimé via DELETE: ${productId} pour ${userEmail}`);
      return res.json({ success: true });
    } catch (error) {
      console.error("Erreur DELETE wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: "Méthode non autorisée" });
}