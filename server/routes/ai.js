import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Transaction from "../models/Transaction.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// ---- Smart fallback: answer common questions from DB ----
async function fallbackAnswer(message) {
  const msg = message.toLowerCase().trim();
  const events = await Event.find().sort({ date: 1 }).limit(10);
  const members = await User.countDocuments();
  const txs = await Transaction.find();
  const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // Greetings
  if (msg.match(/^(hi|hello|hey|yo|hola|namaste)\b/)) {
    return "Hi! 👋 I'm the Skyline assistant. Ask me about events, finances, or members!";
  }

  // Thanks
  if (msg.match(/thank|thx|thanks|ty\b/)) {
    return "You're welcome! 🎉 Anything else I can help with?";
  }

  // OK / got it / fine
  if (msg.match(/^(ok|okay|k|got it|alright|fine|cool|nice|great|good)$/)) {
    return "👍 Let me know if you need anything — events, finances, or member info!";
  }

  // Help
  if (msg.match(/help|what can you|what do you|capabilities/)) {
    return (
      "Here's what I can do:\n" +
      "• 📅 List upcoming events\n" +
      "• 💰 Show club finances & balance\n" +
      "• 👥 Count members\n" +
      "• 🎟️ Check ticket availability\n\n" +
      "Just ask!"
    );
  }

  // Events
  if (msg.match(/event|upcoming|happening|this week|schedule|calendar|next/)) {
    if (events.length === 0) return "There are no upcoming events right now. Check back soon! 📅";
    return (
      "📅 Upcoming events:\n" +
      events.slice(0, 5).map((e) => `• **${e.title}** — ${e.date.toDateString()} at ${e.venue}`).join("\n")
    );
  }

  // Finance
  if (msg.match(/balance|money|fund|budget|raise|income|expense|financ|dollar|cost/)) {
    return (
      `💰 Current club finances:\n` +
      `• Income: **$${income.toFixed(2)}**\n` +
      `• Expenses: **$${expense.toFixed(2)}**\n` +
      `• Balance: **$${balance.toFixed(2)}**`
    );
  }

  // Members
  if (msg.match(/member|how many|count|people|user|join/)) {
    return `👥 We currently have **${members}** registered members. 🎓`;
  }

  // Tickets
  if (msg.match(/ticket|attend|seat|gala|buy/)) {
    const gala = events.find((e) => e.title.toLowerCase().includes("gala"));
    if (gala) {
      return `🎟️ **${gala.title}** has **${gala.capacity - gala.ticketsSold}** tickets left out of ${gala.capacity}. Get yours on the Events page!`;
    }
    return "Check the Events page to buy tickets! 🎟️";
  }

  // Bye
  if (msg.match(/bye|goodbye|see you|later/)) {
    return "See you soon! 👋";
  }

  // Who are you
  if (msg.match(/who are you|your name|about you/)) {
    return "I'm the Skyline Student Association assistant ✨ I help members and admins with club info.";
  }

  // Currency question
  if (msg.match(/how much|total|revenue|earn/)) {
    return `We've earned **$${income.toFixed(2)}** in total and spent **$${expense.toFixed(2)}**. Net balance: **$${balance.toFixed(2)}** 💰`;
  }

  // Generic — but less repetitive
  return (
    `I'm not sure I got that one 🤔 Here's a quick snapshot:\n\n` +
    `👥 **${members}** members\n` +
    `💰 Balance: **$${balance.toFixed(2)}**\n` +
    `📅 **${events.length}** upcoming events\n\n` +
    `Try asking: "upcoming events", "balance", or "how many members?"`
  );
}

router.post("/chat", auth, async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.json({ reply: "Ask me something! 😊" });
  }

  // Try Gemini first
  try {
    const key = process.env.GEMINI_KEY;
    if (!key || key.includes("YOUR_") || key.length < 20) {
      throw new Error("No valid Gemini key");
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const events = await Event.find().limit(10);
    const users = await User.countDocuments();
    const txs = await Transaction.find();
    const income = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const context = `You are the Skyline Student Association assistant. Be friendly and concise. Use bullet points where helpful.
Club data:
- Total members: ${users}
- Upcoming events: ${events.map((e) => `${e.title} on ${e.date.toDateString()}`).join("; ")}
- Income: $${income}, Expenses: $${expense}, Balance: $${income - expense}
Answer the user's question using this data when relevant.`;

    const result = await model.generateContent(context + "\n\nUser: " + message);
    const reply = result.response.text();

    if (!reply || reply.trim().length === 0) throw new Error("Empty reply");
    return res.json({ reply, source: "gemini" });
  } catch (err) {
    console.error("Gemini failed, using fallback:", err.message);
    // Fallback: answer from DB
    try {
      const reply = await fallbackAnswer(message);
      return res.json({ reply, source: "fallback" });
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
      return res.json({
        reply: "I'm having a moment 😅 Try again in a sec.",
      });
    }
  }
});

export default router;