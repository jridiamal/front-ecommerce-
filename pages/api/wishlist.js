import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { mongooseConnect } from "@/lib/mongoose";
import Wishlist from "@/models/WishedProduct";

export default async function handler(req, res) {
  await mongooseConnect();
  const session = await getServerSession(req, res, authOptions);

  if (!session) return res.status(401).end();

  const userEmail = session.user.email;

  if (req.method === "POST") {
    const { productId } = req.body;
    const exist = await Wishlist.findOne({ userEmail, product: productId });
    if (exist) return res.json(exist);

    const wish = await Wishlist.create({
      userEmail,
      product: productId,
    });
    return res.json(wish);
  }

  if (req.method === "DELETE") {
    const { productId } = req.body;
    await Wishlist.deleteOne({ userEmail, product: productId });
    return res.json({ success: true });
  }

  if (req.method === "GET") {
    const wishlist = await Wishlist.find({ userEmail }).populate("product");
    return res.json(wishlist);
  }

  res.status(405).end();
}
