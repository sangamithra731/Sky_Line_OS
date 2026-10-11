import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: Number,
    memberPrice: Number,
    image: String,
    category: { type: String, default: "merch" },
    sizes: [String],
    stock: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);