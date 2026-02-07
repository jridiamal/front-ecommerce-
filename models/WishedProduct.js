import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema(
  {
    userEmail: { 
      type: String, 
      required: true, 
      index: true 
    },
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

// Index composite pour éviter les doublons
WishlistSchema.index({ userEmail: 1, product: 1 }, { unique: true });

// Middleware pour peupler automatiquement
WishlistSchema.pre('find', function() {
  this.populate('product');
});

WishlistSchema.pre('findOne', function() {
  this.populate('product');
});

export default mongoose.models.WishedProduct ||
  mongoose.model("WishedProduct", WishlistSchema);