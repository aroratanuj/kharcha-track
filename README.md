# Kharcha-Track - Intelligent Expense Tracking System

A cross-platform expense tracking application (Web, iOS, Android) with AI-powered email parsing, budget tracking, analytics, and admin management. Built with React Native (Expo) and NestJS.

## Features

### Core
- **Manual Expense Entry** — Add expenses with date, amount, description, category, account source
- **Edit & Delete Expenses** — Users edit their own expenses; admin can edit/delete any
- **Category Management** — 10 pre-seeded categories with custom icons/colors; admin can add/edit/delete
- **Account Sources** — Track payment method (UPI, Card, Cash, Bank, Google Pay, etc.)
- **Month Navigation** — Filter expenses by month/year with summary stats

### Email-to-Expense
- **Shared Inbox** — Users forward receipt emails to a shared Gmail inbox
- **AI Parsing** — Groq AI (Llama 3) extracts amount, merchant, date from email body
- **Regex Fallback** — When AI key is not set, regex extracts amounts from `Rs/INR/₹/$` patterns
- **Draft Queue** — Email expenses land as drafts for user review and confirmation
- **Duplicate Detection** — SHA-256 digest prevents processing the same email twice
- **Unrecognized Senders** — Welcome email sent, admin notified, draft stored as unassigned (max 10/sender)

### Admin
- **View All Users' Expenses** — Admin sees every expense across all users
- **Create Expenses for Users** — Searchable dropdown to create expenses on behalf of any user
- **Approve Drafts** — Admin can confirm any user's draft expenses
- **Assign Unassigned** — Admin assigns unassigned drafts to registered users
- **Configuration Screen** — Manage categories, account sources, and view unassigned drafts
- **Budget Management** — Set per-category monthly budgets
- **Analytics Dashboard** — Spending trends, category breakdown, top merchants

### UI/UX
- **Dark Mode** — Toggle in drawer menu, persisted to storage
- **Drawer Navigation** — Hamburger menu with Home, Drafts, Budgets, Analytics, Config
- **Summary Dashboard** — Total spent, expense count, top 5 categories with bar charts
- **Draft Banner** — Red badge count in drawer, tappable banner on home screen
- **FAB Button** — Floating "+" button on all screens for quick expense creation
- **Web Support** — Full web support with responsive layout (max-width 700px centered)
- **Secure Storage** — expo-secure-store on native, localStorage fallback on web

## Tech Stack

### Mobile App
- **React Native** with Expo SDK 51
- **TypeScript** for type safety
- **React Navigation** (Drawer + Native Stack)
- **Axios** with interceptors (auto-redirect on 401)
- **React Hook Form** — form state management
- **expo-secure-store** — token storage (localStorage fallback on web)
- **react-native-chart-kit** — spending charts
- **date-fns** — date utilities

### Backend API
- **Node.js** with NestJS 10
- **TypeScript**
- **MongoDB Atlas** (Mongoose ODM)
- **JWT Authentication** (ConfigService-injected, no timing bugs)
- **Groq Cloud** — AI expense parsing (Llama 3 70B)
- **Mailgun** — Email receiving via webhook + sending notifications
- **Helmet** — HTTP security headers
- **@nestjs/throttler** — Rate limiting (30/sec short, 200/10sec medium)

