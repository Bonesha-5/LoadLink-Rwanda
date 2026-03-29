# LoadLink Rwanda

A digital freight marketplace and escrow payment platform that connects shippers with verified transport companies across Rwanda.

---

## 🎥 Demo Video

**Shipper + Company:**  
https://www.loom.com/share/2629663396394a0982b07303eba326dd  

**Admin:**  
https://www.loom.com/share/dcc18895ff8848bf8687383e841581e2


## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Shipment Lifecycle](#shipment-lifecycle)


---

## Overview

LoadLink Rwanda is a full-stack web platform built to solve a real problem in Rwanda's freight industry — the lack of a structured, trusted marketplace between shippers and transport companies.

The platform allows:
- **Shippers** to post transport requests with cargo details, pricing, and pickup dates
- **Transport companies** to register their trucks, get verified by admin, and express interest in shipments
- **Admins** to verify companies, monitor shipments, manage disputes, and oversee escrow payments

Payments are held in **escrow** until delivery is confirmed, protecting both parties. If a shipper does not confirm within 24 hours of delivery, the system auto-confirms and releases funds automatically.

---

## Features

### Shipper
- Register and log in
- Post shipments with pickup/dropoff district, cargo description, weight, price, and date
- View all trucks that expressed interest, sorted by truck rating
- Select a truck and pay escrow via MTN Mobile Money or Airtel Money
- Confirm delivery or report an issue
- Submit a rating after completion

### Transport Company
- Register with company documents and multiple trucks in one form
- Await admin verification before accessing shipments
- Browse posted shipments and express interest using a specific available truck
- Mark pickup and delivery for active shipments
- Monitor all truck availability states

### Admin
- Review and approve or reject pending company registrations
- Monitor all shipments across the platform
- Resolve disputed shipments with full release, full refund, or manual split
- Monitor all escrow transactions
- Suspend and reinstate user accounts
- View full audit log of all admin actions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL (CockroachDB hosted) |
| DB Driver | node-postgres (pg) |
| Auth | JSON Web Tokens (JWT) |
| Password | bcrypt |
| File Uploads | multer |
| Frontend | React, React Router |
| Styling | Tailwind CSS |
| Testing | Postman |

---
## Project Structure

```
LoadLink-Rwanda/
├── backend/
│   ├── config/
│   │   └── db.js                  # Database connection pool
│   ├── controllers/               # Route controllers
│   │   ├── company.js
│   │   ├── interests.js
│   │   ├── shipments.js
│   │   ├── shippers.js
│   │   └── trucks.js
│   ├── database/                  # SQL scripts (seeds/test)
│   │   └── database.sql
│   ├── middleware/                # Express middleware
│   │   ├── auth.js
│   │   ├── errorMiddleware.js
│   │   └── logger.js
│   ├── routes/                    # API route definitions
│   │   ├── company.js
│   │   ├── interests.js
│   │   ├── shipments.js
│   │   ├── shippers.js
│   │   └── trucks.js
│   ├── service/                   # Business logic layer
│   │   ├── company.js
│   │   ├── interests.js
│   │   ├── shipments.js
│   │   ├── shippers.js
│   │   └── trucks.js
│   ├── utils/                     # Utility functions
│   │   └── catchAsync.js
│   ├── .env                       # Environment variables (local-only)
│   ├── API_DOCUMENTATION.md       # API endpoint details
│   ├── api_test_requests.md       # Sample requests for testing
│   ├── index.js                   # App entry point
│   ├── migrate.js                 # Database migration script
│   ├── package.json               # Dependencies and scripts
│   └── schema.sql                 # Core database schema
│
└── frontend/
    ├── public/                    # Static assets
    ├── src/
    │   ├── App.tsx                # Main app component
    │   ├── components/            # Reusable UI components
    │   ├── context/               # Global state (Context API)
    │   ├── data/                  # Static data and constants
    │   ├── main.tsx               # Entry point for Vite
    │   ├── index.css              # Global styles (Tailwind)
    │   └── pages/                 # Full-page components
    │       ├── CompanyDashboard.tsx
    │       ├── CompanyShipments.tsx
    │       ├── CompanyTrucks.tsx
    │       ├── Home.tsx
    │       ├── Login.tsx
    │       ├── PostShipment.tsx
    │       ├── Register.tsx
    │       └── ...
    ├── package.json               # Frontend dependencies
    ├── tailwind.config.js         # Styling configuration
    └── vite.config.ts             # Vite build configuration
```

---

## Getting Started

### Prerequisites

Make sure you have these installed before starting:

