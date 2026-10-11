import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    category: {
      type: String,
      enum: ["participation", "achievement", "completion", "winner", "volunteer"],
      default: "participation",
    },
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    eventName: String, // for standalone certs
    position: String,  // "1st Place", "Runner-up", "Participant"
    issuedAt: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verificationCode: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export default mongoose.model("Certificate", certificateSchema);