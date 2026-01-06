import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    userId: String,
    name: String,
    email: String,
    phone: String,
    streetAddress: String,
    country: String,

    line_items: [
      {
        productId: String,
        productTitle: String,
        reference: String,   // ✅ مهم
        color: String,       // ✅ مهم
        quantity: Number,
        price: Number,
        colorId: String,

        image: String,
      },
    ],

    total: Number,
    paid: { type: Boolean, default: false },
    status: { type: String, default: "En attente" },
  },
  { timestamps: true }
);

export const Order = models.Order || model("Order", OrderSchema);