### Infrastructure (Free Tier)
- **MongoDB Atlas** — Database (512MB free)
- **Mailgun** — Email receiving/sending (1000 free/month, sandbox domain)
- **Cloudflare Tunnel** — Expose local backend for webhooks
- **Google Apps Script** — Gmail inbox monitor (planned)
- **Groq Cloud** — AI inference (free tier)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier)
- Mailgun account (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/kharcha-track.git
cd kharcha-track
```

### 2. Environment Setup

The root `.env` is the single source of truth. Copy and configure:

```bash
cp .env.example .env
```

Required variables:
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/kharcha-track

# Auth
JWT_SECRET=your-secret-key

# Server
PORT=3000
MOBILE_APP_URL=exp://localhost:19000
```

Optional variables:
```env
# AI (Groq) — enables AI expense parsing from emails
GROQ_API_KEY=your-groq-key

# Email (Mailgun) — enables email-to-expense webhook
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-sandbox.mailgun.org
ADMIN_NOTIFICATION_EMAIL=admin@example.com
APP_URL=http://localhost:8081
GMAIL_WEBHOOK_SECRET=your-secret
```

### 3. Start Backend

```bash
cd backend
npm install
npm run start:dev
```

### 4. Seed Database

```bash
cd backend
npx ts-node scripts/seed-mongo.ts all
```

Seed commands: `all`, `categories`, `users`, `expenses`, `budgets`, `reset`, `stats`

### 5. Start Mobile App

```bash
cd mobile
npm install
npx expo start
```

Open on web: `http://localhost:8081`

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kharcha.com | admin1511 |
| Demo User | demo@kharcha.com | demo1234 |

## Email-to-Expense Setup

### Option A: Mailgun Webhook (Current)

1. Create account at [mailgun.com](https://mailgun.com)
2. Note your sandbox domain and API key
3. Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` in `.env`
4. Create a receiving route: `match_recipient("expenses@sandbox...")` → forward to `https://your-backend/api/email/webhook`
5. Add authorized recipients in Mailgun dashboard (sandbox only sends to authorized emails)

### Option B: Gmail Shared Inbox (Planned)

1. Create a Gmail account (e.g., `expenses@yourdomain.com`)
2. Create a Google Apps Script that polls the inbox every 1 minute
3. Script POSTs new emails to `POST /api/email/gmail-webhook` with shared secret
4. No tunnel needed if backend is deployed to a public URL

### How It Works

```
User forwards receipt email
        ↓
Gmail inbox / Mailgun receives
        ↓
Webhook POST to backend
        ↓
AI/Regex extracts amount, merchant, date
        ↓
Draft expense created for user
        ↓
User reviews and confirms in app
```

## Project Structure

```
kharcha-track/
├── .env                          # Single source of truth for all env vars
├── backend/
│   ├── .env                      # Backend-specific env vars (same as root)
│   ├── src/
│   │   ├── main.ts               # Express setup, helmet, CORS, raw body for Mailgun
│   │   ├── app.module.ts         # Root module with all feature modules
│   │   ├── auth/                 # JWT auth, login, register, strategy
│   │   ├── expenses/             # CRUD, drafts, summary, bulk-confirm, assign
│   │   ├── categories/           # Category management (admin)
│   │   ├── budgets/              # Budget CRUD per category
│   │   ├── analytics/            # Trends, category breakdown, summaries
│   │   ├── email/                # Mailgun webhook, Gmail webhook, email sender
│   │   ├── account-source/       # Account source CRUD (admin)
│   │   ├── schemas/              # Mongoose schemas (user, expense, category, budget)
│   │   ├── dto/                  # Request/response DTOs with validation
│   │   ├── common/               # Guards, decorators, middleware
│   │   └── constants/            # App-wide constants
│   └── scripts/
│       └── seed-mongo.ts         # Database seeding script
├── mobile/
│   ├── src/
│   │   ├── App.tsx               # Root component with navigation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # Auth state, login/logout/register
│   │   │   └── ThemeContext.tsx   # Dark/light theme toggle
│   │   ├── navigation/
│   │   │   ├── AppNavigator.tsx  # Auth stack vs Drawer navigator
│   │   │   └── AppDrawerNavigator.tsx  # Drawer with custom content
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx          # Summary, top categories, expense list
│   │   │   ├── ConfigScreen.tsx        # Admin configuration
│   │   │   ├── auth/                   # Login, Register
│   │   │   ├── expenses/               # ExpenseForm, DraftExpenses
│   │   │   ├── budget/                 # BudgetDashboard
│   │   │   ├── analytics/              # AnalyticsDashboard
│   │   │   ├── categories/             # Category management
│   │   │   └── admin/                  # Admin dashboard
│   │   ├── components/
│   │   │   ├── FabButton.tsx           # Floating action button
│   │   │   ├── DatePicker.tsx          # Date picker component
│   │   │   └── Toast.tsx               # Toast notification system
│   │   ├── hooks/
│   │   │   ├── useResponsive.ts        # Responsive breakpoints
│   │   │   └── useLogLevel.ts          # Log level control
│   │   ├── services/
│   │   │   └── api.ts                  # Axios instance with interceptors
│   │   └── types/                      # TypeScript type definitions
│   └── package.json
└── docs/
```

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/auth/users` | Admin | List all users |

### Expenses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/expenses` | Yes | Create expense (admin: for any user) |
| GET | `/api/expenses` | Yes | List user's expenses |
| GET | `/api/expenses/all` | Admin | List all expenses (with filters) |
| GET | `/api/expenses/:id` | Yes | Get expense by ID |
| PUT | `/api/expenses/:id` | Yes | Update expense |
| DELETE | `/api/expenses/:id` | Yes | Delete expense (own drafts or admin) |
| GET | `/api/expenses/drafts` | Yes | Get user's draft expenses |
| GET | `/api/expenses/summary` | Yes | Monthly summary with top categories |
| GET | `/api/expenses/unassigned` | Admin | Get unassigned drafts |
| POST | `/api/expenses/:id/confirm` | Yes | Confirm draft expense |
| POST | `/api/expenses/:id/assign` | Admin | Assign unassigned draft to user |
| POST | `/api/expenses/bulk-confirm` | Yes | Confirm multiple drafts |

### Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | Yes | List all categories |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update category |
| DELETE | `/api/categories/:id` | Admin | Delete category |

### Budgets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/budgets` | Yes | List budgets |
| POST | `/api/budgets` | Admin | Create budget |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/summary` | Yes | Spending summary |
| GET | `/api/analytics/by-category` | Yes | Category breakdown |
| GET | `/api/analytics/trends` | Yes | Monthly trends |

### Email
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/email/webhook` | HMAC | Mailgun incoming email webhook |
| POST | `/api/email/gmail-webhook` | Token | Gmail Apps Script webhook |

## User Roles

| Feature | User | Admin |
|---------|------|-------|
| View own expenses | Yes | Yes |
| Create/edit own expenses | Yes | Yes |
| Delete own draft expenses | Yes | Yes |
| View all users' expenses | No | Yes |
| Create expense for any user | No | Yes |
| Delete any expense | No | Yes |
| Confirm own drafts | Yes | Yes |
| Confirm any user's drafts | No | Yes |
| Manage categories | No | Yes |
| Manage budgets | No | Yes |
| View analytics | No | Yes |
| View/assign unassigned drafts | No | Yes |
| Access Configuration screen | No | Yes |

## Exposing Backend for Webhooks (Dev)

For Mailgun/Gmail webhooks to reach your local backend:

```bash
# Option 1: Cloudflare Tunnel (free, no interstitial)
brew install cloudflared
cloudflared tunnel --url http://localhost:3000

# Option 2: ngrok (free tier has interstitial, blocks Mailgun)
brew install ngrok
ngrok http 3000
```

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| MongoDB Atlas | 512MB, shared cluster | $0 |
| Mailgun | 1000 emails/month, sandbox domain | $0 |
| Groq Cloud | Rate-limited AI inference | $0 |
| Cloudflare Tunnel | Unlimited | $0 |
| Google Apps Script | Unlimited | $0 |
| Expo | Free dev builds | $0 |
| **Total** | | **$0** |

### Upgrade Path (500+ users)
- MongoDB Atlas: $0-9/mo (shared → dedicated)
- Mailgun: $0-35/mo (sandbox → custom domain)
- Render/Railway: $7/mo (always-on backend)
- Total: ~$15-50/month

## Roadmap

### Phase 1: Foundation
- [x] Project setup (monorepo)
- [x] MongoDB Atlas database with Mongoose
- [x] JWT authentication with role-based access
- [x] React Native (Expo) mobile app with web support

### Phase 2: Core Features
- [x] Manual expense CRUD
- [x] Category management (admin)
- [x] Account sources (database-driven)
- [x] Month/year filtering
- [x] Summary dashboard with top categories

### Phase 3: Email Integration
- [x] Mailgun webhook endpoint with HMAC verification
- [x] AI expense parsing (Groq Llama 3)
- [x] Regex fallback parsing (Rs/INR/₹/$)
- [x] Draft expense queue
- [x] Duplicate detection (SHA-256)
- [x] Unrecognized sender handling (welcome email, admin notification)
- [x] Email sending via Mailgun API
- [ ] Gmail shared inbox via Google Apps Script

### Phase 4: Admin & Analytics
- [x] Admin dashboard (view all users/expenses)
- [x] Create expenses on behalf of users
- [x] Bulk confirm drafts
- [x] Budget tracking per category
- [x] Analytics dashboard (trends, category breakdown)
- [x] Configuration screen

### Phase 5: Polish
- [x] Dark mode with persistence
- [x] Drawer navigation with badges
- [x] FAB button on all screens
- [x] Responsive web layout
- [ ] Push notifications
- [ ] Export reports (PDF/CSV)
- [ ] Multi-currency support

## License

MIT License

---

Built with [Expo](https://expo.dev/), [NestJS](https://nestjs.com/), [MongoDB Atlas](https://www.mongodb.com/atlas), and [Groq](https://groq.com/).
