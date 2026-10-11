import express from "express";
import Event from "../models/Event.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const events = await Event.find().sort({ eventDate: 1 });
  res.json(events);
});

router.get("/:id", async (req, res) => {
  const event = await Event.findById(req.params.id);
  res.json(event);
});

router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(event);
});

router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

export default router;