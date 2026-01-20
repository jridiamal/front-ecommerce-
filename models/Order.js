// models/Order.js
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
        reference: String,
        color: String,
        quantity: Number,
        price: Number,
        colorId: String,
        image: String,
      },
    ],

    total: Number,
    paid: { type: Boolean, default: false },
    status: { type: String, default: "En attente" },
    
    // ✅ AJOUTEZ CES CHAMPS POUR LES NOTIFICATIONS
    employeeNotifications: {
      sent: { type: Boolean, default: false },
      to: [{ type: String }], // Emails des employés notifiés
      employeeCount: { type: Number, default: 0 },
      employeeNames: [{ type: String }],
      sentAt: { type: Date },
      error: { type: String }
    }
  },
  { timestamps: true }
);

export const Order = models.Order || model("Order", OrderSchema);