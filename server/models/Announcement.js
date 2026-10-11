import mongoose from "mongoose";

const annSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    audience: {
      type: String,
      enum: ["all", "members", "volunteers", "admins"],
      default: "all",
    },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", annSchema);