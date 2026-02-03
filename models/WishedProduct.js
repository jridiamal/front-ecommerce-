// models/Product.js
import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    // ... autres champs
  },
  { timestamps: true }
);

export default mongoose.models.Product || 
       mongoose.model("Product", ProductSchema);