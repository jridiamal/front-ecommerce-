import mongoose from "mongoose";

const UserRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: false, // تنجّم تخليها null كان Google Auth
    },

    role: {
      type: String,
      enum: ["employee"],
      default: "employee",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

export default mongoose.models.UserRequest ||
  mongoose.model("UserRequest", UserRequestSchema);
