import express from "express";
import Product from "../models/Product.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

router.post("/", auth, requireRole("admin"), async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(product);
});

router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

export default router;