# Cafe POS — Enterprise ☕🚀

A professional, high-performance Point of Sale (POS) and Restaurant Management System built with the modern web stack. This project provides a seamless, real-time ecosystem for multi-branch dining establishments, featuring mobile-first design, QR ordering, and a live Kitchen Display System.

## 🌟 Key Features

### 💻 Smart POS Terminal
- **Manual Table Occupancy**: Tables remain "Occupied" (Blue) after payment until staff explicitly clears them for the next guest.
- **Persistent Cart**: Handles complex orders with variants, special instructions, and real-time tax/total calculation.
- **Adaptive UI**: Automatically switches between a professional desktop grid and a mobile-responsive "Stack & Drawer" interface.

### 📱 Self-Ordering (QR Menu)
- **Table-Specific Tokens**: Generates unique scanning tokens for every table.
- **Digital Menu**: Guests can scan, browse, and place orders directly from their mobile browsers.
- **Pay-at-Table**: Full Razorpay integration allowing guests to settle the bill without waiting for a server.

### 🍳 Kitchen Display System (KDS)
- **Real-Time Pipelines**: Orders appear instantly via Socket.io.
- **Status Workflow**: Track orders from `SENT` → `PREPARING` → `READY` → `DELIVERED`.
- **Global Item Management**: Mark individual items or whole orders as ready with one click.

### 👤 Guest Directory (CRM)
- **Customer Profiles**: Automatically tracks order history and lifetime value based on phone numbers.
- **Analytics**: Database-driven insights into guest frequency and spending habits.

### 📊 Management & Analytics
- **Multi-Branch Support**: Manage multiple locations from a single dashboard.
- **Financial Reports**: Dynamic charts and tables for daily, weekly, and monthly revenue and tax reporting.
- **Role-Based Access**: Specialized views for Admins, Cashiers (Staff), and Kitchen Staff.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) with [Prisma ORM](https://www.prisma.io/)
- **Real-Time**: [Socket.io](https://socket.io/) for instant order syncing
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [Lenis](https://lenis.darkroom.engineering/) (Smooth Scroll)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Payments**: [Razorpay API](https://razorpay.com/)
- **Authentication**: JWT via Jose & BcryptJS

---

## 🚦 Getting Started

### Prerequisites
- Node.js 20.x
- A PostgreSQL Database (Recommended: Neon.tech)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PrathamKhawani/pos-cafe-app.git
   cd pos-cafe-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="your_postgresql_url"
   JWT_SECRET="your_secret_key"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
   RAZORPAY_KEY_ID="your_key"
   RAZORPAY_KEY_SECRET="your_secret"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Run the Development Servers:**
   - **App Server:** `npm run dev`
   - **Socket Server:** `npm run socket`

---

## 🏗️ Architecture Detail

- **Middleware**: Custom authentication middleware handles role-to-panel isolation (e.g., preventing Staff from accessing Admin panels).
- **Socket Engine**: A dedicated Node.js micro-server handles events like `NEW_ORDER`, `ORDER_STATUS_UPDATE`, and `PAYMENT_DONE` to keep all terminals synchronized.
- **UI Logic**: A modular component structure using premium design principles like Glassmorphism and micro-interactions.

---

## 🎨 Design Aesthetics
This project prioritizes **Premium Visual Excellence**. It utilizes tailored color palettes, modern typography (Inter), smooth gradients, and cinematic transitions to provide a high-end enterprise feel.

---

## 👤 Author
**Pratham Khawani**
*Full Stack Developer & Technical Architect*

---

## 📄 License
This project is for private enterprise use and educational demonstration.
