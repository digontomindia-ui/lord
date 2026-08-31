# LORD'S BESPOKE ALTERATION ERP

A production-grade MERN stack (MongoDB, Express, React, Node.js) web application serving as a multi-role ERP platform for a garment alteration business network.

## Architecture & Features

This system enforces strict role-based access control (RBAC), tenant isolation, and atomic financial ledgers to securely manage orders, wallets, and a multi-level referral network.

### 👥 The 5 Roles
1. **Super Admin**: Full visibility into system-wide financials, global ticket resolution, and network-wide health.
2. **Shop**: Customer-facing entry point. Creates orders, manages their shop's wallet, and tracks localized orders.
3. **Master**: The workshop head. Receives orders from the delivery network, assigns tailors, and performs Quality Control (QC).
4. **Tailor**: Executes the alteration work. Operates in a strictly isolated queue without access to customer PI.
5. **Delivery Boy**: Logistics agent for pickup and drop-off routing.

### 🔒 Security & Data Isolation
- **Tenant Scoping Middleware**: Database queries are automatically filtered by `shopId` or `masterId` based on the user's JWT. A Shop can physically never query another Shop's data.
- **Strict State Machine**: The `orderStateMachine` acts as an immutable transition guard. API requests are checked against an allowed-transitions matrix before any DB mutations occur.
- **Atomic Wallet Ledger**: The 4-bucket wallet system (Main, Growth, Today's Work, Reward) is managed through MongoDB transactions, preventing WriteConflicts and lost updates under concurrent load.

### 🚀 Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Zustand, Framer Motion
- **Backend**: Node.js, Express, MongoDB, Mongoose (with Transactions & Sessions)
- **Security**: JWT Access/Refresh tokens, bcryptjs, Helmet, Express-Rate-Limit

## 🐳 Deployment with Docker (Frontend + Backend + MongoDB)

To spin up the complete stack (MongoDB, Express Server, and React Client) in Docker with a single command:

```bash
docker-compose up --build -d
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000` (or proxied directly via `http://localhost:3000/api`)
- **MongoDB**: `localhost:27017`

To stop all running services:
```bash
docker-compose down
```

## ☁️ Cloud Deployment (Render / Railway)
- **Render**: Connect this repository to Render and use the included [`render.yaml`](file:///c:/Users/User/Downloads/-LORD-S-BESPOKE/render.yaml) Blueprint to auto-deploy the Node backend, React static frontend, and connect a MongoDB database.
- **Docker Compose / VPS / Railway**: Deploy the root `docker-compose.yml` to automatically provision all 3 services.

## Local Setup & Development

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local instance running on `127.0.0.1:27017` or Docker)

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `/server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/tailor_erp
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
```

### 4. Database Seeding
To test the system immediately, you can seed the database with the 5 default roles:
```bash
cd server
npm run seed
```

### 5. Start the Application
Run both the frontend and backend development servers.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## Testing
The backend features an automated regression test suite built with Jest and MongoDB Memory Server, specifically targeting race conditions in the State Machine and Wallet Service.

```bash
cd server
npm test
```

