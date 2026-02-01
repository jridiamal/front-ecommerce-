// /api/wishlist.js
import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product"; // IMPORTANT: Ajouter cette importation
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
      // Récupérer tous les favoris avec les produits COMPLETS
      const wishlistItems = await Wishlist.find({ userEmail })
        .populate({
          path: 'product',
          model: Product, // Utiliser le modèle Product
          select: '_id title price images' // Sélectionner les champs nécessaires
        })
        .lean();
      
      // Formater la réponse
      const formattedWishlist = wishlistItems.map(item => ({
        _id: item._id,
        product: item.product ? {
          _id: item.product._id,
          title: item.product.title,
          price: item.product.price,
          images: item.product.images || []
        } : null,
        wished: true
      }));

      return res.status(200).json(formattedWishlist);
    } catch (err) {
      console.error("Erreur GET wishlist:", err);
      return res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  }

  if (req.method === "POST") {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: "ID produit manquant" });

    const existing = await Wishlist.findOne({ userEmail, product });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.status(200).json({ wished: false });
    } else {
      await Wishlist.create({ userEmail, product });
      return res.status(200).json({ wished: true });
    }
  }

  if (req.method === "DELETE") {
    const { productId } = req.query;
    if (!productId) return res.status(400).json({ error: "ID produit manquant" });

    try {
      await Wishlist.deleteOne({ userEmail, product: productId });
      return res.status(200).json({ message: "Produit retiré des favoris" });
    } catch (err) {
      console.error("Erreur DELETE wishlist:", err);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}