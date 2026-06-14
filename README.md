# ⚡ CSx CORE | Master Command Matrix 
<br>

<div align="center">
  <img src="https://img.shields.io/badge/STATUS-ONLINE-green?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/TIER-ENTERPRISE-blue?style=for-the-badge" alt="Tier" />
  <img src="https://img.shields.io/badge/ENVIRONMENT-DESKTOP_ONLY-red?style=for-the-badge" alt="Environment" />
  <br>
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" />
</div>

<br>

## 🌐 System Overview
**CSx CORE** is a high-performance, full-stack command center and advanced software engineering portfolio matrix. Built as a demonstration of elite-level full-stack architecture, this platform serves as both a public-facing technology showcase and a secure, heavily encrypted administrative dashboard.

### 🎯 Purpose & Scope
This system was engineered to break the mold of standard web portfolios. It demonstrates a deep understanding of data structures, real-time API telemetry, hardware-level view-port security, and continuous integration. It is designed specifically for computer science professionals, recruiters, and engineers who demand high-tier performance and cyber-aesthetic UI/UX.

---

## 🚀 Core Specialties & Advanced Features

* **🛡️ Architectural Hardware Lock (Mobile Firewall):** The system actively scans browser agents and screen geometry. Mobile operating systems and viewports below `1024px` are actively severed from the UI to preserve the heavy 3D rendering and complex desktop-class layouts.
* **📡 Real-Time Telemetry Engine:** The admin dashboard features a live polling engine that tracks API traffic, network latency, system environments, and live hardware resource approximations.
* **🧠 Neural Link Data Core:** Powered by Prisma ORM and PostgreSQL, featuring complex relational database structures linking Users, System Logs, Projects, and Secure Feedback environments.
* **🔐 Level-5 Cipher Gate:** The administrative backend is protected by a multi-layered authentication system, including invisible key-combination listeners and encrypted JWT session tokens.
* **✨ Momentum UI/UX:** Built with Framer Motion and custom CSS momentum scrolling, providing a buttery-smooth, native-application feel within the browser.

---

## 🛠️ The Technology Stack

### Frontend (The UI/UX Shell)
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS + custom CSS Matrix animations
* **Animation:** Framer Motion
* **Hosting:** Vercel Global Edge Network

### Backend (The Logic Engine)
* **Runtime:** Node.js + Express
* **Database:** PostgreSQL (Supabase Connection Pooler)
* **ORM:** Prisma
* **Hosting:** Render Web Services

---

## 💻 Local Deployment Protocol

To run the CSx Matrix on your local development environment, follow this strict ignition sequence.

### Prerequisites
* Node.js (v18 or higher)
* Git
* A local PostgreSQL server OR a Supabase database URL

### 1. Clone the Repository
```bash
git clone [https://github.com/NimnaOfficial/MyResearch.git](https://github.com/NimnaOfficial/MyResearch.git)
cd MyResearch
```

### 2. Ignite the Backend Logic Engine
Execute the following commands to initialize the Node.js runtime environment, install dependencies, and synchronize the ORM with your local PostgreSQL instance.

```bash
cd backend
npm install
```
Environment Variable Configuration:
Create a strict `.env` file at the root of the `/backend` directory. This securely holds your database connection strings and cryptographic keys for JWT generation.
```bash
PORT=5000
DATABASE_URL="postgresql://postgres:[PASSWORD]@localhost:5432/csx_core"
JWT_SECRET="your_super_secret_cipher_key"
```
Database Schema Synchronization & Seeding:
Compile the SQL tables directly from the Prisma schema and inject the baseline architectural data into the local data core.
```bash
npx prisma db push
npx prisma db seed
npm run dev
```
Status: <i>The Express API runtime is now actively listening and serving traffic on Port 5000.</i>

### 3. Bootstrap the Frontend Client Matrix
Open an independent terminal instance to isolate the Next.js client-side build process.
```bash
cd frontend
npm install
```
Environment Configuration:
Create a `.env.local file` in the `/frontend` directory. This variable routes all client-side telemetry and dynamic data fetches to your local backend engine.

```bash
NEXT_PUBLIC_API_URL="http://localhost:5000"
```
