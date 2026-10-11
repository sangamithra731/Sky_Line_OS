// ============================================================
//  SKYLINE EMAIL TEMPLATES — Professional design
// ============================================================

const baseLayout = ({ title, preheader = "", content, footerNote = "" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">

    <tr><td style="height:6px;background:linear-gradient(90deg,#6366f1 0%,#8b5cf6 50%,#10b981 100%);"></td></tr>

    <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#6366f1 100%);padding:36px 40px;text-align:center;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center">
          <div style="display:inline-block;width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:18px;line-height:64px;font-size:32px;margin-bottom:14px;">🎓</div>
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Skyline Student Association</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.3px;text-transform:uppercase;font-weight:600;">Your club, upgraded</p>
        </td></tr>
      </table>
    </td></tr>

    <tr><td style="height:1px;background:#e2e8f0;"></td></tr>

    <tr><td style="padding:40px 40px 32px;color:#334155;font-size:15px;line-height:1.7;">
      ${content}
    </td></tr>

    ${footerNote ? `
    <tr><td style="padding:0 40px 32px;">
      <div style="background:#f8fafc;border-left:4px solid #6366f1;padding:14px 18px;border-radius:8px;font-size:13px;color:#475569;">
        ${footerNote}
      </div>
    </td></tr>` : ""}

    <tr><td style="padding:0 40px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>

    <tr><td style="padding:28px 40px;background:#f8fafc;text-align:center;">
      <p style="margin:0 0 10px;font-size:13px;color:#64748b;font-weight:600;">Skyline Student Association</p>
      <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">Empowering campus clubs, one platform at a time.</p>
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;line-height:1.5;">
        You're receiving this because you're a member of Skyline.<br>
        © ${new Date().getFullYear()} Skyline Student Association · All rights reserved
      </p>
    </td></tr>

  </table>

  <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
    Sent with 💜 from the Skyline Team
  </p>

</td></tr>
</table>
</body>
</html>
`;

// ============================================================
//  REUSABLE COMPONENTS
// ============================================================

const btn = (href, text) => `
<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td style="border-radius:12px;background:linear-gradient(135deg,#4f46e5,#7c3aed);box-shadow:0 6px 20px rgba(79,70,229,0.3);">
    <a href="${href}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.2px;">${text} →</a>
  </td></tr>
</table>`;

const card = (rows) => `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin:20px 0;">
  <tr><td style="padding:20px 22px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${rows}
    </table>
  </td></tr>
</table>`;

const row = (label, value) => `
<tr>
  <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">${label}</td>
  <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;text-align:right;">${value}</td>
</tr>`;

const h2 = (text) => `<h2 style="margin:0 0 16px;color:#0f172a;font-size:22px;font-weight:700;letter-spacing:-0.3px;line-height:1.3;">${text}</h2>`;
const p = (text) => `<p style="margin:0 0 14px;color:#475569;font-size:15px;line-height:1.7;">${text}</p>`;
const badge = (text, color = "indigo") => {
  const colors = {
    indigo: "background:#eef2ff;color:#4338ca;",
    green: "background:#ecfdf5;color:#047857;",
    amber: "background:#fffbeb;color:#b45309;",
    red: "background:#fef2f2;color:#b91c1c;",
  };
  return `<span style="display:inline-block;${colors[color]}padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">${text}</span>`;
};
const divider = `<div style="height:1px;background:#e2e8f0;margin:24px 0;"></div>`;

// ============================================================
//  TEMPLATES
// ============================================================

export const welcomeEmail = (user) => ({
  subject: `🎉 Welcome to Skyline, ${user.name.split(" ")[0]}!`,
  html: baseLayout({
    title: "Welcome to Skyline",
    preheader: `Welcome aboard, ${user.name.split(" ")[0]}! Here's how to get started.`,
    content: `
      ${h2(`Welcome aboard, ${user.name.split(" ")[0]}! 🎉`)}
      ${p(
        user.role === "volunteer"
          ? "Thanks for stepping up as a volunteer! You'll be able to help organize events, create fundraisers, and make campus life better."
          : user.role === "treasurer"
          ? "Welcome aboard as a treasurer! You'll have access to the club's financial dashboard, reimbursement approvals, and analytics."
          : "We're thrilled to have you in the Skyline Student Association. You've joined a community of students who build events, run fundraisers, and make campus life better."
      )}
      ${divider}
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Your account</p>
      ${card(`
        ${row("Name", user.name)}
        ${row("Email", user.email)}
        ${row("Role", `<span style="text-transform:capitalize;font-weight:600;">${user.role}</span>`)}
        ${row("Status", badge("Pending dues", "amber"))}
      `)}
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">What you can do now</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">📅 &nbsp;Browse and register for upcoming events</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🎟️ &nbsp;Get tickets with member discounts</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🛍️ &nbsp;Shop exclusive club merch</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">📢 &nbsp;Stay updated with announcements</td></tr>
      </table>
      ${btn("http://localhost:5173/", "Go to Dashboard")}
      ${p("Pay your dues to unlock member discounts on tickets and merch.")}
    `,
    footerNote: "💡 Tip: Add your favorite events to your calendar — you'll get a reminder email before each one.",
  }),
});

