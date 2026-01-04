import { Schema, model, models } from "mongoose";

const WishedProductSchema = new Schema(
  {
    userEmail: { type: String, required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

export const WishedProduct =
  models.WishedProduct || model("WishedProduct", WishedProductSchema);
