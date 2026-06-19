# SaaS Subscription Management Platform

A full-stack SaaS subscription management platform built with **Next.js**, **Node.js**, **PostgreSQL**, and **Stripe API**.

---

## 🚀 Features

### User Features
- ✅ User registration & authentication (JWT)
- ✅ Subscription plans (Starter, Professional, Enterprise)
- ✅ Subscribe, upgrade, downgrade, cancel & reactivate
- ✅ Billing history & invoice management
- ✅ Usage analytics dashboard
- ✅ Profile & password management

### Admin Features
- ✅ Platform-wide analytics dashboard (users, revenue, churn)
- ✅ User management with role-based access control
- ✅ Subscription oversight
- ✅ Invoice management
- ✅ Audit logs

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (via Prisma ORM) |
| Payments | Stripe API |
| Auth | JWT (jsonwebtoken) |
| Charts | Recharts |
| State | Zustand |

---

## 📋 Project Structure

```
project1-saas-subscription/
├── frontend/              # Next.js frontend
│   └── src/
│       ├── app/           # App Router pages
│       │   ├── auth/      # Login, Register
│       │   └── dashboard/ # Dashboard pages
│       └── lib/           # API client, auth store
└── backend/               # Node.js/Express API
    ├── prisma/            # DB schema & migrations
    └── src/
        ├── routes/        # API route handlers
        ├── middleware/    # Auth middleware
        ├── services/      # Stripe service
        └── utils/         # Seed script
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL database
- Stripe account (for payments)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DB URL, JWT secret, and Stripe keys

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Start server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API URL and Stripe public key

# Start dev server
npm run dev
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@saasplatform.com | Admin@123 |
| User | user@example.com | User@1234 |

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile
- `PUT /api/auth/change-password` — Change password

### Plans
- `GET /api/plans` — List all plans
- `POST /api/plans` — Create plan (Admin)
- `PUT /api/plans/:id` — Update plan (Admin)
- `DELETE /api/plans/:id` — Deactivate plan (Super Admin)

### Subscriptions
- `GET /api/subscriptions/my` — Get my subscription
- `POST /api/subscriptions/subscribe` — Subscribe to plan
- `PUT /api/subscriptions/upgrade` — Change plan
- `POST /api/subscriptions/cancel` — Cancel subscription
- `POST /api/subscriptions/reactivate` — Reactivate subscription
- `GET /api/subscriptions` — List all subscriptions (Admin)

### Billing
- `GET /api/billing/invoices` — Get invoices
- `GET /api/billing/summary` — Billing summary
- `GET /api/billing/usage` — Usage logs
- `POST /api/billing/usage` — Record usage

### Analytics
- `GET /api/analytics/my` — User analytics
- `GET /api/analytics/admin/overview` — Platform analytics (Admin)

### Admin
- `GET /api/admin/users` — List users
- `PUT /api/admin/users/:id/role` — Change user role
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/audit-logs` — Audit logs
- `POST /api/admin/invoices` — Create invoice
- `PUT /api/admin/invoices/:id/status` — Update invoice status

---

## 🌐 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🔒 Security Features
- JWT authentication with expiry
- Password hashing (bcrypt)
- Rate limiting
- Helmet security headers
- CORS protection
- Role-based access control (USER / ADMIN / SUPER_ADMIN)
- Stripe webhook signature verification

---

## 📧 Contact

**Submitted by:** [Your Name]  
**Email:** vaishali@codectechnologies.in  
**Project:** SaaS Subscription Management Platform
