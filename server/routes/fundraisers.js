import express from "express";
import Fundraiser from "../models/Fundraiser.js";
import User from "../models/User.js";
import { auth, requireRole } from "../middleware/auth.js";
import { sendMail } from "../utils/mailer.js";
import { fundraiserMilestoneEmail } from "../utils/emailTemplates.js";
import { notifyUser, notifyMany } from "../utils/notify.js";

const router = express.Router();

// List all fundraisers
router.get("/", auth, async (req, res) => {
  const list = await Fundraiser.find()
    .populate("team", "name email avatar role")
    .populate("tasks.assignee", "name email avatar")
    .populate("tasks.createdBy", "name")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 });
  res.json(list);
});

// Single fundraiser
router.get("/:id", auth, async (req, res) => {
  const f = await Fundraiser.findById(req.params.id)
    .populate("team", "name email avatar role")
    .populate("tasks.assignee", "name email avatar")
    .populate("createdBy", "name");
  res.json(f);
});

// Create fundraiser (admin/volunteer)
router.post("/", auth, requireRole("admin", "volunteer"), async (req, res) => {
  try {
    const f = await Fundraiser.create({
      ...req.body,
      createdBy: req.user.id,
      team: [req.user.id],
    });
    res.json(f);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update fundraiser
router.put("/:id", auth, requireRole("admin", "volunteer"), async (req, res) => {
  const f = await Fundraiser.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(f);
});

// Delete
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Fundraiser.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

// Add team member
router.post("/:id/team", auth, requireRole("admin", "volunteer"), async (req, res) => {
  const { userId } = req.body;
  const f = await Fundraiser.findById(req.params.id);
  if (!f) return res.status(404).json({ msg: "Fundraiser not found" });

  if (!f.team.map((t) => t.toString()).includes(userId)) {
    f.team.push(userId);
    await f.save();

    // Notify new team member
    await notifyUser(userId, {
      type: "event",
      title: `👥 You've been added to "${f.name}"`,
      message: "You're now part of this fundraiser team",
      link: "/fundraiser",
    });
  }

  const populated = await f.populate("team", "name email avatar role");
  res.json(populated);
});

// Remove team member
router.delete("/:id/team/:userId", auth, requireRole("admin", "volunteer"), async (req, res) => {
  const f = await Fundraiser.findById(req.params.id);
  f.team = f.team.filter((t) => t.toString() !== req.params.userId);
  await f.save();
  res.json(f);
});

// ============ TASKS ============
// Add a task
router.post("/:id/tasks", auth, async (req, res) => {
  try {
    const f = await Fundraiser.findById(req.params.id);
    if (!f) return res.status(404).json({ msg: "Not found" });

    const task = {
      ...req.body,
      createdBy: req.user.id,
      status: req.body.status || "todo",
    };
    f.tasks.push(task);
    await f.save();

    // Notify assignee
    if (req.body.assignee && req.body.assignee !== req.user.id) {
      await notifyUser(req.body.assignee, {
        type: "event",
        title: `📝 New task assigned: "${req.body.title}"`,
        message: `In "${f.name}"`,
        link: "/fundraiser",
        priority: "high",
      });
    }

    const populated = await f
      .populate("team", "name email avatar role")
      .populate("tasks.assignee", "name email avatar");
    // Actually need to re-fetch to populate the new task
    const fresh = await Fundraiser.findById(f._id)
      .populate("team", "name email avatar role")
      .populate("tasks.assignee", "name email avatar");
    res.json(fresh);
  } catch (err) {
    console.error("Add task error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// Update a task
router.put("/:id/tasks/:taskId", auth, async (req, res) => {
  try {
    const f = await Fundraiser.findById(req.params.id);
    if (!f) return res.status(404).json({ msg: "Not found" });

    const task = f.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    const wasDone = task.status === "done";
    const prevAssignee = task.assignee?.toString();

    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.assignee !== undefined) task.assignee = req.body.assignee;
    if (req.body.title !== undefined) task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.category !== undefined) task.category = req.body.category;
    if (req.body.priority !== undefined) task.priority = req.body.priority;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;

    // Mark completed
    if (task.status === "done" && !wasDone) {
      task.completedAt = new Date();
    } else if (task.status !== "done") {
      task.completedAt = undefined;
    }

    await f.save();

    // Notify if newly assigned
    if (
      req.body.assignee &&
      req.body.assignee !== prevAssignee &&
      req.body.assignee !== req.user.id
    ) {
      await notifyUser(req.body.assignee, {
        type: "event",
        title: `📝 Task assigned: "${task.title}"`,
        message: `In "${f.name}"`,
        link: "/fundraiser",
      });
    }

    // Milestone check
    const pct = f.goal > 0 ? (f.raised / f.goal) * 100 : 0;
    const sent = f.milestonesSent || [];
    const crossed50 = pct >= 50 && !sent.includes(50);
    const crossed100 = pct >= 100 && !sent.includes(100);

    if (crossed50 || crossed100) {
      const milestone = crossed100 ? 100 : 50;
      f.milestonesSent = [...sent, milestone];
      await f.save();

      const users = await User.find().select("_id email");
      await notifyMany(
        users.map((u) => u._id),
        {
          type: "event",
          title:
            milestone === 100
              ? `🎉 "${f.name}" hit its goal!`
              : `🔥 "${f.name}" is halfway there!`,
          message: `$${f.raised} raised of $${f.goal}`,
          link: "/fundraiser",
          priority: "high",
        }
      );

      users.forEach((u) =>
        sendMail({
          to: u.email,
          ...fundraiserMilestoneEmail(f, milestone),
        }).catch(() => {})
      );
    }

    const fresh = await Fundraiser.findById(f._id)
      .populate("team", "name email avatar role")
      .populate("tasks.assignee", "name email avatar");
    res.json(fresh);
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// Delete a task
router.delete("/:id/tasks/:taskId", auth, async (req, res) => {
  const f = await Fundraiser.findById(req.params.id);
  if (!f) return res.status(404).json({ msg: "Not found" });

  f.tasks.pull(req.params.taskId);
  await f.save();

  const fresh = await Fundraiser.findById(f._id)
    .populate("team", "name email avatar role")
    .populate("tasks.assignee", "name email avatar");
  res.json(fresh);
});

export default router;