# LoadLink Rwanda

A full-stack freight marketplace connecting shippers with transport companies across Rwanda. Shippers post loads, companies express interest with their trucks, payments are held in escrow, and released upon delivery confirmation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | PostgreSQL (CockroachDB compatible) |
| Auth | JWT (jsonwebtoken + bcrypt) |
| Payments | Simulated MoMo (MTN & Airtel Rwanda) |
| File Uploads | Multer (local) |

---

## Project Structure

```
LoadLink-Rwanda-2/
├── frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/     # All page components
│   │   ├── api/       # API client functions
│   │   ├── components/# Shared components
│   │   ├── context/   # AuthContext
│   │   └── auth/      # JWT helpers
│   └── .env
├── backend/           # Node.js + Express
│   ├── controllers/   # Route handlers
│   ├── routes/        # Express routers
│   ├── service/       # Business logic + DB queries
│   ├── middleware/     # Auth, error handling, multer
│   ├── config/        # DB connection
│   ├── utils/         # catchAsync, email
│   ├── cron/          # Shipment reminders
│   └── .env
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL (or CockroachDB)
- npm

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/loadlink-rwanda.git
cd loadlink-rwanda
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/loadlink
JWT_SECRET=your_jwt_secret_here
BASE_URL=http://localhost:3000
MOMO_SIMULATOR_SECRET=loadlink_secret
PLATFORM_COMMISSION=0.05
PORT=3000
```

Create the uploads folder:

```bash
mkdir uploads
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Database Setup

Run the migration:

```bash
cd backend
node migrate.js
```

Seed an admin user:

```sql
INSERT INTO users (name, email, password_hash, role, phone)
VALUES ('Admin', 'admin@loadlink.rw', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uSc/BHd7O', 'ADMIN', '0780000000');
```

Default admin password: `password`

---

## User Roles

| Role | Description |
|------|-------------|
| `SHIPPER` | Posts shipments, pays escrow, confirms delivery |
| `COMPANY` | Registers trucks, expresses interest, picks up and delivers |
| `ADMIN` | Verifies companies/trucks, resolves disputes, monitors platform |

---

## Full API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shippers/register` | None | Register shipper |
| POST | `/api/shippers/login` | None | Login shipper |
| POST | `/api/company/register` | None | Register company |
| POST | `/api/company/login` | None | Login company |
| POST | `/auth/admin/login` | None | Login admin |

### Shipments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/shipments` | SHIPPER | Create shipment |
| GET | `/api/shipments/my` | SHIPPER | Get my shipments |
| GET | `/api/shipments` | COMPANY | Get available shipments |
| GET | `/api/shipments/active` | COMPANY | Get active shipments |
| PATCH | `/api/shipments/:id/select` | SHIPPER | Select a truck |
| PATCH | `/api/shipments/:id/confirm` | SHIPPER | Confirm delivery |
| PATCH | `/api/shipments/:id/dispute` | SHIPPER | Dispute delivery |
| PATCH | `/api/shipments/:id/pickup` | COMPANY | Confirm pickup |
| PATCH | `/api/shipments/:id/deliver` | COMPANY | Confirm delivery |

### Trucks
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trucks/my` | COMPANY | Get my trucks |
| POST | `/api/trucks/register` | COMPANY | Register truck (multipart) |
| PATCH | `/api/trucks/:id/status` | COMPANY | Update availability |
| GET | `/api/trucks/:id/ratings` | None | Get truck ratings |

### Interests
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/interests` | COMPANY | Express interest |
| GET | `/api/interests/my` | COMPANY | Get my interests |
| GET | `/api/interests/shipment/:id` | JWT | Get shipment interests |

### Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payments/initiate` | SHIPPER | Initiate escrow payment |
| GET | `/api/payments/status/:ref` | JWT | Poll payment status |
| POST | `/api/payments/disputes/resolve` | ADMIN | Resolve dispute |

### Ratings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ratings` | SHIPPER | Submit rating |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/companies/pending` | ADMIN | Pending companies |
| PATCH | `/api/admin/companies/:id/approve` | ADMIN | Approve company |
| PATCH | `/api/admin/companies/:id/reject` | ADMIN | Reject company |
| GET | `/api/admin/trucks/pending` | ADMIN | Pending trucks |
| PATCH | `/api/admin/trucks/:id/approve` | ADMIN | Approve truck |
| PATCH | `/api/admin/trucks/:id/reject` | ADMIN | Reject truck |
| GET | `/api/admin/shipments` | ADMIN | All shipments |
| GET | `/api/admin/disputes` | ADMIN | Disputed shipments |
| POST | `/api/payments/disputes/resolve` | ADMIN | Resolve dispute |
| GET | `/api/admin/audit` | ADMIN | Audit log |
| GET | `/api/admin/users` | ADMIN | All users |
| PATCH | `/api/admin/users/:id/suspend` | ADMIN | Suspend user |
| PATCH | `/api/admin/users/:id/reinstate` | ADMIN | Reinstate user |

### Company
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/company/analytics` | COMPANY | Dashboard analytics |

### Shipper
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/shippers/payments` | SHIPPER | Payment history |

---

## Shipment Status Flow

```
POSTED
  → AWAITING_ESCROW    (shipper selects a truck)
  → ESCROW_FUNDED      (payment confirmed by MoMo webhook)
  → IN_TRANSIT         (company confirms pickup)
  → AWAITING_CONFIRMATION  (company confirms delivery)
  → COMPLETED          (shipper confirms receipt)
  → DISPUTED           (shipper disputes delivery)
```

---

## Payment Flow

1. Shipper selects truck → shipment moves to `AWAITING_ESCROW`
2. Shipper initiates payment via MTN/Airtel MoMo
3. Backend calls MoMo simulator → simulator fires webhook after 3 seconds
4. Webhook updates payment to `CONFIRMED`, shipment to `ESCROW_FUNDED`
5. Frontend polls `/api/payments/status/:ref` every 2 seconds until confirmed
6. On delivery confirmation → payment released to company minus 5% commission

---

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `BASE_URL` | Backend base URL (no trailing slash) |
| `MOMO_SIMULATOR_SECRET` | Shared secret for webhook verification |
| `PLATFORM_COMMISSION` | Commission rate (default: 0.05) |
| `PORT` | Server port (default: 3000) |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend base URL |

---

## Testing

Import `backend/tests/integrationTests` into Postman.

**Run order:**
1. Login Shipper → sets `shipperToken`
2. Login Company → sets `companyToken`
3. Login Admin → sets `adminToken`
4. Create Shipment → sets `shipmentId`
5. Get My Trucks → sets `truckId`
6. Express Interest → uses both IDs
7. Select Truck → moves shipment to AWAITING_ESCROW
8. Initiate Payment → sets `referenceId`
9. Continue through remaining tests

---

## License

MIT