export const loginNotificationEmail = (user) => ({
  subject: `🔐 New sign-in to your Skyline account`,
  html: baseLayout({
    title: "New sign-in",
    preheader: `A new sign-in was detected on your Skyline account.`,
    content: `
      ${h2(`Hi ${user.name.split(" ")[0]},`)}
      ${p("We noticed a new sign-in to your Skyline account.")}
      ${card(`
        ${row("Time", new Date().toLocaleString())}
        ${row("Account", user.email)}
        ${row("Role", `<span style="text-transform:capitalize;">${user.role}</span>`)}
        ${row("Status", badge("Verified", "green"))}
      `)}
      ${p("If this was you, no action is needed. If you didn't sign in, please reset your password immediately.")}
      ${btn("http://localhost:5173/", "Open Skyline")}
    `,
    footerNote: "🔒 Security tip: Never share your password. Skyline will never ask for it via email.",
  }),
});

export const renewalReminderEmail = (user) => {
  const days = Math.ceil((new Date(user.membershipExpiry) - new Date()) / 86400000);
  return {
    subject: `⏰ Your Skyline membership expires in ${days} days`,
    html: baseLayout({
      title: "Membership renewal",
      preheader: `Renew now to keep your member perks.`,
      content: `
        ${h2(`Don't lose your perks, ${user.name.split(" ")[0]}!`)}
        ${p(`Your Skyline membership expires on <strong>${new Date(user.membershipExpiry).toDateString()}</strong> — that's just <strong>${days} days away</strong>.`)}
        ${card(`
          ${row("Expires on", new Date(user.membershipExpiry).toDateString())}
          ${row("Days remaining", badge(`${days} days`, days < 7 ? "red" : "amber"))}
        `)}
        ${divider}
        <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Renew to keep</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
          <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🎟️ &nbsp;Member-only ticket discounts (up to 40% off)</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🛍️ &nbsp;Reduced prices on hoodies, tees, and caps</td></tr>
          <tr><td style="padding:6px 0;font-size:14px;color:#475569;">📢 &nbsp;Priority access to event announcements</td></tr>
        </table>
        ${btn("http://localhost:5173/", "Renew Membership")}
      `,
      footerNote: "🎁 Renewing is easy — just visit the club desk or pay online in seconds.",
    }),
  };
};

export const ticketReceiptEmail = (user, event, ticket) => ({
  subject: `🎟️ Your ticket for ${event.title}`,
  html: baseLayout({
    title: "Ticket confirmed",
    preheader: `You're going to ${event.title}!`,
    content: `
      ${h2(`You're going! 🎉`)}
      ${p(`Hi ${user.name.split(" ")[0]}, your ticket is confirmed. See you at ${event.title}.`)}
      ${card(`
        ${row("Event", event.title)}
        ${row("Date", new Date(event.eventDate || event.date).toDateString())}
        ${row("Venue", event.venue)}
        ${row("Ticket type", ticket.ticketType)}
        ${row("Amount paid", `$${ticket.price.toFixed(2)}`)}
        ${row("Ticket ID", `<span style="font-family:monospace;font-size:12px;color:#6366f1;">${ticket._id.toString().slice(-8).toUpperCase()}</span>`)}
      `)}
      ${btn("http://localhost:5173/events", "View Ticket & QR")}
      ${p("Show the QR code from the event page at the entrance. No printing needed.")}
    `,
    footerNote: "📱 Tip: Add the QR code to your phone's wallet for quick access on the night.",
  }),
});

export const announcementEmail = (a) => ({
  subject: `📢 ${a.title}`,
  html: baseLayout({
    title: a.title,
    preheader: a.body.substring(0, 100),
    content: `
      ${badge("📢 Announcement", "indigo")}
      <h2 style="margin-top:16px;color:#0f172a;font-size:22px;font-weight:700;">${a.title}</h2>
      <div style="height:3px;width:60px;background:linear-gradient(90deg,#4f46e5,#10b981);border-radius:2px;margin:16px 0 24px;"></div>
      <div style="color:#334155;font-size:15px;line-height:1.8;white-space:pre-wrap;">${a.body}</div>
      ${divider}
      ${btn("http://localhost:5173/announcements", "View All Announcements")}
    `,
    footerNote: "🔔 You're receiving this because you're a member of Skyline Student Association.",
  }),
});

export const duesPaidEmail = (user) => ({
  subject: `✅ Dues received — welcome to Skyline membership!`,
  html: baseLayout({
    title: "Membership active",
    preheader: `Your membership is now active. Enjoy your perks!`,
    content: `
      ${badge("✅ Active member", "green")}
      ${h2(`You're officially a member, ${user.name.split(" ")[0]}! 🎉`)}
      ${p("We've received your dues payment. Your membership is now active — welcome to the Skyline community.")}
      ${card(`
        ${row("Status", badge("Active", "green"))}
        ${row("Valid until", user.membershipExpiry ? new Date(user.membershipExpiry).toDateString() : "1 year from now")}
      `)}
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">You just unlocked</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🎟️ &nbsp;Member-only ticket discounts (up to 40% off)</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🛍️ &nbsp;Reduced merch prices</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">📢 &nbsp;Priority announcements</td></tr>
      </table>
      ${btn("http://localhost:5173/", "Explore Member Perks")}
    `,
    footerNote: "🎉 Thanks for being part of Skyline. Tell a friend — bring them to the next event!",
  }),
});

export const reimbursementApprovedEmail = (user, r) => ({
  subject: `💰 Your reimbursement has been approved`,
  html: baseLayout({
    title: "Reimbursement approved",
    preheader: `Your $${r.amount.toFixed(2)} claim has been approved.`,
    content: `
      ${badge("💰 Approved", "green")}
      ${h2(`Good news, ${user.name.split(" ")[0]}!`)}
      ${p("Your reimbursement claim has been reviewed and approved. You'll receive the payment in the next club cycle.")}
      ${card(`
        ${row("Amount", `<span style="color:#047857;font-size:18px;font-weight:700;">$${r.amount.toFixed(2)}</span>`)}
        ${row("Description", r.description)}
        ${row("Status", badge("Approved", "green"))}
      `)}
      ${btn("http://localhost:5173/reimbursements", "View Claim")}
    `,
    footerNote: "💡 Tip: Keep your receipts! You can now upload a photo directly when submitting claims.",
  }),
});

export const eventReminderEmail = (user, event, ticket) => ({
  subject: `⏰ Reminder: ${event.title} is tomorrow!`,
  html: baseLayout({
    title: "Event tomorrow",
    preheader: `${event.title} is happening tomorrow at ${event.venue}.`,
    content: `
      ${badge("⏰ Tomorrow", "amber")}
      ${h2(`Your event is tomorrow, ${user.name.split(" ")[0]}!`)}
      ${p(`Just a friendly reminder — <strong>${event.title}</strong> is happening tomorrow.`)}
      ${card(`
        ${row("Event", event.title)}
        ${row("Date", new Date(event.eventDate || event.date).toDateString())}
        ${row("Venue", event.venue)}
        ${row("Ticket type", ticket.ticketType)}
      `)}
      ${btn("http://localhost:5173/events", "Open My Ticket QR")}
      ${p("Show your QR code at the door. No printing required.")}
    `,
    footerNote: "📱 Tip: Save your QR code to your phone's wallet for quick access.",
  }),
});

export const eventThankYouEmail = (user, event) => ({
  subject: `🙏 Thanks for coming to ${event.title}!`,
  html: baseLayout({
    title: "Thank you",
    preheader: `We hope you enjoyed ${event.title}. Tell us what you think!`,
    content: `
      ${badge("✅ Attended", "green")}
      ${h2(`Thanks for coming, ${user.name.split(" ")[0]}!`)}
      ${p(`We hope you enjoyed <strong>${event.title}</strong>. Your presence made it special.`)}
      ${card(`
        ${row("Event", event.title)}
        ${row("Date", new Date(event.eventDate || event.date).toDateString())}
        ${row("Venue", event.venue)}
      `)}
      ${divider}
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Help us improve</p>
      ${p("Take a 30-second survey and help us plan even better events.")}
      ${btn("http://localhost:5173/events", "Take Survey")}
    `,
    footerNote: "💜 See you at the next Skyline event!",
  }),
});

export const passwordResetEmail = (user, resetUrl) => ({
  subject: `🔑 Reset your Skyline password`,
  html: baseLayout({
    title: "Password reset",
    preheader: "Click the link to reset your password. Valid for 1 hour.",
    content: `
      ${badge("🔒 Security", "red")}
      ${h2(`Password reset requested`)}
      ${p(`Hi ${user.name.split(" ")[0]}, we received a request to reset your Skyline password.`)}
      ${p("Click the button below to create a new password. This link expires in 1 hour.")}
      ${btn(resetUrl, "Reset Password")}
      ${p("If you didn't request this, you can safely ignore this email — your password won't change.")}
    `,
    footerNote: "⚠️ If you didn't request this, contact your club admin immediately.",
  }),
});

export const monthlyDigestEmail = (user, stats) => ({
  subject: `📊 Your Skyline monthly recap — ${new Date().toLocaleString("en", { month: "long" })}`,
  html: baseLayout({
    title: "Monthly digest",
    preheader: `${stats.newMembers} new members, ${stats.upcomingEvents.length} upcoming events.`,
    content: `
      ${badge("📊 Monthly Recap", "indigo")}
      ${h2(`Hi ${user.name.split(" ")[0]}, here's your monthly update`)}
      ${p("A quick snapshot of what happened at Skyline this month.")}
      ${card(`
        ${row("New members joined", `<span style="color:#047857;font-weight:700;">+${stats.newMembers}</span>`)}
        ${row("Upcoming events", stats.upcomingEvents.length)}
        ${row("Fundraisers active", stats.activeFundraisers)}
        ${row("Total members", stats.totalMembers)}
      `)}
      ${
        stats.upcomingEvents.length > 0
          ? `
        ${divider}
        <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Coming up</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
          ${stats.upcomingEvents
            .slice(0, 3)
            .map(
              (e) =>
                `<tr><td style="padding:8px 0;font-size:14px;color:#475569;">📅 &nbsp;<strong>${e.title}</strong> — ${new Date(e.eventDate || e.date).toDateString()}</td></tr>`
            )
            .join("")}
        </table>
      `
          : ""
      }
      ${btn("http://localhost:5173/events", "View All Events")}
    `,
    footerNote: "📬 You get this digest on the 1st of every month. Reply to unsubscribe.",
  }),
});

export const lowStockAlertEmail = (admin, product, size, remaining) => ({
  subject: `⚠️ Low stock: ${product.name} (size ${size})`,
  html: baseLayout({
    title: "Low stock alert",
    preheader: `Only ${remaining} left of ${product.name} in size ${size}.`,
    content: `
      ${badge("⚠️ Low stock", "red")}
      ${h2(`Heads up, ${admin.name.split(" ")[0]}`)}
      ${p(`A recent order has dropped stock for a popular size. Consider restocking.`)}
      ${card(`
        ${row("Product", product.name)}
        ${row("Size", `<span style="font-weight:700;">${size}</span>`)}
        ${row("Remaining", `<span style="color:#b91c1c;font-weight:700;">${remaining} left</span>`)}
      `)}
      ${btn("http://localhost:5173/merch", "Manage Stock")}
    `,
    footerNote: "🔔 You're receiving this because you're a club admin.",
  }),
});

export const fundraiserMilestoneEmail = (fundraiser, milestone) => ({
  subject:
    milestone === 100
      ? `🎉 WE HIT OUR GOAL — ${fundraiser.name}!`
      : `🔥 ${fundraiser.name} is halfway there!`,
  html: baseLayout({
    title: "Fundraiser milestone",
    preheader:
      milestone === 100
        ? `We raised the full $${fundraiser.goal}!`
        : `We've hit 50% of our goal!`,
    content: `
      ${badge(milestone === 100 ? "🎉 Goal Reached!" : "🔥 50% Reached", "green")}
      ${h2(milestone === 100 ? `We did it! 🎉` : `Halfway there!`)}
      ${p(
        milestone === 100
          ? `Amazing news — <strong>${fundraiser.name}</strong> has reached its full goal of <strong>$${fundraiser.goal}</strong>. Thank you to everyone who contributed!`
          : `<strong>${fundraiser.name}</strong> just crossed 50% of its $${fundraiser.goal} goal. Let's keep the momentum going!`
      )}
      ${card(`
        ${row("Fundraiser", fundraiser.name)}
        ${row("Raised so far", `<span style="color:#047857;font-weight:700;">$${fundraiser.raised}</span>`)}
        ${row("Goal", `$${fundraiser.goal}`)}
        ${row("Progress", `<span style="color:#6366f1;font-weight:700;">${Math.round((fundraiser.raised / fundraiser.goal) * 100)}%</span>`)}
      `)}
      ${btn("http://localhost:5173/fundraiser", "View Fundraiser")}
    `,
    footerNote: "💜 Every dollar counts. Thank you for supporting Skyline!",
  }),
});

export const newMemberAlertEmail = (admin, newUser) => ({
  subject: `🆕 New member joined: ${newUser.name}`,
  html: baseLayout({
    title: "New member",
    preheader: `${newUser.name} just signed up as a ${newUser.role}.`,
    content: `
      ${badge("🆕 New member", "indigo")}
      ${h2(`Welcome aboard, ${newUser.name.split(" ")[0]}!`)}
      ${p(`A new member just signed up for Skyline.`)}
      ${card(`
        ${row("Name", newUser.name)}
        ${row("Email", newUser.email)}
        ${row("Role", `<span style="text-transform:capitalize;">${newUser.role}</span>`)}
        ${row("Status", badge("Pending dues", "amber"))}
      `)}
      ${p("You can mark their dues as paid once received.")}
      ${btn("http://localhost:5173/members", "Manage Members")}
    `,
    footerNote: "🔔 You're receiving this because you're a club admin.",
  }),
});

export const roleChangedEmail = (user, oldRole, newRole) => ({
  subject: `🎉 Your role changed: ${oldRole} → ${newRole}`,
  html: baseLayout({
    title: "Role updated",
    preheader: `You've been promoted to ${newRole}.`,
    content: `
      ${badge("🎉 Role updated", "green")}
      ${h2(`Congratulations, ${user.name.split(" ")[0]}!`)}
      ${p(`Your role at Skyline has been updated.`)}
      ${card(`
        ${row("Previous role", `<span style="text-transform:capitalize;">${oldRole}</span>`)}
        ${row("New role", `<span style="text-transform:capitalize;color:#047857;font-weight:700;">${newRole}</span>`)}
      `)}
      ${newRole === "treasurer" ? p("You now have access to the Finance and Analytics dashboards.") : ""}
      ${newRole === "admin" ? p("You now have full administrative access — create events, post announcements, and manage the club.") : ""}
      ${newRole === "volunteer" ? p("You can now create fundraisers and coordinate tasks.") : ""}
      ${btn("http://localhost:5173/", "Open Dashboard")}
    `,
    footerNote: "💜 Thanks for stepping up!",
  }),
});

