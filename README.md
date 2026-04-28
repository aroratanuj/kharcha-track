# Kharcha-Track - Intelligent Expense Tracking System

An intelligent mobile expense tracking application for iPhone that uses AI to automatically extract expenses from emails.

## 🌟 Features

- **AI-Powered Email Parsing**: Forward expense emails to automatically extract expense details
- **Custom Categories**: Create and manage your own expense categories
- **Review Queue**: Review and confirm AI-detected expenses before logging
- **Budget Tracking**: Set budgets per category and track spending
- **Analytics & Reports**: Visualize your spending patterns with charts
- **100% Free**: Built using free tier services - zero hosting costs

## 📱 Tech Stack

### Mobile App
- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for routing
- **React Query** for data fetching
- **Zustand** for state management

### Backend API
- **Node.js** with NestJS framework
- **TypeScript**
- **PostgreSQL** (via Supabase)
- **JWT Authentication**
- **Groq Cloud** for AI processing (Llama 3)

### Infrastructure (100% FREE)
- **Render** - Backend hosting
- **Supabase** - PostgreSQL database
- **Cloudflare R2** - Object storage
- **Mailgun** - Email receiving (1000 free/month)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- iOS Simulator or iPhone device
- Mac (for iOS development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kharcha-track.git
   cd kharcha-track
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   npm run start:dev
   ```

3. **Setup Mobile App** (new terminal)
   ```bash
   cd mobile
   npm install
   cp .env.example .env
   # Edit .env with your API URL
   npx expo start
   ```

4. **Run on iPhone**
   - Install Expo Go app on your iPhone
   - Scan QR code from terminal
   - Or press `i` to open iOS Simulator

## 📧 Email Setup

### Configure Mailgun (Free Tier)

1. Create account at [Mailgun](https://www.mailgun.com/)
2. Verify your email domain
3. Run the setup script:
   ```bash
   ./infrastructure/scripts/setup-mailgun.sh
   ```

4. Forward expense emails to:
   ```
   your-email@your-mailgun-domain.com
   ```

### Email Format

Simply forward any expense receipt email. The AI will extract:
- Amount
- Date
- Merchant/Vendor
- Description

## 🗄️ Database Setup

### Using Supabase (Recommended - Free)

1. Create account at [Supabase](https://supabase.com/)
2. Create a new project
3. Run the schema from `infrastructure/supabase/seed.sql`
4. Copy connection string to backend `.env`

### Local Development (Optional)

```bash
docker run -d \
  --name kts-postgres \
  -e POSTGRES_USER=kts \
  -e POSTGRES_PASSWORD=kts \
  -e POSTGRES_DB=kts_db \
  -p 5432:5432 \
  postgres:14
```

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GROQ_API_KEY=your-groq-key
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-domain
CLOUDFLARE_R2_ACCESS_KEY=your-key
CLOUDFLARE_R2_SECRET_KEY=your-secret
CLOUDFLARE_R2_BUCKET=your-bucket
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## 📦 Deployment

### Backend to Render (Free)

1. Connect GitHub repository to [Render](https://render.com/)
2. Use `infrastructure/render/render.yaml` configuration
3. Add environment variables in Render dashboard
4. Auto-deploys on push to main branch

### Mobile to iPhone (Free - Sideloading)

```bash
cd mobile
npx expo build:ios --type archive
```

Then:
1. Open Xcode
2. Connect iPhone via USB
3. Install the .ipa file
4. Trust app in Settings

**Note**: App expires every 7 days (reinstall in 2 minutes)

## 🧪 Testing

```bash
# Backend
cd backend
npm run test
npm run test:e2e

# Mobile
cd mobile
npm run test
```

## 📊 Project Structure

```
kharcha-track/
├── mobile/              # React Native app
│   ├── src/
│   │   ├── screens/    # Screen components
│   │   ├── components/ # Reusable components
│   │   ├── services/   # API clients
│   │   └── context/    # React Context
│   └── App.tsx
├── backend/            # NestJS API
│   ├── src/
│   │   ├── auth/      # Authentication
│   │   ├── expenses/  # Expense management
│   │   ├── categories/# Category management
│   │   ├── budgets/   # Budget tracking
│   │   ├── analytics/ # Reports
│   │   └── email/     # Email processing
│   └── main.ts
└── infrastructure/     # Cloud config
    ├── render/        # Render deployment
    ├── supabase/      # Database schema
    └── scripts/       # Setup scripts
```

## 🔄 Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Commit: `git commit -m "Add feature"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request
6. Auto-deploys to Render preview
7. Merge to main → Production

## 💰 Cost Breakdown

### Development & Launch: **$0**

| Service | Cost |
|---------|------|
| Render (Backend) | $0 |
| Supabase (Database) | $0 |
| Cloudflare R2 (Storage) | $0 |
| Mailgun (Email) | $0 |
| Groq Cloud (AI) | $0 |
| Apple Developer | $0 (sideloading) |
| **Total** | **$0** |

### When to Upgrade (500+ users)
- Supabase: $25/month (8GB storage)
- Render: $7/month (more RAM)
- Total: ~$32/month for 1000+ users

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup
- [x] Authentication
- [x] Category management

### Phase 2: Core Features
- [ ] Email ingestion system
- [ ] AI expense extraction
- [ ] Review queue

### Phase 3: Budget & Analytics
- [ ] Budget tracking
- [ ] Analytics dashboard
- [ ] Reports export

### Phase 4: Polish
- [ ] Manual expense entry
- [ ] Push notifications
- [ ] Performance optimization

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch
3. Make your changes
4. Submit pull request

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🆘 Support

For issues or questions:
- Open an issue on GitHub
- Email: support@kts.example.com

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Backend by [NestJS](https://nestjs.com/)
- Database by [Supabase](https://supabase.com/)
- AI powered by [Groq](https://groq.com/)

---

**Made with ❤️ for easy expense tracking**
