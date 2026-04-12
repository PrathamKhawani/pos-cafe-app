# Real-Time Next.js POS & Cafe Management System

A full-stack Point of Sale (POS) application built for cafes and fast-casual restaurants. Features real-time order tracking, comprehensive dashboard analytics, branch management, and a seamless customer self-ordering experience.

## Tech Stack
- **Frontend & API:** Next.js 14, React, Tailwind CSS
- **Database:** PostgreSQL (Neon Serverless) via Prisma ORM
- **Real-Time Engine:** Node.js, Socket.IO
- **State Management:** Zustand, SWR

## Features
- **Multi-Branch Support:** Real-time sync across different physical locations.
- **Customer Self-Ordering:** QR code-based menus where customers can place and track their orders live.
- **Kitchen Display System (KDS):** Live order pipeline using WebSockets for kitchen staff.
- **Admin Analytics:** Comprehensive, branch-aware reporting on revenue, top products, and overall growth.
- **Role-Based Access Control:** Separate securely-scoped dashboards for Admins, Managers, and Staff.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file referencing `.env.example` and supply your Neon DB URL and JWT Secret.

3. **Database Migration:**
   ```bash
   npx prisma db push
   # Optional: run seed to populate categories and products
   npm run db:seed
   ```

4. **Run the Socket Server (Terminal 1):**
   ```bash
   npm run socket
   ```

5. **Run the Next.js App (Terminal 2):**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.
