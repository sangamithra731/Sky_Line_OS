import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        size: String,
        quantity: Number,
        price: Number,
        image: String,
      },
    ],
    total: Number,

    // ⭐ Payment flow fields (same as Ticket)
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
    qrCode: String,

    // Fulfillment
    status: {
      type: String,
      enum: ["processing", "ready", "delivered"],
      default: "processing",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);