- Node.js v18 or higher
- npm v9 or higher
- A CockroachDB account (free tier at [cockroachlabs.com](https://cockroachlabs.com)) or any hosted PostgreSQL instance
- Postman (for testing API endpoints)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-org/LoadLink-Rwanda.git
cd LoadLink-Rwanda
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

### Environment Variables

In the `backend` folder, create a `.env` file using the provided template:

```bash
cp .env.example .env
```

Fill in the values:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@your-host.cockroachlabs.cloud:26257/loadlink?sslmode=verify-full
JWT_SECRET=your_long_random_secret_string_here
```

> **Important:** Never commit your `.env` file. It is already listed in `.gitignore`. Share the `DATABASE_URL` with teammates only through your private group chat.

### Database Setup

Connect to your CockroachDB instance using the SQL shell or the built-in SQL editor on the CockroachDB console, then run the full schema:

```sql
-- USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('SHIPPER', 'COMPANY', 'ADMIN')),
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- COMPANIES TABLE
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rdb_number VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  base_district VARCHAR(50),
  business_cert_path TEXT,
  insurance_doc_path TEXT,
  status VARCHAR(30) DEFAULT 'PENDING_VERIFICATION'
    CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- TRUCKS TABLE
CREATE TABLE trucks (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  truck_type VARCHAR(50),
  declared_capacity NUMERIC(10,2),
  reg_card_path TEXT,
  availability_status VARCHAR(20) DEFAULT 'UNAVAILABLE'
    CHECK (availability_status IN ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'UNAVAILABLE')),
  rating_average NUMERIC(3,2) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SHIPMENTS TABLE
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  shipper_id INTEGER REFERENCES users(id),
  pickup_district VARCHAR(50),
  dropoff_district VARCHAR(50),
  pickup_description TEXT,
  cargo_description TEXT,
  weight NUMERIC(10,2),
  offered_price NUMERIC(12,2),
  pickup_date DATE,
  status VARCHAR(30) DEFAULT 'POSTED'
    CHECK (status IN (
      'POSTED','AWAITING_ESCROW','ESCROW_FUNDED',
      'IN_TRANSIT','AWAITING_CONFIRMATION','COMPLETED','DISPUTED'
    )),
  selected_truck_id INTEGER REFERENCES trucks(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- SHIPMENT INTERESTS TABLE
CREATE TABLE shipment_interests (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  truck_id INTEGER REFERENCES trucks(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shipment_id, truck_id)
);

-- PAYMENTS TABLE
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  amount NUMERIC(12,2),
  provider_reference VARCHAR(100),
  status VARCHAR(20) DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','CONFIRMED','RELEASED','REFUNDED')),
  payout_amount NUMERIC(12,2),
  refund_amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- RATINGS TABLE
CREATE TABLE ratings (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id),
  truck_id INTEGER REFERENCES trucks(id),
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AUDIT LOG TABLE
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Running the App

**Backend:**

```bash
cd backend
node index.js
# Server running on http://localhost:3000
```

**Frontend:**

```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

---

## API Endpoints

### Authentication — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/shipper/register` | Register new shipper |
| POST | `/api/auth/shipper/login` | Shipper login, returns JWT |
| POST | `/api/auth/company/register` | Register company + trucks (multipart/form-data) |
| POST | `/api/auth/company/login` | Company login with status check, returns JWT |

### Shipments — Shipper

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shipments` | Post a new shipment |
| GET | `/api/shipments/my` | Get own shipments |
| GET | `/api/interests/shipment/:id` | View interests for a shipment |
| PATCH | `/api/shipments/:id/select` | Select a truck |
| PATCH | `/api/shipments/:id/confirm` | Confirm delivery |
| PATCH | `/api/shipments/:id/dispute` | Report an issue |

### Interests & Ratings — Shipper/Company

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipments` | Browse all POSTED shipments (Company) |
| POST | `/api/interests` | Express interest using a truck (Company) |
| GET | `/api/interests` | View own expressed interests (Company) |
| PATCH | `/api/shipments/:id/pickup` | Mark pickup (Company) |
| PATCH | `/api/shipments/:id/deliver` | Mark delivery (Company) |
| POST | `/api/ratings` | Submit a rating (Shipper) |


### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/companies/pending` | List pending companies |
| PATCH | `/api/admin/companies/:id/approve` | Approve company |
| PATCH | `/api/admin/companies/:id/reject` | Reject company |
| GET | `/api/admin/disputes` | List disputed shipments |
| POST | `/api/admin/disputes/:id/resolve` | Resolve dispute |
| PATCH | `/api/admin/users/:id/suspend` | Suspend account |
| GET | `/api/admin/audit` | View audit log |

### Request Format

All endpoints except file uploads use `Content-Type: application/json`.

Protected endpoints require the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Company registration uses `Content-Type: multipart/form-data` with these fields:

```
company_name, rdb_number, contact_person, phone, email,
password, base_district, trucks (JSON string array),
business_cert (file), insurance_doc (file),
truck_reg_cards (files, one per truck)
```

---

## Database Schema

The platform uses 8 tables. All user identities — shippers, companies, and admins — are stored in the `users` table and differentiated by the `role` column. Company profile data lives in `companies`, linked to users via `user_id`. Trucks belong to companies. Shipments are created by shippers and progress through a status lifecycle. The `shipment_interests` table is a junction table connecting trucks to shipments they expressed interest in. Payments, ratings, and audit logs each have their own dedicated table.

**Entity Relationships:**
- `users` → `companies` (one user account owns one company profile)
- `companies` → `trucks` (one company has many trucks)
- `users` → `shipments` (one shipper posts many shipments)
- `shipments` + `trucks` → `shipment_interests` (many-to-many junction)
- `shipments` → `payments` (one payment per shipment)
- `shipments` + `trucks` → `ratings` (rating attached to the specific truck)
- `users` → `audit_logs` (admin actions recorded)

---

## User Roles

| Role | Access | Verification Required |
|------|--------|-----------------------|
| SHIPPER | Post shipments, select trucks, pay escrow, confirm delivery, rate | No — active immediately after registration |
| COMPANY | Express interest, mark pickup/delivery, manage trucks | Yes — admin must approve before accessing shipments |
| ADMIN | Full platform control — verify companies, resolve disputes, monitor all activity | Pre-seeded — not self-registered |

---

## Shipment Lifecycle

```
POSTED
  └── Shipper selects a truck
        └── AWAITING_ESCROW
              └── Shipper pays via Mobile Money
                    └── ESCROW_FUNDED
                          └── Company marks pickup
                                └── IN_TRANSIT
                                      └── Company marks delivery
                                            └── AWAITING_CONFIRMATION
                                                  ├── Shipper confirms → COMPLETED → payment released
                                                  ├── Shipper reports issue → DISPUTED → admin resolves
                                                  └── No action for 24h → auto COMPLETED → payment released
```



> Built with purpose for Rwanda's logistics sector — LoadLink Rwanda, 2026.
