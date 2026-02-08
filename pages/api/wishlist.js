import { mongooseConnect } from "@/lib/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";
import WishedProduct from "@/models/WishedProduct";
import  Product  from "@/models/Product";

export default async function handle(req, res) {
  await mongooseConnect();
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const { user } = session;

  // GET : Récupérer tous les produits favoris de l'utilisateur
  if (req.method === "GET") {
    const wishedProducts = await WishedProduct.find({
      userEmail: user.email,
    }).populate("product"); // Remplit les détails du produit
    res.json(wishedProducts);
  }

  // POST : Ajouter ou Supprimer un favori (Toggle)
  if (req.method === "POST") {
    const { productId } = req.body;

    const existingWish = await WishedProduct.findOne({
      userEmail: user.email,
      product: productId,
    });

    if (existingWish) {
      await WishedProduct.findByIdAndDelete(existingWish._id);
      res.json({ message: "Retiré des favoris", status: "removed" });
    } else {
      await WishedProduct.create({
        userEmail: user.email,
        product: productId,
      });
      res.json({ message: "Ajouté aux favoris", status: "added" });
    }
  }
}