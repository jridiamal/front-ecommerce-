import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/WishedProduct";
import Product from "@/models/Product";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  await mongooseConnect();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const userEmail = session.user.email;

  // ✅ GET - Version améliorée avec logging
  if (req.method === "GET") {
    try {
      console.log(`Fetching wishlist for user: ${userEmail}`);
      
      // Option 1: Utilisez populate avec options explicites
      const wishlist = await Wishlist
        .find({ userEmail })
        .populate({
          path: 'product',
          model: 'Product' // Nom du modèle, pas de la variable
        })
        .lean(); // Utilisez .lean() pour des objets JavaScript simples

      console.log("Wishlist raw data:", JSON.stringify(wishlist, null, 2));
      
      // Vérifiez chaque élément
      const validWishlist = wishlist.filter(item => {
        const isValid = item.product && item.product._id;
        if (!isValid) {
          console.warn("Invalid wishlist item found:", item);
        }
        return isValid;
      });

      console.log(`Valid wishlist items: ${validWishlist.length}/${wishlist.length}`);
      
      return res.status(200).json(validWishlist);
      
    } catch (error) {
      console.error("Erreur GET wishlist:", error);
      return res.status(500).json({ 
        error: "Erreur serveur", 
        details: error.message 
      });
    }
  }

  // ✅ POST (toggle)
  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: "productId manquant" });
      }

      console.log(`Toggle wishlist: user=${userEmail}, product=${productId}`);

      // Vérifiez d'abord si le produit existe
      const productExists = await Product.findById(productId);
      if (!productExists) {
        return res.status(404).json({ error: "Produit non trouvé" });
      }

      const existing = await Wishlist.findOne({ userEmail, product: productId });

      if (existing) {
        await Wishlist.deleteOne({ _id: existing._id });
        console.log("Wishlist item removed");
        return res.json({ wished: false, action: "removed" });
      }

      const newItem = await Wishlist.create({ userEmail, product: productId });
      console.log("Wishlist item added:", newItem);
      return res.json({ wished: true, action: "added" });
      
    } catch (error) {
      console.error("Erreur POST wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ✅ DELETE
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

      console.log("DELETE result:", result);
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Élément non trouvé" });
      }

      return res.json({ success: true, deletedCount: result.deletedCount });
      
    } catch (error) {
      console.error("Erreur DELETE wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end();
}