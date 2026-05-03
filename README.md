# Kharcha-Track - Intelligent Expense Tracking System

A cross-platform expense tracking application (Web, iOS, Android) with AI-powered email parsing, budget tracking, analytics, and admin management. Built with React Native (Expo) and NestJS.

## Features

### Core
- **Manual Expense Entry** — Add expenses with date, amount, description, category, account source
- **Edit & Delete Expenses** — Users edit their own expenses; admin can edit/delete any
- **Category Management** — 10 pre-seeded categories with custom icons/colors; admin can add/edit/delete
- **Account Sources** — Track payment method (Credit Card, Bank Account, UPI, Cash); admin can add/remove
- **Month Navigation** — Filter expenses by month/year with summary stats

### Email-to-Expense
- **Shared Inbox** — IMAP polling on a shared Gmail inbox (`kharcha.email@gmail.com`)
- **AI-First Parsing** — LLM (Groq/Ollama) extracts amount, merchant, date, account source, category from emails; regex fills gaps for low/medium confidence fields
- **Per-Field Confidence** — Each parsed field (amount, description, merchant, date, accountSource, category) has its own confidence level shown in the review UI
- **Category Deduction** — Regex history match first (merchant → past category), then LLM fallback picks from category list
- **Draft Review Flow** — Sequential review with Prev/Next navigation; Save partial info without confirming; Confirm to finalize and auto-advance
- **Duplicate Detection** — SHA-256 digest prevents processing the same email twice
- **Unrecognized Senders** — Welcome email sent, admin notified, draft stored as unassigned (max 10/sender)
- **HTML/MIME Processing** — Handles multipart emails, quoted-printable encoding, strips HTML tags, extracts text/plain or falls back to HTML

### Admin
- **View All Users' Expenses** — Admin sees every expense across all users
- **Create Expenses for Users** — Searchable dropdown to create expenses on behalf of any user
- **Draft Review** — Sequential review with Save (partial) and Confirm (finalize) per draft
- **AI Toggle** — Turn AI parsing ON/OFF via settings (admin-only endpoint) for cost control
- **LLM Provider Swap** — Switch between Groq, Ollama (local), or any custom provider without code changes
- **Assign Unassigned** — Admin assigns unassigned drafts to registered users
- **Configuration Screen** — Manage categories, account sources, and view unassigned drafts
- **Budget Management** — Set per-category monthly budgets
- **Analytics Dashboard** — Spending trends, category breakdown, top merchants

### UI/UX
- **Dark Mode** — Toggle in drawer menu, persisted to storage
- **Drawer Navigation** — Hamburger menu with Home, Drafts, Budgets, Analytics, Config
- **Summary Dashboard** — Total spent, expense count, top 5 categories with bar charts
- **Draft Badge** — Red badge count in drawer
- **FAB Button** — Floating "+" button on all screens for quick expense creation
- **Web Support** — Full web support with responsive layout (max-width 700px centered)
- **Confidence Badges** — Color-coded badges (green/orange/red) per field in draft review

## Tech Stack

### Mobile App
- **React Native** with Expo SDK 51
- **TypeScript** for type safety
- **React Navigation** (Drawer + Native Stack)
- **Axios** with interceptors (auto-redirect on 401)
- **expo-secure-store** — token storage (localStorage fallback on web)
- **react-native-chart-kit** — spending charts

### Backend API
- **Node.js** with NestJS 10
- **TypeScript**
- **MongoDB Atlas** (Mongoose ODM)
- **JWT Authentication** (ConfigService-injected, no timing bugs)
- **bcryptjs** — Cross-platform password hashing (no native binaries)
- **@nestjs/schedule** — Cron-based IMAP polling
- **imapflow** — IMAP client for Gmail inbox monitoring
- **Helmet** — HTTP security headers
- **@nestjs/throttler** — Rate limiting (100/sec short, 500/10sec medium, 20/min webhook)

### AI/LLM Layer (Pluggable)
- **LLM Provider Interface** — `llm-provider.interface.ts` defines `parseExpense()` and `suggestCategory()`
- **Groq Provider** — Uses `groq-sdk` with Llama 3 models (cloud, free tier)
- **Ollama Provider** — Local LLM via REST API (free, offline, `llama3.2`)
- **LLM Provider Factory** — Picks provider by name from settings; easy to add new providers
- **Parser Interface** — `expense-parser.interface.ts` defines `parse()` returning `ParsedExpense`
- **Regex Parser** — Standalone regex-based parser for amount, date, merchant, accountSource
- **AI Parser** — LLM first, regex fills gaps per field when confidence is low/medium
- **Settings Service** — MongoDB-backed admin settings (`aiEnabled`, `aiProvider`, `llmModel`)

### Infrastructure (Free Tier)
- **MongoDB Atlas** — Database (512MB free)
- **Mailgun** — Email receiving/sending (1000 free/month, sandbox domain)
- **Render.com** — Backend hosting (free tier)
- **Groq Cloud** — AI inference (free tier)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB Atlas account (free tier)

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
# Database (MongoDB Atlas free tier)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/kharcha-track

# Auth
JWT_SECRET=your-random-secret-key

