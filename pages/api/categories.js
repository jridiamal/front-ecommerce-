
import {mongooseConnect} from "@/lib/mongoose";
import {Category} from "@/models/Category";

export default async function handle(req, res) {
  await mongooseConnect();
  
  const categories = await Category.find().populate('parent');
  
  res.json(categories);
}