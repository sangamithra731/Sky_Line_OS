import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Product from "./models/Product.js";
import Announcement from "./models/Announcement.js";
import Transaction from "./models/Transaction.js";
import Fundraiser from "./models/Fundraiser.js";

await mongoose.connect(process.env.MONGO_URI);
console.log("Seeding...");

await Promise.all([
  User.deleteMany(),
  Event.deleteMany(),
  Product.deleteMany(),
  Announcement.deleteMany(),
  Transaction.deleteMany(),
  Fundraiser.deleteMany(),
]);

const pass = await bcrypt.hash("password123", 10);

const admin = await User.create({
  name: "Aarav Sharma",
  email: "admin@skyline.edu",
  password: pass,
  role: "admin",
  duesPaid: true,
  membershipStatus: "active",
  membershipExpiry: new Date(Date.now() + 300 * 86400000),
});

await User.create({
  name: "Admin",
  email: "admin@gmail.com",
  password: await bcrypt.hash("123456", 10),
  role: "admin",
  duesPaid: true,
  membershipStatus: "active",
  membershipExpiry: new Date(Date.now() + 365 * 86400000),
});

const treasurer = await User.create({
  name: "Priya Patel",
  email: "treasurer@skyline.edu",
  password: pass,
  role: "treasurer",
  duesPaid: true,
  membershipStatus: "active",
  membershipExpiry: new Date(Date.now() + 300 * 86400000),
});

await User.create({
  name: "Rohan Mehta",
  email: "member@skyline.edu",
  password: pass,
  role: "member",
  duesPaid: true,
  membershipStatus: "active",
  membershipExpiry: new Date(Date.now() + 200 * 86400000),
});

await User.create({
  name: "Sara Khan",
  email: "newbie@skyline.edu",
  password: pass,
  role: "member",
  duesPaid: false,
  membershipStatus: "pending",
});

for (let i = 1; i <= 20; i++) {
  await User.create({
    name: `Member ${i}`,
    email: `member${i}@skyline.edu`,
    password: pass,
    role: "member",
    duesPaid: i % 3 !== 0,
    membershipStatus: i % 3 !== 0 ? "active" : "pending",
  });
}

await Event.create([
  {
    title: "Spring Gala 2025",
    description: "Biggest event of the year with live music and dinner.",
    eventDate: new Date(Date.now() + 14 * 86400000),
    date: new Date(Date.now() + 14 * 86400000),
    venue: "Grand Hall",
    capacity: 100,
    bannerColor: "brand",
    ticketTypes: [
      { name: "General", price: 25, memberPrice: 15 },
      { name: "VIP", price: 60, memberPrice: 45 },
    ],
    createdBy: admin._id,
  },
  {
    title: "Tech Talk: AI in 2025",
    description: "Guest speaker from Google on the future of AI.",
    eventDate: new Date(Date.now() + 7 * 86400000),
    date: new Date(Date.now() + 7 * 86400000),
    venue: "Auditorium A",
    capacity: 80,
    bannerColor: "purple",
    ticketTypes: [{ name: "General", price: 10, memberPrice: 0 }],
    createdBy: admin._id,
  },
  {
    title: "Bake Sale Fundraiser",
    description: "Support the club by grabbing some treats!",
    eventDate: new Date(Date.now() + 21 * 86400000),
    date: new Date(Date.now() + 21 * 86400000),
    venue: "Student Center",
    capacity: 200,
    bannerColor: "amber",
    ticketTypes: [{ name: "Entry", price: 5, memberPrice: 3 }],
    createdBy: admin._id,
  },
]);

await Product.create([
  {
    name: "Skyline Club Cap",
    price: 28,
    memberPrice: 20,
    description: "Structured 6-panel cap with 3D-embroidered Skyline logo. Adjustable snapback closure, breathable cotton, curved brim.",
    category: "apparel",
    sizes: ["OS"],
    stock: { OS: 45 },
    image: "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=1000&q=90&fit=crop",
  },
  {
    name: "Skyline Event Tee 2025",
    price: 30,
    memberPrice: 22,
    description: "Limited edition Spring Gala 2025 commemorative tee. Premium cotton, screen-printed graphic, collectible design.",
    category: "apparel",
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: { S: 15, M: 30, L: 25, XL: 15, XXL: 8 },
    image: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1000&q=90&fit=crop",
  },
  {
    name: "Skyline Travel Tumbler",
    price: 24,
    memberPrice: 18,
    description: "Insulated 480ml travel tumbler with sliding lid. Fits standard cup holders, keeps drinks hot for 6 hours.",
    category: "lifestyle",
    sizes: ["480ml"],
    stock: { "480ml": 50 },
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=1000&q=90&fit=crop",
  },
  {
    name: "Skyline Sticker Pack",
    price: 12,
    memberPrice: 8,
    description: "Set of 12 premium vinyl stickers with Skyline designs. Waterproof, UV-resistant, laptop and bottle safe.",
    category: "lifestyle",
    sizes: ["Pack"],
    stock: { Pack: 200 },
    image: "https://images.unsplash.com/photo-1611605698335-8b1569810432?w=1000&q=90&fit=crop",
  },
]);

await Announcement.create([
  {
    title: "🎉 Spring Gala tickets LIVE!",
    body: "Grab your tickets now before they sell out. Members get 40% off!",
    author: admin._id,
    pinned: true,
  },
  {
    title: "Meeting next Friday",
    body: "General body meeting at 5 PM in Room 204. Attendance counts!",
    author: admin._id,
  },
]);

await Transaction.create([
  { type: "income", amount: 1500, category: "dues", description: "Semester dues collection", recordedBy: treasurer._id },
  { type: "income", amount: 320, category: "ticket", description: "Gala early birds", recordedBy: treasurer._id },
  { type: "expense", amount: 180, category: "supplies", description: "Decorations for gala", recordedBy: treasurer._id },
  { type: "expense", amount: 45, category: "reimbursement", description: "Volunteer snacks", recordedBy: treasurer._id },
  { type: "income", amount: 210, category: "merch", description: "Merch sales", recordedBy: treasurer._id },
]);

await Fundraiser.create({
  name: "Bake Sale for Library Fund",
  description: "Raise funds for new books",
  goal: 500,
  raised: 180,
  status: "active",
  team: [admin._id, treasurer._id],
  tasks: [
    { title: "Buy ingredients", status: "done" },
    { title: "Bake cookies (3 batches)", status: "doing" },
    { title: "Print posters", status: "todo" },
    { title: "Table duty 10-12", status: "todo" },
    { title: "Collect payments", status: "todo" },
  ],
});

console.log("\n✅ SEED COMPLETE");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Logins (all use: password123)");
console.log("  Admin (1):  admin@skyline.edu");
console.log("  Admin (2):  admin@gmail.com   / 123456");
console.log("  Treasurer:  treasurer@skyline.edu");
console.log("  Member:     member@skyline.edu");
console.log("  New user:   newbie@skyline.edu");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
process.exit(0);