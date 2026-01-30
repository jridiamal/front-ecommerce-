import { mongooseConnect } from "@/lib/mongoose";
import { Wishlist } from "@/models/Wishlist";
import { Product } from "@/models/Product";
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
      // Récupérer les favoris avec les produits complets
      const wishlistItems = await Wishlist.find({ userEmail })
        .populate('product')
        .sort({ createdAt: -1 });
      
      // S'assurer que chaque produit existe
      const validItems = wishlistItems.filter(item => item.product);
      
      return res.status(200).json(validItems);
    } catch (err) {
      console.error("Erreur GET wishlist:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "ID produit manquant" });
      }

      // Vérifier si le produit existe
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      // Vérifier si déjà en favoris
      const existing = await Wishlist.findOne({ 
        userEmail, 
        product: productId 
      });

      if (existing) {
        // Retirer des favoris
        await Wishlist.findByIdAndDelete(existing._id);
        return res.status(200).json({ message: "Retiré des favoris" });
      } else {
        // Ajouter aux favoris
        const wishlistItem = await Wishlist.create({
          userEmail,
          product: productId
        });
        
        // Populate pour retourner le produit complet
        await wishlistItem.populate('product');
        return res.status(201).json(wishlistItem);
      }
    } catch (err) {
      console.error("Erreur POST wishlist:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { productId } = req.query;
      
      if (!productId) {
        return res.status(400).json({ error: "ID produit manquant" });
      }

      const result = await Wishlist.findOneAndDelete({
        userEmail,
        product: productId
      });

      if (!result) {
        return res.status(404).json({ error: "Produit non trouvé dans les favoris" });
      }

      return res.status(200).json({ message: "Retiré des favoris" });
    } catch (err) {
      console.error("Erreur DELETE wishlist:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}