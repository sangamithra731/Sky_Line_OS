import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL || "*" },
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ============ ROUTE IMPORTS ============
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import ticketRoutes from "./routes/tickets.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import announcementRoutes from "./routes/announcements.js";
import transactionRoutes from "./routes/transactions.js";
import fundraiserRoutes from "./routes/fundraisers.js";
import aiRoutes from "./routes/ai.js";
import reimbursementRoutes from "./routes/reimbursements.js";
import dashboardRoutes from "./routes/dashboard.js";
import notificationRoutes from "./routes/notifications.js";
import analyticsRoutes from "./routes/analytics.js";
import uploadRoutes from "./routes/upload.js";
import emailRoutes from "./routes/emails.js";
import portfolioRoutes from "./routes/portfolio.js";

// ============ MOUNT ROUTES ============
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/fundraisers", fundraiserRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reimbursements", reimbursementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/portfolio", portfolioRoutes);

app.get("/", (req, res) => res.json({ status: "Skyline API running 🚀" }));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Disconnected:", socket.id));
});
app.set("io", io);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    httpServer.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("❌ Mongo error:", err));