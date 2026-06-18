# 🏛️ Tamil Nadu Smart Citizen Complaint Management System (TNCMS)

A production-ready full-stack MERN application for managing citizen complaints across all wards in Tamil Nadu.

---

## 🚀 Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Redux Toolkit, React Router v7 |
| Backend | Node.js, Express.js, MongoDB Atlas, Mongoose, Socket.io |
| Auth | JWT (Access + Refresh tokens), bcryptjs, RBAC |
| Storage | Cloudinary (images), Multer |
| Reports | PDFKit, ExcelJS |
| Notifications | Nodemailer, Twilio SMS, Socket.io |
| Logging | Winston |
| Deployment | Docker, Docker Compose, Nginx |

---

## 👥 Roles

| Role | Access |
|------|--------|
| **Citizen** | Submit complaints, track status, view dashboard |
| **Ward Officer** | Manage ward complaints, update status, upload completion photos |
| **Super Admin** | Full system access, analytics, officer/ward management, reports |

---

## 📁 Project Structure

```
tncms/
├── backend/
│   ├── config/          # DB, Cloudinary config
│   ├── controllers/     # Auth, Complaints, Officers, Wards, Analytics, Reports
│   ├── middleware/       # JWT auth, error handler
│   ├── models/          # User, Complaint, Ward, Notification
│   ├── routes/          # All API routes
│   ├── utils/           # Winston logger
│   ├── logs/            # Log files
│   ├── server.js        # Main entry with Socket.io
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/  # DashboardLayout
│   │   │   └── shared/  # Navbar, Sidebar, UI components
│   │   ├── hooks/       # useSocket
│   │   ├── locales/     # Tamil & English translations
│   │   ├── pages/
│   │   │   ├── citizen/ # CitizenDashboard, Complaints, NewComplaint
│   │   │   ├── officer/ # OfficerDashboard, OfficerComplaints
│   │   │   └── admin/   # AdminDashboard, Complaints, Officers, Wards
│   │   ├── services/    # Axios API layer
│   │   ├── store/       # Redux store + slices
│   │   └── utils/       # Helpers
│   └── .env
└── docker-compose.yml
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Cloudinary account
- (Optional) Twilio, SMTP credentials

### 1. Clone & Install

```bash
# Backend
cd tncms/backend
npm install
cp .env.example .env   # fill in your credentials

# Frontend
cd tncms/frontend
npm install
cp .env.example .env
```

### 2. Configure Environment Variables

**Backend `.env`:**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tncms
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

### 3. Run Development

```bash
# Backend (port 5000)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

### 4. Create Admin User

Use MongoDB Compass or Atlas to insert:
```json
{
  "name": "Super Admin",
  "phone": "9000000000",
  "password": "<bcrypt_hashed_password>",
  "role": "admin",
  "isActive": true
}
```

Or use the register endpoint and update role directly in DB.

---

## 🐳 Docker Deployment

```bash
# Build & run all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Frontend → http://localhost:80  
Backend API → http://localhost:5000/api

---

## 📡 API Reference

| Module | Base Path |
|--------|-----------|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Complaints | `POST /api/complaints`, `GET /api/complaints/track/:id` |
| Wards | `GET /api/wards`, `POST /api/wards` |
| Officers | `GET /api/officers`, `POST /api/officers` |
| Analytics | `GET /api/analytics/dashboard` |
| Notifications | `GET /api/notifications` |
| Reports | `GET /api/reports/pdf`, `GET /api/reports/excel` |

---

## 🤖 AI Features

- **Auto Categorization** — Keywords (Tamil + English) map complaints to categories
- **Priority Prediction** — Urgency words trigger higher priority
- **Duplicate Detection** — Same phone + similar title within 24 hours flagged
- **Sentiment Analysis** — Simple scoring from description keywords

---

## 🌐 Bilingual Support

- Default language: **Tamil** (`ta`)
- Secondary: **English** (`en`)
- Switch via Navbar top-right button
- Translations in `src/locales/ta/` and `src/locales/en/`

---

## 🔐 Security

- JWT access tokens (7d) + refresh tokens (30d)
- bcrypt password hashing (salt rounds: 12)
- Rate limiting (200 req/15min, 10 login/15min)
- Helmet.js security headers
- CORS restricted to client URL
- Role-based route protection (citizen / officer / admin)

---

## 📊 Status Workflow

```
Submitted → Accepted → Processing → Completed
                    ↘ Rejected
```

Only Officers/Admin can change status. Citizens can only view.

---

## 🗺️ Complaint ID Format

- Citizen ID: `CIT-1001`, `CIT-1002`, ...
- Complaint ID: `TN-CMP-24001`, `TN-CMP-24002`, ...

---

## 📱 Responsive Design

- Mobile-first design
- Collapsible sidebar drawer on mobile
- Bottom-friendly navigation
- Tablet & desktop full layout

---

## 📄 License

Government of Tamil Nadu — Internal Use
