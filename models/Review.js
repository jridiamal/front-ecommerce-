import mongoose, { Schema } from "mongoose";

const ReviewSchema = new Schema({
  product: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
  rating: Number,
  text: String,
}, { timestamps: true });

export const Review =
  mongoose.models.Review || mongoose.model("Review", ReviewSchema);
