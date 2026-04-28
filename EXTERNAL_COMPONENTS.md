# kharcha-track - External Components & Cost Breakdown

## Overview
This document lists ALL external services, libraries, and platforms used in the Kharcha Tracking System (kharcha-track) with their associated costs.

---

## Development Tools (FREE)

| Component | Purpose | Cost | Notes |
|-----------|---------|------|-------|
| **Node.js** | Backend runtime | FREE | Open source |
| **TypeScript** | Type safety | FREE | Open source |
| **React Native** | Mobile app framework | FREE | Open source |
| **Expo** | React Native tooling | FREE | Open source, some paid services available |
| **NestJS** | Backend framework | FREE | Open source |
| **Git** | Version control | FREE | Open source |
| **GitHub** | Code repository | FREE | Private repos free |
| **VS Code** | Code editor | FREE | Open source |
| **ESLint** | Code linting | FREE | Open source |
| **Prettier** | Code formatting | FREE | Open source |

**Subtotal: $0**

---

## Mobile App Dependencies (FREE)

| Package | Purpose | Cost | Notes |
|---------|---------|------|-------|
| React Navigation | Screen navigation | FREE | Open source |
| Axios | HTTP client | FREE | Open source |
| React Query | Data fetching | FREE | Open source |
| Zustand/Redux | State management | FREE | Open source |
| React Hook Form | Form handling | FREE | Open source |
| Date-fns | Date utilities | FREE | Open source |
| Recharts | Charts for analytics | FREE | Open source |
| Expo components | UI components | FREE | Open source |

**Subtotal: $0**

---

## Backend Dependencies (FREE)

| Package | Purpose | Cost | Notes |
|---------|---------|------|-------|
| Express/Fastify | HTTP server | FREE | Open source |
| TypeORM/Prisma | Database ORM | FREE | Open source |
| JWT | Authentication | FREE | Open source |
| Bcrypt | Password hashing | FREE | Open source |
| Class-validator | Input validation | FREE | Open source |
| Swagger | API documentation | FREE | Open source |
| Winston | Logging | FREE | Open source |

**Subtotal: $0**

---

## Hosting & Infrastructure (ZERO COST TIER)

### Backend Hosting

| Service | Provider | Free Tier | Paid Plans | When to Upgrade |
|---------|----------|-----------|------------|-----------------|
| **Render** | Backend hosting | ✅ FREE | $7/month | After 500+ users or need >512MB RAM |
| Free tier details: | | | | |
| - RAM | 512 MB | | | |
| - CPU | 0.1 vCPU | | | |
| - Hours | 750 hours/month (enough for 24/7) | | | |
| - Bandwidth | 100 GB/month | | | |

**Cost: $0/month (free tier)**

---

### Database

| Service | Provider | Free Tier | Paid Plans | When to Upgrade |
|---------|----------|-----------|------------|-----------------|
| **Supabase** | PostgreSQL database | ✅ FREE | $25/month | After 500-1000 users or >500MB data |
| Free tier details: | | | | |
| - Storage | 500 MB | | | |
| - Bandwidth | 2 GB/month | | | |
| - File storage | 50 MB | | | |
| - API requests | Unlimited | | | |

**Cost: $0/month (free tier)**

---

### File Storage (Email Attachments, Receipts)

| Service | Provider | Free Tier | Paid Plans | When to Upgrade |
|---------|----------|-----------|------------|-----------------|
| **Cloudflare R2** | Object storage | ✅ FREE | $0.015/GB | After 10GB storage |
| Free tier details: | | | | |
| - Storage | 10 GB | | | |
| - Class A operations | 1M/month | | | |
| - Class B operations | 10M/month | | | |
| - Egress (data out) | FREE | | | No data transfer fees! |

**Cost: $0/month (free tier)**

---

### Email Service (Receive Forwarded Emails)

| Service | Provider | Free Tier | Paid Plans | When to Upgrade |
|---------|----------|-----------|------------|-----------------|
| **Mailgun** | Email receiving | ✅ FREE | $35/month | After 1000 emails/month |
| Free tier details: | | | | |
| - Emails | 1000/month | | | |
| - Email storage | 5 GB | | | |
| - Webhooks | Unlimited | | | |

**Cost: $0/month (free tier)**

---

### AI/ML Service (Email Parsing)

| Service | Provider | Free Tier | Paid Plans | Recommendation |
|---------|----------|-----------|------------|----------------|
| **Groq Cloud** | AI inference | ✅ FREE (beta) | TBD after beta | ⭐ RECOMMENDED |
| Free tier details: | | | | |
| - Model | Llama 3 70B | | | Excellent for extraction |
| - Speed | 70x faster than OpenAI | | | |
| - Requests | Unlimited (during beta) | | | |
| | | | | |
| **OpenAI API** | AI inference | ❌ No free tier | Pay per use | Alternative option |
| Paid pricing: | | | | |
| - GPT-4o Mini | $0.15/1M input tokens | | | ~$5-15/month for 100 users |
| - GPT-4o | $2.50/1M input tokens | | | ~$50-150/month for 100 users |

**Cost: $0/month (Groq Cloud during beta) OR $5-150/month (OpenAI)**

---

## CI/CD Pipeline (FREE)

| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| **GitHub Actions** | Automated testing & deployment | FREE | 2000 minutes/month free |
| **Render Auto-deploy** | Automatic deployments | FREE | Included in Render free tier |

**Subtotal: $0**

---

## Monitoring & Analytics (FREE)

| Service | Purpose | Cost | Notes |
|---------|---------|------|-------|
| **Render Dashboard** | Backend logs & metrics | FREE | Included |
| **Supabase Dashboard** | Database metrics | FREE | Included |
| **Sentry** (optional) | Error tracking | FREE tier | 5K errors/month free |

