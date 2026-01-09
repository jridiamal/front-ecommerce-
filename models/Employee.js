import mongoose, { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // كي تحتاج تسجيل دخول بالـ password
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Employee || model("Employee", EmployeeSchema);
