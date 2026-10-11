import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: {
      type: String,
      enum: ["baking", "shopping", "table", "setup", "cleanup", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    dueDate: Date,
    completedAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const fundraiserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    goal: { type: Number, required: true },
    raised: { type: Number, default: 0 },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tasks: [taskSchema],
    status: {
      type: String,
      enum: ["planning", "active", "completed"],
      default: "planning",
    },
    category: {
      type: String,
      enum: ["fundraiser", "event", "charity", "other"],
      default: "fundraiser",
    },
    startDate: Date,
    endDate: Date,
    milestonesSent: { type: [Number], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

fundraiserSchema.set("toJSON", { virtuals: true });
fundraiserSchema.set("toObject", { virtuals: true });

export default mongoose.model("Fundraiser", fundraiserSchema);