export const ticketRefundEmail = (user, event, amount) => ({
  subject: `💸 Refund processed for ${event.title}`,
  html: baseLayout({
    title: "Refund processed",
    preheader: `Your refund of $${amount.toFixed(2)} has been processed.`,
    content: `
      ${badge("💸 Refund processed", "indigo")}
      ${h2(`Refund confirmed`)}
      ${p(`Hi ${user.name.split(" ")[0]}, your refund for ${event.title} has been processed.`)}
      ${card(`
        ${row("Event", event.title)}
        ${row("Refund amount", `<span style="color:#047857;font-weight:700;">$${amount.toFixed(2)}</span>`)}
        ${row("Status", badge("Processed", "green"))}
      `)}
      ${p("The amount will appear in your account within 5-7 business days.")}
    `,
    footerNote: "❓ Questions? Reply to this email and we'll help.",
  }),
});

export const customEmailTemplate = ({
  subject,
  message,
  senderName,
  clubName = "Skyline Student Association",
}) => ({
  subject: subject,
  html: baseLayout({
    title: subject,
    preheader: message.substring(0, 100),
    content: `
      ${h2(subject)}
      <div style="color:#334155;font-size:15px;line-height:1.8;white-space:pre-wrap;">${message}</div>
      ${divider}
      <p style="color:#64748b;font-size:13px;">— ${senderName}, ${clubName}</p>
    `,
    footerNote: "This email was sent by your club admin.",
  }),
});
export const duesReminderEmail = (user, amount = 500, deadline = null) => ({
  subject: `💰 Friendly reminder: ${amount}$ club dues pending`,
  html: baseLayout({
    title: "Dues reminder",
    preheader: `Your club dues are still pending. Please pay ${amount}$.`,
    content: `
      ${badge("💰 Dues Pending", "amber")}
      ${h2(`Hi ${user.name.split(" ")[0]}, your dues are pending`)}
      ${p("We noticed you haven't paid your club membership dues yet. Paying unlocks member-only benefits.")}
      ${card(`
        ${row("Amount owed", `<span style="color:#b45309;font-size:18px;font-weight:700;">$${amount}</span>`)}
        ${row("Status", badge("Pending", "amber"))}
        ${deadline ? row("Deadline", new Date(deadline).toDateString()) : ""}
        ${row("Member since", new Date(user.createdAt).toLocaleDateString())}
      `)}
      ${divider}
      <p style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">What you unlock once paid</p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 16px;">
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🎟️ &nbsp;Member-only ticket discounts (up to 40% off)</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🛍️ &nbsp;Reduced prices on all merch</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">📢 &nbsp;Priority announcements</td></tr>
        <tr><td style="padding:6px 0;font-size:14px;color:#475569;">🎁 &nbsp;Invites to members-only events</td></tr>
      </table>
      ${btn("http://localhost:5173/profile", "View My Profile")}
      ${p("Pay at the club desk, or contact any admin. Once received, we'll mark your account as paid.")}
      ${p("Already paid? Please ignore this email — our records may just be a bit behind.")}
    `,
    footerNote: "💜 Thanks for being part of Skyline. Any questions? Reply to this email.",
  }),
});