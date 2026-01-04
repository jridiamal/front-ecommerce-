import { mongooseConnect } from "@/lib/mongoose";
import { Review } from "@/models/Review";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    const { product } = req.query;
    const reviews = await Review.find({ product }).sort({ createdAt: -1 });
    return res.json(reviews);
  }

  if (req.method === "POST") {
    const { product, rating, text } = req.body;
    const review = await Review.create({ product, rating, text });
    return res.json(review);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
