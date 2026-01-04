import { mongooseConnect } from "@/lib/mongoose";
import { WishedProduct } from "@/models/WishedProduct";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]"; // Vérifiez bien ce chemin

export default async function handler(req, res) {
  await mongooseConnect();

  // On récupère la session côté serveur
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Non authentifié" });
  }

  const userEmail = session.user.email;

  if (req.method === "GET") {
    try {
      // On peuple le champ 'product' pour avoir les détails (titre, image) dans la page compte
      const wishlist = await WishedProduct.find({ userEmail }).populate("product");
      return res.status(200).json(wishlist);
    } catch (err) {
      return res.status(500).json({ error: "Erreur lors de la récupération" });
    }
  }

  if (req.method === "POST") {
    const { product } = req.body;
    if (!product) return res.status(400).json({ error: "ID produit manquant" });

    const existing = await WishedProduct.findOne({ userEmail, product });

    if (existing) {
      await WishedProduct.deleteOne({ _id: existing._id });
      return res.status(200).json({ wished: false });
    } else {
      await WishedProduct.create({ userEmail, product });
      return res.status(200).json({ wished: true });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}