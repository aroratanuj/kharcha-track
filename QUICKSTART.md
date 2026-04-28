# 🚀 kharcha-track Quick Start Guide

## ✅ Installation Complete!

Both mobile and backend dependencies have been installed successfully.

## 📋 What's Ready

- ✅ Mobile app (React Native + Expo)
- ✅ Backend API (NestJS)
- ✅ All dependencies installed
- ✅ TypeScript configured
- ✅ Database entities created
- ✅ Authentication system ready

## 🎯 Next Steps (Choose Your Path)

### Option 1: Test the Mobile App (Easiest)

```bash
cd mobile
npx expo start
```

Then:
1. Install **Expo Go** on your iPhone from App Store
2. Scan the QR code in terminal
3. App will open on your phone!

**Note**: You'll see authentication screens, but they need a running backend.

---

### Option 2: Setup Free Tier Accounts (Recommended)

Before running the backend, you'll need to setup these free services:

#### 1. Supabase (Database) - 2 minutes
1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with GitHub/Google
4. Create new project (call it "kts-db")
5. Wait for database to be ready (~2 minutes)
6. Go to SQL Editor → New Query
7. Copy & paste the SQL from `infrastructure/supabase/seed.sql`
8. Click Run
9. Go to Project Settings → Database
10. Copy the "Connection string" (you'll need this)

#### 2. Groq Cloud (AI) - 1 minute
1. Go to https://groq.com/
2. Click "Build" → Sign up with Google
3. Go to Dashboard → API Keys
4. Create new API key
5. Copy the key

#### 3. Mailgun (Email) - Optional for now
Skip for initial testing - you can add this later

---

### Option 3: Run Backend Locally (Requires Accounts)

1. **Configure environment variables:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   # Replace with your Supabase connection string
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres

   # Generate a random string
   JWT_SECRET=your-random-secret-key-here

   # Add your Groq API key
   GROQ_API_KEY=gsk_[your-groq-key]

   # Other settings (leave as is for now)
   NODE_ENV=development
   PORT=3000
   ```

3. **Start backend:**
   ```bash
   npm run start:dev
   ```

   You should see:
   ```
   🚀 kharcha-track Backend is running on: http://localhost:3000
   📧 Email webhook endpoint: http://localhost:3000/api/email/webhook
   ```

---

### Option 4: Connect Mobile to Backend

1. **Create mobile .env file:**
   ```bash
   cd mobile
   cp .env.example .env
   ```

2. **Edit `mobile/.env`:**
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```

   **For your iPhone**, use your Mac's IP address:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.X:3000
   ```

   (Find your IP: System Settings → Network)

3. **Start mobile app:**
   ```bash
   npx expo start
   ```

4. **On your iPhone:**
   - Open Expo Go
   - Scan QR code
   - Try to register a new account!

---

## 🧪 Testing the Flow

Once both are running:

1. **Register a new account** in the mobile app
2. **Check Supabase** → Table Editor → Users (you should see your user)
3. **Create a category** (we'll add this UI next)
4. **Forward an email** (requires Mailgun setup - do this later)

---

## 📱 Current Features Working

### ✅ Working Now:
- User Registration
- User Login
- JWT Authentication
- API Structure
- Database Schema

### 🚧 Coming Soon:
- Category Management UI
- Expense Review Queue
- Budget Tracking
- Analytics Dashboard
- Email Processing

---

## 🛠️ Troubleshooting

### Mobile app won't load?
- Make sure Expo Go is installed
- Check your phone and Mac are on same WiFi
- Try using your Mac's IP instead of localhost

### Backend won't start?
- Check DATABASE_URL is correct in `.env`
- Make sure Supabase project is active
- Check port 3000 isn't already in use

### Can't register?
- Make sure backend is running
- Check mobile .env has correct API_URL
- Check browser console for errors

---

## 📚 Next Development Steps

### Week 1: Complete Authentication
- [ ] Add user profile screen
- [ ] Add logout functionality
- [ ] Add password reset

### Week 2: Categories
- [ ] Create category list screen
- [ ] Add category creation form
- [ ] Add category editing
- [ ] Add default categories on signup

### Week 3: Expenses
- [ ] Create expense detail screen
- [ ] Add expense editing
- [ ] Add expense confirmation
- [ ] Add bulk actions

### Week 4: Email Integration
- [ ] Setup Mailgun
- [ ] Test email webhook
- [ ] Verify AI extraction
- [ ] Add error handling

---

## 💡 Tips

1. **Use Expo Go** for development (faster than building)
2. **Check logs** in terminal for errors
3. **Use Supabase dashboard** to see data
4. **Test API** with Postman or curl
5. **Commit often** to save progress

---

## 🎉 You're Ready!

Everything is setup and ready to go. Choose your next step above and start building!

**Total Cost So Far: $0** ✅

---

**Need Help?** Check the main README.md or PROJECT_SUMMARY.md for more details.
