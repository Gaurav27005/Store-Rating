# RateStore — Full-Stack Rating Platform

A professional web application for store ratings with role-based access control.
Built with **Express.js**, **PostgreSQL**, and **React**.

---

## Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Backend   | Express.js (Node.js)  |
| Database  | PostgreSQL            |
| Frontend  | React.js              |
| Auth      | JWT (JSON Web Tokens) |
| Styling   | Custom CSS (DM Sans + Syne fonts) |

---

## Project Structure

```
ratestore/
├── backend/
│   ├── src/
│   │   ├── db.js                  # PostgreSQL connection + schema init
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication middleware
│   │   │   └── validate.js        # express-validator rules
│   │   └── routes/
│   │       ├── auth.js            # Login, register, password update
│   │       ├── admin.js           # Admin-only endpoints
│   │       ├── stores.js          # Store listing + ratings (users)
│   │       └── owner.js           # Store owner dashboard API
│   ├── server.js                  # Entry point
│   ├── .env                       # Environment variables
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api.js                 # Axios instance with JWT interceptor
    │   ├── context/
    │   │   ├── AuthContext.js     # Authentication state
    │   │   └── ToastContext.js    # Toast notifications
    │   ├── components/
    │   │   ├── Sidebar.js         # Navigation sidebar
    │   │   ├── ProtectedRoute.js  # Route guard
    │   │   ├── StarRating.js      # Star input + display
    │   │   └── SortableTh.js     # Sortable table header
    │   └── pages/
    │       ├── Login.js
    │       ├── Register.js
    │       ├── ChangePassword.js
    │       ├── admin/
    │       │   ├── Dashboard.js   # Stats overview
    │       │   ├── Users.js       # User management + add
    │       │   ├── UserDetail.js  # Individual user profile
    │       │   └── Stores.js      # Store management + add
    │       ├── user/
    │       │   └── BrowseStores.js  # Store listing + rating
    │       └── owner/
    │           └── Dashboard.js   # Owner's store analytics
    └── package.json
```

---

## Prerequisites

- **Node.js** v16+ and npm
- **PostgreSQL** 13+ running locally or remotely

---

## Database Setup

```sql
-- Create database
CREATE DATABASE ratestore;

-- Connect to it
\c ratestore

-- Tables are auto-created on server start (see src/db.js)
```

---

## Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
# Edit .env to match your PostgreSQL credentials:
nano .env
```

**.env file:**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ratestore
JWT_SECRET=your_super_secret_key_here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

```bash
# Start the server
npm start
```

On first start, the server will:
1. Create all tables (users, stores, ratings)
2. Seed a default admin account:
   - **Email:** admin@ratestore.com
   - **Password:** Admin@123

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure API URL (optional, defaults to localhost:5000)
# Edit .env:
REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start

# OR build for production
npm run build
```

---

## Running Both Together

Open two terminals:

```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

Visit **http://localhost:3000**

---

## User Roles & Credentials

| Role          | Access                                      | How to create           |
|---------------|---------------------------------------------|-------------------------|
| Admin         | Full platform management                    | Seeded on first run     |
| Normal User   | Browse stores, submit/modify ratings        | Self-register on /register |
| Store Owner   | View their store's ratings & analytics      | Created by admin        |

---

## API Endpoints

### Auth
| Method | Endpoint             | Description              | Auth   |
|--------|----------------------|--------------------------|--------|
| POST   | /api/auth/login      | Login (all roles)        | No     |
| POST   | /api/auth/register   | Register (user only)     | No     |
| PUT    | /api/auth/password   | Update password          | Yes    |
| GET    | /api/auth/me         | Get current user profile | Yes    |

### Admin
| Method | Endpoint                | Description              | Auth   |
|--------|-------------------------|--------------------------|--------|
| GET    | /api/admin/dashboard    | Stats (users/stores/ratings) | Admin |
| GET    | /api/admin/users        | List users (with filters) | Admin |
| POST   | /api/admin/users        | Create user              | Admin  |
| GET    | /api/admin/users/:id    | User detail              | Admin  |
| GET    | /api/admin/stores       | List stores (with filters) | Admin |
| POST   | /api/admin/stores       | Create store             | Admin  |
| GET    | /api/admin/store-owners | List store owners        | Admin  |

### Stores (Normal User)
| Method | Endpoint                    | Description          | Auth |
|--------|-----------------------------|----------------------|------|
| GET    | /api/stores                 | Browse stores        | User |
| POST   | /api/stores/:id/rate        | Submit/update rating | User |

### Owner
| Method | Endpoint               | Description            | Auth  |
|--------|------------------------|------------------------|-------|
| GET    | /api/owner/dashboard   | Store analytics & raters | Owner |

---

## Form Validation Rules

| Field    | Rules                                                                      |
|----------|----------------------------------------------------------------------------|
| Name     | Min 20 chars, Max 60 chars                                                 |
| Email    | Standard email format                                                      |
| Password | 8–16 chars, at least 1 uppercase, at least 1 special character             |
| Address  | Max 400 chars                                                              |
| Rating   | Integer 1–5                                                                |

---

## Database Schema

```sql
users (
  id          UUID PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,   -- bcrypt hash
  address     VARCHAR(400),
  role        VARCHAR(20) CHECK (role IN ('admin','user','store_owner')),
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)

stores (
  id          UUID PRIMARY KEY,
  name        VARCHAR(60) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  address     VARCHAR(400),
  owner_id    UUID REFERENCES users(id),
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
)

ratings (
  id          UUID PRIMARY KEY,
  store_id    UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP,
  UNIQUE(store_id, user_id)   -- one rating per user per store
)
```

---

## Features Implemented

### System Administrator
- ✅ Dashboard with total users, stores, ratings
- ✅ Add users (normal, admin, store owner)
- ✅ Add stores with optional owner assignment
- ✅ List users with filters (name, email, address, role) + sorting
- ✅ List stores with filters (name, email, address) + sorting
- ✅ User detail view (shows store rating if store owner)
- ✅ Logout

### Normal User
- ✅ Register and login
- ✅ Browse all stores (search by name/address)
- ✅ See store's overall rating and their own submitted rating
- ✅ Submit rating (1–5 stars)
- ✅ Modify existing rating
- ✅ Change password
- ✅ Logout

### Store Owner
- ✅ Login
- ✅ Dashboard with average rating and rating breakdown chart
- ✅ View all users who rated their store
- ✅ Change password
- ✅ Logout

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- JWT tokens expire in **24 hours**
- Role-based access control on all API routes
- Input validation and sanitization on all forms
- SQL injection prevention via parameterized queries

---

## Default Admin Credentials

```
Email:    admin@ratestore.com
Password: Admin@123
```

> ⚠️ Change these credentials immediately in a production environment.
