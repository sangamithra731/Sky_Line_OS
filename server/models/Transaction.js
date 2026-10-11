import mongoose from "mongoose";

const txSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    category: String, // dues, ticket, merch, fundraiser, supplies, reimbursement, refund
    description: String,
    date: { type: Date, default: Date.now },

    // WHO is involved in the transaction
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // WHO recorded it (usually admin/treasurer)
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Related document (ticket, order, reimbursement)
    relatedTo: { type: mongoose.Schema.Types.ObjectId },
    relatedModel: { type: String }, // "Ticket" | "Order" | "Reimbursement"

    // Optional event reference
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", txSchema);