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

  // ✅ GET
  if (req.method === "GET") {
    const wishlist = await Wishlist
      .find({ userEmail })
      .populate("product");

    return res.status(200).json(wishlist);
  }

  // ✅ POST (toggle)
  if (req.method === "POST") {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "productId manquant" });
    }

    const existing = await Wishlist.findOne({ userEmail, product: productId });

    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.json({ wished: false });
    }

    await Wishlist.create({ userEmail, product: productId });
    return res.json({ wished: true });
  }

  // ✅ DELETE
  if (req.method === "DELETE") {
    const { productId } = req.query;

    await Wishlist.deleteOne({
      userEmail,
      product: productId,
    });

    return res.json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  res.status(405).end();
}
