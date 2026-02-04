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

  // ✅ GET - Récupérer la wishlist
  if (req.method === "GET") {
    try {
      const wishlist = await Wishlist
        .find({ userEmail })
        .populate("product")
        .lean();
      
      // Filtrer les éléments valides
      const validWishlist = wishlist.filter(item => 
        item.product && item.product._id
      );
      
      return res.status(200).json(validWishlist);
    } catch (error) {
      console.error("Erreur GET wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ✅ POST - Ajouter ou retirer (toggle)
  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "productId manquant" });
      }

      // Vérifier si déjà dans les favoris
      const existing = await Wishlist.findOne({ 
        userEmail, 
        product: productId 
      });

      if (existing) {
        // Supprimer si déjà présent
        await Wishlist.deleteOne({ _id: existing._id });
        return res.json({ 
          success: true, 
          wished: false, 
          action: "removed" 
        });
      }

      // Ajouter aux favoris
      await Wishlist.create({ 
        userEmail, 
        product: productId 
      });
      
      return res.json({ 
        success: true, 
        wished: true, 
        action: "added" 
      });
      
    } catch (error) {
      console.error("Erreur POST wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ✅ DELETE - Retirer spécifiquement
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
        return res.status(404).json({ 
          error: "Produit non trouvé dans les favoris" 
        });
      }

      return res.json({ 
        success: true, 
        deletedCount: result.deletedCount 
      });
      
    } catch (error) {
      console.error("Erreur DELETE wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).json({ error: "Méthode non autorisée" });
}