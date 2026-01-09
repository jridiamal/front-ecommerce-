import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/WishedProduct";
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
      const wishlist = await Wishlist.find({ userEmail }).populate("product");
      return res.status(200).json(
        wishlist.map(w => ({
          _id: w._id,
          product: w.product,
          wished: true
        }))
      );
    } catch (err) {
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

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}