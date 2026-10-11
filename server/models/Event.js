import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    // ============ VISUAL ============
    title: { type: String, required: true },
    tagline: String,
    description: { type: String, required: true },
    image: String,
    bannerColor: { type: String, default: "brand" },
    category: {
      type: String,
      enum: ["technical", "cultural", "sports", "social", "workshop", "other"],
      default: "other",
    },

    // ============ TIMELINE ============
    registrationOpensAt: { type: Date, default: Date.now },
    registrationClosesAt: Date,
    eventDate: { type: Date, required: true },
    eventStartTime: String, // "09:00"
    eventEndTime: String,   // "18:00"

    // ============ LOCATION ============
    venue: { type: String, required: true },

    // ============ PARTICIPATION ============
    eligibility: {
      type: String,
      enum: [
        "Open to all",
        "Members only",
        "Students only",
        "Teams of 2-4",
        "Invite only",
      ],
      default: "Open to all",
    },
    teamSize: {
      min: { type: Number },
      max: { type: Number },
    },
    capacity: { type: Number, default: 100 },
    ticketsSold: { type: Number, default: 0 },

    // ============ MONEY ============
    isFree: { type: Boolean, default: false },
    ticketTypes: [
      {
        name: { type: String, default: "General" },
        price: Number,
        memberPrice: Number,
      },
    ],

    // ============ REQUIREMENTS ============
    techRequired: { type: [String], default: [] },
    skillsRequired: { type: [String], default: [] },
    thingsToBring: { type: [String], default: [] },

    // ============ RULES ============
    rules: { type: [String], default: [] },

    // ============ CONTACT ============
    contactEmail: String,
    contactPhone: String,
    organizerName: String,

    // ============ META ============
    isPublished: { type: Boolean, default: true }, // false = draft
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Virtual: computed status from dates
eventSchema.virtual("status").get(function () {
  if (!this.isPublished) return "draft";
  const now = new Date();
  if (this.registrationClosesAt && now > this.registrationClosesAt) return "closed";
  if (this.eventDate && now > this.eventDate) {
    const oneDayAfter = new Date(this.eventDate.getTime() + 24 * 3600 * 1000);
    return now > oneDayAfter ? "completed" : "ongoing";
  }
  if (this.registrationOpensAt && now < this.registrationOpensAt) return "upcoming";
  return "open";
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

export default mongoose.model("Event", eventSchema);