# Server
PORT=3000
MOBILE_APP_URL=exp://localhost:19000
```

Optional variables:
```env
# AI — enables AI expense parsing from emails
GROQ_API_KEY=your-groq-api-key

# Local LLM alternative (free, offline)
OLLAMA_BASE_URL=http://localhost:11434

# IMAP — enables Gmail inbox polling for email-to-expense
IMAP_HOST=imap.gmail.com
IMAP_USER=your-expense-email@gmail.com
IMAP_PASS=your-app-specific-password

# Mailgun — enables email receiving via webhook + sending
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-sandbox-domain.mailgun.org
ADMIN_NOTIFICATION_EMAIL=admin@yourdomain.com
APP_URL=https://your-backend.onrender.com
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

### Default Roles

The system has two roles: **user** (view/manage own data) and **admin** (manage all users, categories, budgets, settings, AI toggles). Default admin credentials are seeded via the seed script.

## Email-to-Expense Setup

### IMAP Inbox (Current)

1. Create a Gmail account for receiving expense emails
2. Enable 2FA and generate an App Password
3. Set `IMAP_HOST`, `IMAP_USER`, `IMAP_PASS` in `.env`
4. Users forward receipt emails to this inbox
5. Backend polls every minute via `@Cron(EVERY_MINUTE)`
6. New emails are parsed (AI or regex) and created as draft expenses

### How It Works

```
User forwards receipt email to shared inbox
        ↓
IMAP poll (every 1 minute)
        ↓
Extract plain text from MIME/HTML email
        ↓
LLM parses email (if AI enabled)
  ├─ High confidence → use LLM value
  └─ Low/medium confidence → regex fallback
        ↓
Category deduction
  ├─ Regex: match merchant against user's history
  └─ LLM: pick from category list
        ↓
Draft expense created (with per-field confidence)
        ↓
Admin reviews in sequential UI
  ├─ Save → updates draft, stays draft
  ├─ Confirm → finalizes, moves to next draft
  └─ Prev/Next → browse without action
```

### Testing Email Parsing Locally

```bash
# Start backend, then test with curl
curl -X POST http://localhost:3000/api/email/test-parse \
  -H "Content-Type: application/json" \
  -d '{"email":"Your raw email content here"}'
```

## Adding a New LLM Provider

1. Create `backend/src/email/llm/your-provider.ts` implementing `LLMProvider` interface:

```typescript
@Injectable()
export class YourProvider implements LLMProvider {
  readonly name = 'your-provider';
  isAvailable() { return !!process.env.YOUR_API_KEY; }
  async parseExpense(emailContent, subject, categoryList, model?) { /* ... */ }
  async suggestCategory(merchant, description, emailSnippet, categoryList, model?) { /* ... */ }
}
```

2. Register in `llm-provider.factory.ts`
3. Set `aiProvider: 'your-provider'` via `PUT /api/settings`

## Project Structure

