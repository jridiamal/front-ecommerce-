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

  if (req.method === "GET") {
    try {
      const wishlist = await Wishlist
        .find({ userEmail })
        .populate("product");
            console.log("WISHLIST FROM DB 👉", wishlist); // ✅ هنا بالضبط      
      return res.status(200).json(wishlist);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "POST") {
    try {
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ error: "productId manquant" });
      }

      const existing = await Wishlist.findOne({ 
        userEmail, 
        product: productId 
      });

      if (existing) {
        await Wishlist.deleteOne({ _id: existing._id });
        return res.json({ wished: false });
      }

      await Wishlist.create({ 
        userEmail, 
        product: productId 
      });
      
      return res.json({ wished: true });
      
    } catch (error) {
      console.error("Error in POST wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { productId } = req.query;

      if (!productId) {
        return res.status(400).json({ error: "productId manquant dans query" });
      }

      const result = await Wishlist.deleteOne({
        userEmail,
        product: productId,
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Produit non trouvé dans les favoris" });
      }

      return res.json({ success: true, deletedCount: result.deletedCount });
      
    } catch (error) {
      console.error("Error in DELETE wishlist:", error);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).json({ error: `Méthode ${req.method} non autorisée` });
}