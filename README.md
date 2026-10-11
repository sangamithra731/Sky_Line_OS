# 🎓 Skyline — Student Organization System

> **One unified platform for members, events, tickets, merch, and money.**

Skyline is a full-stack web application that replaces the chaos of running a student club — spreadsheets, notebooks, WhatsApp groups, and paper tickets — with one modern, AI-powered platform.

![Skyline Banner](https://img.shields.io/badge/Skyline-Student%20Club%20OS-4f46e5?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?style=flat-square&logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 🎯 The Problem

Student organizations face real, everyday problems:

| How things run today | The pain |
|----------------------|----------|
| 📊 Member signups in spreadsheets | Nobody knows who's paid dues |
| 🎟️ Paper tickets sold at the door | Long queues, manual counting, no tracking |
| 📓 Club budget in a notebook | Money goes missing, no visibility |
| 💬 Announcements via WhatsApp | Messages get lost in chats |
| 🧾 Volunteer expenses chased by receipts | Reimbursement nightmares |

**Members lose track of events, money goes missing, and nobody knows who still owes what.**

---

## 💡 The Solution

**Skyline** is a single platform where every part of running a club lives:

- 👥 **Member Management** — Digital signups, dues tracking, auto-renewal reminders
- 📅 **Event Tickets** — Online sales, member pricing, capacity limits
- 📱 **QR Check-In** — Scan tickets in 2 seconds. No printed lists.
- 🛍️ **Merch Store** — Sizes, stock, orders, member discounts
- 📢 **Announcements** — One post reaches everyone via app + email
- 🎯 **Fundraiser Boards** — Kanban tasks with assignees and due dates
- 🧾 **Reimbursements** — Submit receipts, treasurer approves in one click
- 💰 **Finance Dashboard** — Every dollar in, every dollar out, at a glance
- 📊 **Analytics** — Growth, events, members, money — 5 deep-insight tabs
- 🤖 **AI Assistant** — Ask questions in plain English, get answers from live data

---

## ✨ Feature Highlights

### 👑 Role-Based Access (4 Roles)

| Role | What They Can Do |
|------|------------------|
| 🎓 **Member** | Join events, buy tickets, shop merch, view portfolio |
| 💚 **Volunteer** | Everything a member can + create fundraisers, submit claims |
| 💰 **Treasurer** | Manage finances, approve reimbursements, view analytics |
| 👑 **Admin** | Full control — create events, post announcements, manage users, send emails |

### 🎟️ Complete Ticket Lifecycle

1. **Event created** by admin with custom banner, rules, eligibility, tech requirements
2. **Ticket reserved** by member — sees UPI details + QR code
3. **Payment submitted** with screenshot proof
4. **Admin confirms** payment → QR activated + email receipt
5. **Staff scans QR** at door → instant check-in with live attendance

### 📧 16 Automated Email Triggers

- Welcome on signup
- Login notification (security)
- Ticket receipt with QR info
- Announcement broadcasts to all members
- Dues paid confirmation
- Reimbursement approved
- Renewal reminders (30 days before expiry)
- Event reminders (T-24h)
- Event thank-you (T+1 day)
- Monthly digest (1st of month)
- Low stock alerts
- Fundraiser milestone (50%, 100%)
- New member alert to admins
- Role changed notification
- Ticket refund confirmation
- Custom admin emails

### 🏆 Student Portfolio & Certificates

Every member has a personal portfolio page showing:
- Certificates earned (with downloadable PDF certificates)
- Events attended
- Upcoming events
- Fundraisers participated in
- Member since, dues status, role

Admins can issue certificates for:
- Participation
- Achievement
- Completion
- Winner (with position e.g. "1st Place")
- Volunteer

### 🤖 AI Assistant (Google Gemini)

Floating chat assistant answers questions using **live club data**:
- *"How many members do we have?"*
- *"What's our current balance?"*
- *"What events are coming up?"*
- *"How much did we raise this month?"*

Smart fallback ensures it always responds, even if the AI is unavailable.

### 🔐 Security

- JWT-based authentication
- bcrypt password hashing
- Role-based route protection (frontend + backend)
- Password reset (no time limit, admin-triggerable)
- Secure file uploads via Cloudinary

### 🎨 Modern UI

- **Dark mode** with system preference detection
- **Fully responsive** — works on phones, tablets, laptops
- **Beautiful gradients** and smooth animations
- **Premium dashboard** with charts (Recharts)
- **Real-time notifications** via Socket.io

---

## 🏗️ Tech Stack

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for charts
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Socket.io Client** for real-time
- **html5-qrcode** for QR scanning
- **jsPDF** for PDF generation

### Backend
- **Node.js 20** with ES modules
- **Express** for the API
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** + **Cloudinary** for file uploads
- **Nodemailer** for emails
- **node-cron** for scheduled jobs
- **Socket.io** for real-time events
- **@google/generative-ai** for Gemini AI
- **QRCode** for QR generation

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (20 recommended)
- MongoDB (local or Atlas)
- Cloudinary account (free tier)
- Google Gemini API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/skyline-club.git
cd skyline-club
