import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, index: true },
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
  },
  { 
    timestamps: true
  }
);

WishlistSchema.index({ userEmail: 1, product: 1 }, { unique: true });

export default mongoose.models.WishedProduct ||
  mongoose.model("WishedProduct", WishlistSchema);