import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["member", "volunteer", "admin", "treasurer"],
      default: "member",
    },
    membershipStatus: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "pending",
    },
    membershipExpiry: Date,
    duesPaid: { type: Boolean, default: false },
    phone: String,
    avatar: String,
    bio: String,
    studentId: String,
    // Payment details (admin-facing)
    upiId: String,
    paymentPhone: String,
    paymentNote: String,
    lastDuesReminderAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);