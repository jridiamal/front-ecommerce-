import mongoose, { model, Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    images: [{ type: String }],
    reference: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    properties: {
      colorVariants: [
        {
          color: String,
          imageUrl: String,
          outOfStock: { type: Boolean, default: false },
        },
      ],
    },
    outOfStock: { type: Boolean, default: false }, 
  },
  { timestamps: true }
);

export const Product = models?.Product || model("Product", ProductSchema);