import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ticketType: String,
    price: Number,
    qrCode: String,
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    refunded: { type: Boolean, default: false },
    // ⭐ NEW payment fields
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "rejected", "refunded"],
      default: "pending",
    },
    paymentProof: String,
    paymentNote: String,
    paymentConfirmedAt: Date,
    paymentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    referenceId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);