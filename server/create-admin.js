import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";

const args = process.argv.slice(2);
const [name, email, password] = args;

if (!name || !email || !password) {
  console.error("");
  console.error("Usage:");
  console.error('  node create-admin.js "Your Name" "you@email.com" "YourPassword"');
  console.error("");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("⚠️  User already exists:", email);
    console.log("   Role:", existing.role);
    console.log("   You can log in with this email + your chosen role.");
    process.exit(0);
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: "admin",
    duesPaid: true,
    membershipStatus: "active",
    membershipExpiry: new Date(Date.now() + 365 * 86400000),
  });

  console.log("");
  console.log("🎉 Admin account created successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Name:  ", user.name);
  console.log("  Email: ", user.email);
  console.log("  Role:  ", user.role);
  console.log("  ID:    ", user._id.toString());
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("👉 Now log in at http://localhost:5173/login");
  console.log("   → Select 'Admin' role");
  console.log("   → Enter email + password");
  console.log("");

  process.exit(0);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exit(1);
}