```
kharcha-track/
├── .env                              # Single source of truth for all env vars
├── backend/
│   ├── src/
│   │   ├── main.ts                   # Express setup, helmet, CORS
│   │   ├── app.module.ts             # Root module with all feature modules
│   │   ├── auth/                     # JWT auth, login, register, guards
│   │   ├── expenses/                 # CRUD, drafts, summary, confirm, assign
│   │   ├── categories/               # Category management (admin)
│   │   ├── budgets/                  # Budget CRUD per category
│   │   ├── analytics/                # Trends, category breakdown
│   │   ├── email/
│   │   │   ├── email.service.ts      # Core email logic (parse, process, deduce)
│   │   │   ├── email.controller.ts   # Webhook + test-parse endpoints
│   │   │   ├── email.module.ts       # Wires all providers and parsers
│   │   │   ├── email-sender.service.ts # Mailgun email sending
│   │   │   ├── imap-monitor.service.ts # IMAP polling with detailed logging
│   │   │   ├── llm/
│   │   │   │   ├── llm-provider.interface.ts  # LLM contract
│   │   │   │   ├── groq.provider.ts          # Groq cloud implementation
│   │   │   │   ├── ollama.provider.ts        # Ollama local implementation
│   │   │   │   └── llm-provider.factory.ts   # Provider selection by name
│   │   │   └── parsers/
│   │   │       ├── expense-parser.interface.ts  # Parser contract
│   │   │       ├── regex.parser.ts             # Standalone regex parser
│   │   │       └── ai.parser.ts               # LLM + regex hybrid parser
│   │   ├── settings/
│   │   │   ├── settings.service.ts    # Admin settings (aiEnabled, aiProvider, llmModel)
│   │   │   ├── settings.controller.ts # GET/PUT /api/settings (admin-only)
│   │   │   └── settings.module.ts
│   │   ├── account-source/           # Account source CRUD (admin)
│   │   ├── schemas/                  # Mongoose schemas
│   │   │   ├── expense.schema.ts
│   │   │   ├── user.schema.ts
│   │   │   ├── category.schema.ts
│   │   │   ├── budget.schema.ts
│   │   │   ├── account-source.schema.ts
│   │   │   └── system-config.schema.ts
│   │   ├── dto/                      # Request/response DTOs
│   │   └── constants/                # App-wide constants
│   └── scripts/
│       └── seed-mongo.ts             # Database seeding script
├── mobile/
│   ├── src/
│   │   ├── App.tsx                   # Root component with navigation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Auth state, login/logout/register
│   │   │   └── ThemeContext.tsx       # Dark/light theme toggle
│   │   ├── navigation/
│   │   │   └── AppDrawerNavigator.tsx # Drawer with custom content
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx         # Summary, top categories, expense list
│   │   │   ├── ConfigScreen.tsx       # Admin configuration
│   │   │   ├── expenses/
│   │   │   │   ├── ExpenseFormScreen.tsx    # Create/edit expense
│   │   │   │   ├── DraftExpensesScreen.tsx  # Draft list with bulk actions
│   │   │   │   └── DraftReviewScreen.tsx    # Sequential review with Save/Confirm
│   │   │   ├── budget/                 # BudgetDashboard
│   │   │   ├── analytics/              # AnalyticsDashboard
│   │   │   └── auth/                   # Login, Register
│   │   ├── components/
│   │   │   ├── FabButton.tsx           # Floating action button
│   │   │   ├── DatePicker.tsx          # Date picker component
│   │   │   └── Toast.tsx               # Toast notification system
│   │   ├── hooks/
│   │   │   └── useResponsive.ts        # Responsive breakpoints
│   │   ├── services/
│   │   │   └── api.ts                  # Axios instance with interceptors
│   │   └── types/                      # TypeScript type definitions
│   └── package.json
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
| PUT | `/api/expenses/:id` | Yes | Update expense (admin: any user's) |
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
| POST | `/api/email/test-parse` | No | Test email parsing (no draft created) |

### Settings (Admin)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Admin | Get all settings |
| PUT | `/api/settings` | Admin | Update settings (aiEnabled, aiProvider, llmModel) |

### Account Sources
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/account-sources` | Yes | List active account sources |
| POST | `/api/account-sources` | Admin | Create account source |
| PUT | `/api/account-sources/:id` | Admin | Update account source |
| DELETE | `/api/account-sources/:id` | Admin | Delete account source |

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
| Save info to drafts without confirming | Yes | Yes |
| Manage categories | No | Yes |
| Manage account sources | No | Yes |
| Manage budgets | No | Yes |
| View analytics | No | Yes |
| View/assign unassigned drafts | No | Yes |
| Toggle AI on/off | No | Yes |
| Switch LLM provider | No | Yes |
| Access Configuration screen | No | Yes |

## Admin Settings

```bash
# Get current settings
curl -X GET /api/settings -H "Authorization: Bearer <admin-jwt-token>"

# Disable AI (regex-only parsing)
curl -X PUT /api/settings -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" -d '{"aiEnabled": false}'

# Switch to Ollama (local LLM)
curl -X PUT /api/settings -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" -d '{"aiProvider": "ollama"}'

# Use cheaper model
curl -X PUT /api/settings -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" -d '{"llmModel": "llama3-8b-8192"}'
```

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| MongoDB Atlas | 512MB, shared cluster | $0 |
| Mailgun | 1000 emails/month, sandbox domain | $0 |
| Groq Cloud | Rate-limited AI inference | $0 |
| Ollama | Free forever (local) | $0 |
| Render.com | Free tier hosting | $0 |
| Expo | Free dev builds | $0 |
| **Total** | | **$0** |

### Upgrade Path (500+ users)
- MongoDB Atlas: $0-9/mo (shared → dedicated)
- Mailgun: $0-35/mo (sandbox → custom domain)
- Render: $7/mo (always-on backend)
- Groq: Pay-as-you-go for higher limits
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
- [x] IMAP inbox polling (shared Gmail)
- [x] Pluggable LLM providers (Groq, Ollama)
- [x] AI-first parsing with regex fallback per field
- [x] Per-field confidence levels
- [x] Category deduction (history match → LLM fallback)
- [x] Draft expense queue
- [x] Sequential draft review (Save/Confirm, Prev/Next)
- [x] Duplicate detection (SHA-256)
- [x] HTML/MIME email processing
- [x] Unrecognized sender handling
- [x] Email sending via Mailgun API
- [x] Admin AI toggle (ON/OFF + provider swap)

### Phase 4: Admin & Analytics
- [x] Admin dashboard (view all users/expenses)
- [x] Create expenses on behalf of users
- [x] Bulk confirm drafts
- [x] Budget tracking per category
- [x] Analytics dashboard (trends, category breakdown)
- [x] Configuration screen
- [x] Settings API (admin toggles)

### Phase 5: Polish
- [x] Dark mode with persistence
- [x] Drawer navigation with badges
- [x] FAB button on all screens
- [x] Responsive web layout
- [ ] Push notifications
- [ ] Export reports (PDF/CSV)
- [ ] Multi-currency support
- [ ] Receipt attachment parsing (PDF)

## License

MIT License

---

Built with [Expo](https://expo.dev/), [NestJS](https://nestjs.com/), [MongoDB Atlas](https://www.mongodb.com/atlas), and [Groq](https://groq.com/).