**Subtotal: $0**

---

## Development Environment (FREE)

| Tool | Purpose | Cost | Notes |
|------|---------|------|-------|
| **Docker Desktop** | Local development | FREE | For local database |
| **Postman** | API testing | FREE | For testing endpoints |
| **iOS Simulator** | iPhone testing | FREE | Included with Xcode |
| **Xcode** | iOS development | FREE | Mac App Store |

**Subtotal: $0**

---

## TOTAL COST BREAKDOWN

### 🎉 ZERO COST SCENARIO (Recommended)

| User Count | Monthly Cost | Annual Cost |
|------------|--------------|-------------|
| **0 - 100 users** | **$0** | **$0** |
| **100 - 500 users** | **$0** | **$0** |
| **500 - 1000 users** | **$0** | **$0** |

**Conditions:**
- Use Groq Cloud (free during beta)
- Stay within free tier limits
- All services: Render, Supabase, Cloudflare R2, Mailgun

---

### 💰 PAID SCENARIO (If Upgrading)

| User Count | Monthly Cost | Annual Cost | What You Pay For |
|------------|--------------|-------------|------------------|
| **0 - 500 users** | **$0** | **$0** | Everything free |
| **500 - 1000 users** | **$25** | **$300** | Supabase upgrade (8GB DB) |
| **1000 - 5000 users** | **$57** | **$684** | + Render ($7) + Mailgun ($35) |
| **5000+ users** | **$150+** | **$1800+** | + More resources, scaling |

**Note**: If Groq Cloud introduces pricing after beta, add $10-50/month for AI service.

---

## ONE-TIME COSTS

| Item | Cost | Notes |
|------|------|-------|
| **Apple Developer Account** | $99/year | Required for App Store |
| **Domain Name** | $10-15/year | Optional (for custom email domain) |
| **Mac Computer** | $599+ | Required for iOS development |
| **iPhone Test Device** | $399+ | Optional, can use simulator |

**Total One-Time: $99 (Apple Developer) + Hardware costs**

---

## FREE TIER LIMITS & ALERTS

### Set Up Alerts (Free)

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Database storage | 400 MB / 500 MB | Prepare to upgrade Supabase |
| Monthly emails | 800 / 1000 | Prepare to upgrade Mailgun |
| Backend memory | 450 MB / 512 MB | Prepare to upgrade Render |
| API response time | >500ms | Optimize queries or upgrade |

---

## COST COMPARISON: Traditional vs Free Tier

### Traditional AWS Setup (What we AVOIDED)

| Service | Monthly Cost |
|---------|--------------|
| AWS EC2 | $30-50 |
| AWS RDS PostgreSQL | $50-200 |
| AWS S3 | $20-50 |
| AWS SES | $10-20 |
| AWS Lambda | $5-10 |
| Data Transfer | $20-50 |
| **TOTAL** | **$135-380/month** |

### Our Free Tier Setup

| Service | Monthly Cost |
|---------|--------------|
| Render | $0 |
| Supabase | $0 |
| Cloudflare R2 | $0 |
| Mailgun | $0 |
| Groq Cloud | $0 |
| **TOTAL** | **$0/month** |

**Savings: $135-380/month = $1,620-4,560/year!**

---

## HIDDEN COSTS TO WATCH OUT FOR

### ❗ Potential Costs (Can Avoid)

| Item | Cost | How to Avoid |
|------|------|--------------|
| OpenAI API (if used) | $5-150/month | Use Groq Cloud instead |
| Paid SMS notifications | $0.05/SMS | Use free push notifications |
| Custom domain SSL | $10-50/year | Use Render's free SSL |
| Third-party analytics | $10-100/month | Use Supabase built-in analytics |
| Error tracking (Sentry paid) | $26/month | Use free tier or Supabase logs |

---

## DEPLOYMENT COSTS

### Initial Setup: $0
- All accounts: FREE
- All services: FREE tier
- Deployment: FREE (automatic via GitHub + Render)

### Ongoing Operations: $0/month
- Hosting: FREE
- Database: FREE
- Email receiving: FREE (up to 1000/month)
- AI processing: FREE (Groq Cloud)
- Monitoring: FREE

### When You Start Making Money:
- 500+ users: Consider $25/month Supabase upgrade
- 1000+ users: Consider $57/month total upgrades
- 5000+ users: Scale accordingly

---

## SUMMARY

### ✅ COMPLETELY FREE START
- **$0 to launch**
- **$0 for first 500 users**
- **$0 for first 6-12 months** (depending on growth)

### 💡 WHEN TO START PAYING
- When database exceeds 500MB (~500-1000 users)
- When you need >512MB RAM (~500+ users)
- When you exceed 1000 emails/month
- When Groq Cloud ends free beta (use OpenAI Mini as fallback)

### 🎯 RECOMMENDED PATH
1. **Launch**: FREE tier (everything)
2. **Grow to 500 users**: Still FREE
3. **500-1000 users**: Upgrade Supabase ($25/month)
4. **1000+ users**: Upgrade all services (~$57/month)
5. **Profit!**: Reinvest revenue into scaling

---

## FINAL ANSWER: How Much Does It Cost?

### To Launch: **$0**
### First Year (up to 500 users): **$0** (+ $99 Apple Developer fee)
### After Launch (500-1000 users): **$25/month**
### Scaling (1000+ users): **$57-150/month**

**The only REQUIRED cost is Apple Developer account: $99/year**

Everything else can be 100% FREE until you have hundreds of users!