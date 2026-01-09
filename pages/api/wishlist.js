import { getSession } from "next-auth/react";
import { connectToDB } from "@/lib/mongodb";
import Wishlist from "@/models/WishedProduct";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) return res.status(401).json({ error: "Not logged in" });

  await connectToDB();
  const userEmail = session.user.email;

  if (req.method === "GET") {
    const wishlist = await Wishlist.find({ userEmail }).populate("product");
    return res.json(wishlist);
  }

  if (req.method === "POST") {
    const { product } = req.body;
    const exist = await Wishlist.findOne({ userEmail, product });
    if (exist) return res.status(400).json({ error: "Already exists" });
    const newFav = await Wishlist.create({ userEmail, product });
    return res.json(newFav);
  }

  if (req.method === "DELETE") {
    const { productId } = req.body;
    await Wishlist.deleteOne({ userEmail, product: productId });
    return res.json({ success: true });
  }

  res.status(405).json({ error: "Method not allowed" });
}