import cron from "node-cron";
import User from "./models/User.js";
import Event from "./models/Event.js";
import Ticket from "./models/Ticket.js";
import Fundraiser from "./models/Fundraiser.js";
import { sendMail } from "./utils/mailer.js";
import {
  renewalReminderEmail,
  eventReminderEmail,
  eventThankYouEmail,
  monthlyDigestEmail,
  duesReminderEmail,
} from "./utils/emailTemplates.js";

export function startCron() {
  // 1) Renewal check — daily at 9 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Renewal check...");
    const in30 = new Date(Date.now() + 30 * 86400000);
    const expiring = await User.find({
      membershipStatus: "active",
      membershipExpiry: { $gte: new Date(), $lte: in30 },
    });
    for (const u of expiring) {
      await sendMail({ to: u.email, ...renewalReminderEmail(u) });
    }
    console.log(`Sent ${expiring.length} renewal reminders`);
  });

  // 2) Event reminder (T-24h) — every hour
  cron.schedule("0 * * * *", async () => {
    const now = new Date();
    const in24 = new Date(now.getTime() + 24 * 3600 * 1000);
    const in25 = new Date(now.getTime() + 25 * 3600 * 1000);

    const events = await Event.find({
      eventDate: { $gte: in24, $lte: in25 },
    });
    if (events.length === 0) return;

    for (const event of events) {
      const tickets = await Ticket.find({ event: event._id }).populate(
        "user",
        "name email"
      );
      for (const t of tickets) {
        if (t.user?.email) {
          await sendMail({
            to: t.user.email,
            ...eventReminderEmail(t.user, event, t),
          });
        }
      }
    }
    console.log(`Sent event reminders for ${events.length} events`);
  });

  // 3) Event thank-you (T+1 day) — daily at 10 AM
  cron.schedule("0 10 * * *", async () => {
    const yesterdayStart = new Date(Date.now() - 2 * 86400000);
    const yesterdayEnd = new Date(Date.now() - 86400000);

    const events = await Event.find({
      eventDate: { $gte: yesterdayStart, $lte: yesterdayEnd },
    });
    for (const event of events) {
      const tickets = await Ticket.find({
        event: event._id,
        checkedIn: true,
      }).populate("user", "name email");
      for (const t of tickets) {
        if (t.user?.email) {
          await sendMail({
            to: t.user.email,
            ...eventThankYouEmail(t.user, event),
          });
        }
      }
    }
    console.log(`Sent thank-yous for ${events.length} events`);
  });

  // 4) Monthly digest — 1st of month at 8 AM
  cron.schedule("0 8 1 * *", async () => {
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    const newMembers = await User.countDocuments({
      createdAt: { $gte: monthAgo },
    });
    const totalMembers = await User.countDocuments();
    const upcomingEvents = await Event.find({
      eventDate: { $gte: new Date() },
    }).limit(5);
    const activeFundraisers = await Fundraiser.countDocuments({
      status: "active",
    });

    const stats = { newMembers, totalMembers, upcomingEvents, activeFundraisers };
    const users = await User.find().select("email name");
    for (const u of users) {
      await sendMail({ to: u.email, ...monthlyDigestEmail(u, stats) });
    }
    console.log(`Sent monthly digest to ${users.length} members`);
  });

  // 5) Dues reminders — every Monday at 9 AM
  cron.schedule("0 9 * * 1", async () => {
    try {
      console.log("⏰ Weekly dues reminder check...");
      const unpaid = await User.find({
        duesPaid: false,
        role: { $in: ["member", "volunteer"] },
        email: { $exists: true, $ne: "" },
      });

      if (unpaid.length === 0) {
        console.log("✅ Everyone has paid their dues");
        return;
      }

      const amount = 500;
      let sent = 0;
      for (const user of unpaid) {
        try {
          await sendMail({
            to: user.email,
            ...duesReminderEmail(user, amount),
          });
          sent++;
        } catch (err) {
          console.error(`Failed for ${user.email}:`, err.message);
        }
      }

      await User.updateMany(
        { _id: { $in: unpaid.map((u) => u._id) } },
        { lastDuesReminderAt: new Date() }
      );

      console.log(
        `📧 Sent dues reminders to ${sent}/${unpaid.length} unpaid members`
      );
    } catch (err) {
      console.error("Cron dues reminder error:", err);
    }
  });

  console.log("⏰ Cron started (5 schedules)");
}