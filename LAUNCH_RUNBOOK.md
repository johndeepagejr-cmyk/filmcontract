# FilmContract Launch Runbook

This document is the single source of truth for launching FilmContract on the App Store and Google Play. Follow each section in order. Check off items as you complete them.

---

## 1. Pre-Launch Verification

### 1.1 Stripe Live Mode

| Step | Action | Verification |
|------|--------|-------------|
| 1 | Confirm `STRIPE_SECRET_KEY` starts with `sk_live_` | Check server startup log: "Mode: 🟢 LIVE" |
| 2 | Confirm `STRIPE_PUBLISHABLE_KEY` starts with `pk_live_` | Check server startup log |
| 3 | Create webhook endpoint in Stripe Dashboard | URL: `https://YOUR_DOMAIN/api/stripe/webhooks` |
| 4 | Set `STRIPE_WEBHOOK_SECRET` from webhook endpoint | Check server startup log: "Webhook Secret: ✅ Set" |
| 5 | Enable the following webhook events | See list below |
| 6 | Test $1 escrow charge with real card | Create contract → Fund escrow → Verify charge in Stripe Dashboard |
| 7 | Test release to actor Connect account | Release escrow → Verify transfer minus 7.5% fee |
| 8 | Test featured casting boost purchase | Create casting → Boost → Verify $19 charge |

**Required Webhook Events:**

```
payment_intent.succeeded
payment_intent.payment_failed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
account.updated
transfer.created
```

### 1.2 Platform Fee Verification

The platform fee is **7.5%** and is calculated as:

```
platformFee = Math.round(grossAmount * 0.075 * 100) / 100
netToActor = grossAmount - platformFee
```

**Test with these amounts to verify rounding:**

| Gross Amount | Platform Fee (7.5%) | Net to Actor |
|-------------|-------------------|-------------|
| $100.00 | $7.50 | $92.50 |
| $500.00 | $37.50 | $462.50 |
| $1,000.00 | $75.00 | $925.00 |
| $1.00 | $0.08 | $0.92 |
| $49.99 | $3.75 | $46.24 |

### 1.3 Environment Variables

| Variable | Required | Where to Set | Notes |
|----------|----------|-------------|-------|
| `STRIPE_SECRET_KEY` | Yes | Server env | `sk_live_...` for production |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Server env | `pk_live_...` for production |
| `STRIPE_WEBHOOK_SECRET` | Yes | Server env | `whsec_...` from webhook endpoint |
| `SENTRY_DSN` | Recommended | Server env | From sentry.io project settings |
| `NODE_ENV` | Yes | Server env | Set to `production` |
| `DATABASE_URL` | Yes | Server env | Production PostgreSQL connection string |

### 1.4 Database

- [ ] Run `pnpm db:push` against production database
- [ ] Verify all tables exist: `users`, `contracts`, `casting_calls`, `escrow_payments`, `notifications`, `subscriptions`, `actor_profiles`
- [ ] Verify new columns: `casting_calls.is_featured`, `casting_calls.featured_until`, `users.stripe_connect_account_id`
- [ ] Create test accounts (see Section 5)

### 1.5 Security Checklist

- [ ] Rate limiting is active (100/min API, 10/min auth, 20/min payments, 5/min uploads)
- [ ] Security headers enabled (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] CORS configured for production domain only
- [ ] All API routes require authentication (except public casting feed)
- [ ] Webhook signature verification enabled (requires `STRIPE_WEBHOOK_SECRET`)
- [ ] No test/demo data in production database

---

## 2. App Store Connect (iOS)

### 2.1 Create App Listing

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click "+" → "New App"
3. Fill in:

| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | FilmContract: Cast & Pay |
| Primary Language | English (U.S.) |
| Bundle ID | (select from dropdown — must match `app.config.ts`) |
| SKU | filmcontract-ios-v1 |

### 2.2 App Information

| Field | Value |
|-------|-------|
| Subtitle | Casting, Contracts & Escrow |
| Primary Category | Entertainment |
| Secondary Category | Business |
| Content Rights | Does not contain third-party content |
| Age Rating | 17+ (Unrestricted Web Access due to payment processing) |

### 2.3 Pricing & Availability

| Field | Value |
|-------|-------|
| Price | Free |
| In-App Purchases | Pro ($49.99/mo), Studio ($199.99/mo), Featured Boost ($19-$49) |
| Availability | All territories (or select specific markets) |

### 2.4 App Privacy

Navigate to App Privacy and fill in the nutrition label. The following data types are collected:

| Data Type | Linked to Identity | Used for Tracking | Purpose |
|-----------|-------------------|-------------------|---------|
| Name | Yes | No | App Functionality |
| Email Address | Yes | No | App Functionality |
| Phone Number | Yes | No | App Functionality |
| Physical Address | No | No | App Functionality |
| Payment Info | Yes | No | App Functionality |
| Photos or Videos | Yes | No | App Functionality |
| Audio Data | Yes | No | App Functionality |
| User ID | Yes | No | App Functionality |
| Device ID | No | No | Analytics |
| Crash Data | No | No | App Functionality |
| Performance Data | No | No | App Functionality |
| Product Interaction | No | No | Analytics |
| Browsing History | No | No | Analytics |
| Search History | No | No | App Functionality |

### 2.5 Version Information

**Description (paste into App Store Connect):**

```
FilmContract is the all-in-one platform for film and TV casting. Actors discover casting calls, record broadcast-quality self-tapes with a built-in teleprompter, and get paid through secure escrow. Producers post roles, review submissions with side-by-side comparison tools, and hire talent — all with legally binding digital contracts.

ACTORS
• Browse casting calls filtered by role type, union status, and pay rate
• Record self-tapes with a professional camera featuring quality presets (720p/1080p/4K), teleprompter, and multiple takes
• Edit videos with trim, slate overlay, and compression tools
• Track submission status from applied through hired
• Get paid via Stripe Connect with transparent fee breakdown

PRODUCERS
• Post casting calls with a 4-step wizard: project setup, role creation, requirements, and publishing
• Review self-tape submissions in grid, detail, or side-by-side comparison mode
• Rate actors on Acting, Look, Voice, and Chemistry with a weighted rubric
• Hire directly into a pre-filled contract wizard
• Manage escrow payments with fund, release, and dispute controls

CONTRACTS
• Generate SAG-AFTRA, non-union, and commercial contracts
• Digital signatures with legally binding e-sign
• Automatic payment milestones tied to deliverables

PAYMENTS
• Secure escrow holds funds until work is completed
• 7.5% platform fee — transparent and predictable
• Instant payouts to actor bank accounts via Stripe Connect
• Subscription plans for unlimited access (Pro $49/mo, Studio $199/mo)
```

**Keywords (100 char limit):**

```
casting call,audition,self tape,actor,film contract,escrow payment,talent,production,hire talent,SAG
```

**What's New:**

```
Welcome to FilmContract 1.0! The complete casting-to-payment platform for film and TV.

• Discover and apply to casting calls
• Record broadcast-quality self-tapes with teleprompter
• Edit, trim, and compress videos before submission
• Digital contracts with e-signatures
• Secure escrow payments with Stripe Connect
• Producer review tools with side-by-side comparison
```

### 2.6 Screenshots

Upload screenshots for these device sizes (in order of priority):

| Device | Resolution | Required |
|--------|-----------|----------|
| iPhone 16 Pro Max (6.9") | 1320×2868 | Yes |
| iPhone 14 Pro Max (6.7") | 1290×2796 | Yes |
| iPhone 14 Plus (6.5") | 1284×2778 | Recommended |
| iPhone 14 Pro (6.1") | 1179×2556 | Recommended |
| iPad Pro 13" | 2048×2732 | If supporting iPad |

**Screenshot order (6 screens):**

1. **Casting Feed** — "Discover Your Next Role" — Shows casting call cards with filters
2. **Self-Tape Recorder** — "Record Like a Pro" — Camera UI with teleprompter overlay
3. **Video Editor** — "Edit & Perfect" — Timeline with trim handles and slate
4. **Review Pipeline** — "Hire the Best Talent" — Side-by-side comparison view
5. **Digital Contract** — "Sign Securely" — Contract preview with signature
6. **Escrow Payment** — "Get Paid, Guaranteed" — Earnings dashboard

Run `python3 scripts/generate-screenshots.py` after placing captured screens in `screenshot-captures/`.

### 2.7 App Preview Video (Optional but Recommended)

| Spec | Value |
|------|-------|
| Resolution | 1290×2796 (iPhone 14 Pro Max) |
| Duration | 15-30 seconds |
| Format | H.264, .mp4 or .mov |
| Max Size | 500 MB |

**Scene Script (30 seconds):**

| Time | Scene | Caption |
|------|-------|---------|
| 0-3s | App icon → splash screen | "FilmContract" |
| 3-7s | Scrolling casting feed | "Discover casting calls" |
| 7-11s | Recording self-tape with teleprompter | "Record broadcast-quality self-tapes" |
| 11-15s | Editing video with trim/slate | "Edit and perfect your audition" |
| 15-19s | Producer reviewing submissions side-by-side | "Review talent with pro tools" |
| 19-23s | Signing digital contract | "Sign contracts digitally" |
| 23-27s | Escrow payment release | "Secure escrow payments" |
| 27-30s | Logo + tagline | "Cast. Contract. Pay." |

### 2.8 Review Information

**App Review Notes (paste into App Store Connect):**

```
TEST ACCOUNTS:

Actor Account:
Email: testactor@filmcontract.app
Password: TestActor2026!

Producer Account:
Email: testproducer@filmcontract.app
Password: TestProducer2026!

TESTING FLOW:

Actor Flow (~5 minutes):
1. Log in with actor account
2. Browse casting calls on Home tab
3. Tap any casting call to view details
4. Tap "Submit Self-Tape" → use "Record" or "Choose from Library"
5. Complete the 3-step submission (video, slate info, review)
6. Check "My Submissions" from Home screen
7. View Notifications (bell icon)
8. View Earnings (dollar icon)

Producer Flow (~5 minutes):
1. Log in with producer account
2. View active castings on Home tab
3. Tap "Post New Casting" to see the 4-step wizard
4. Tap any casting → "Review Submissions" to see the review tools
5. Try Grid, Detail, and Compare tabs
6. Rate an actor and use quick tags
7. Tap "Hire + Contract" to see pre-filled contract wizard
8. View Payments dashboard

NOTES:
- Camera and microphone permissions are requested for self-tape recording
- Push notifications are used for submission status updates and payment alerts
- Stripe is used for payment processing (escrow, subscriptions, featured boosts)
- All payment flows work in live mode with real Stripe integration
- The app requires internet connectivity for all features
```

### 2.9 Submit for Review

- [ ] All screenshots uploaded (minimum: 6.7" iPhone)
- [ ] App Preview video uploaded (optional)
- [ ] Description, keywords, and What's New filled in
- [ ] Privacy nutrition label completed
- [ ] Review notes with test accounts provided
- [ ] Build uploaded via Xcode or EAS Build
- [ ] Click "Submit for Review"

---

## 3. Google Play Console (Android)

### 3.1 Create App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in:

| Field | Value |
|-------|-------|
| App name | FilmContract: Cast & Pay - Casting Calls |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |

### 3.2 Store Listing

| Field | Value |
|-------|-------|
| Short description (80 chars) | Find casting calls, record self-tapes, sign contracts, get paid with escrow. |
| Full description | (Same as iOS, see Section 2.5) |
| App icon | 512×512 PNG (use `assets/images/icon.png`) |
| Feature graphic | 1024×500 PNG |
| Screenshots | Phone: 1080×1920 minimum, 2-8 screenshots |

### 3.3 Content Rating (IARC)

Answer the questionnaire as follows:

| Question | Answer |
|----------|--------|
| Violence | No |
| Sexual content | No |
| Language | No |
| Controlled substances | No |
| User-generated content | Yes (self-tape videos, profile photos) |
| Shares user location | No |
| Digital purchases | Yes (subscriptions, featured boost) |
| Personal information | Yes (name, email, payment info) |

**Expected Rating:** Everyone / PEGI 3 / USK 0

### 3.4 Data Safety

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | App functionality, Account management |
| Email | Yes | No | App functionality, Account management |
| Phone | Yes | No | App functionality |
| Address | Yes | No | App functionality |
| Payment info | Yes | Yes (Stripe) | App functionality |
| Photos/Videos | Yes | No | App functionality |
| Audio | Yes | No | App functionality |
| App interactions | Yes | No | Analytics |
| Crash logs | Yes | No | Analytics |
| Device ID | Yes | No | Analytics |

- Data is encrypted in transit: **Yes**
- Users can request data deletion: **Yes**
- Data deletion request URL: `https://filmcontract.app/privacy#deletion`

### 3.5 Target Audience

| Field | Value |
|-------|-------|
| Target age group | 18 and over |
| Appeals to children | No |
| Contains ads | No |

### 3.6 App Access

Provide test credentials (same as iOS):

```
Actor: testactor@filmcontract.app / TestActor2026!
Producer: testproducer@filmcontract.app / TestProducer2026!
```

### 3.7 Build & Submit

- [ ] Build AAB with `eas build --platform android`
- [ ] Upload AAB to Production track (or Internal Testing first)
- [ ] All store listing fields completed
- [ ] Content rating questionnaire submitted
- [ ] Data safety section completed
- [ ] Target audience declared
- [ ] Test credentials provided
- [ ] Click "Submit for Review"

---

## 4. Post-Launch Monitoring

### 4.1 Day 1 Checklist

| Time | Action | Tool |
|------|--------|------|
| Morning | Check Stripe Dashboard for payment issues | [Stripe Dashboard](https://dashboard.stripe.com) |
| Morning | Check Sentry for crash reports | [Sentry](https://sentry.io) |
| Morning | Check App Store Connect for review status | [App Store Connect](https://appstoreconnect.apple.com) |
| Afternoon | Check Google Play Console for review status | [Play Console](https://play.google.com/console) |
| Evening | Review user feedback and ratings | Both stores |

### 4.2 Week 1 Monitoring

| Metric | Target | Where to Check |
|--------|--------|---------------|
| Crash-free rate | > 99.5% | Sentry / App Store Connect |
| API error rate | < 1% | Server logs / Sentry |
| Payment success rate | > 95% | Stripe Dashboard |
| App rating | > 4.0 stars | App Store / Play Store |
| Daily active users | Track baseline | Analytics |

### 4.3 Stripe Daily Check

1. Open [Stripe Dashboard](https://dashboard.stripe.com)
2. Check **Payments** → verify no failed charges
3. Check **Connect** → verify actor accounts are active
4. Check **Subscriptions** → verify billing is working
5. Check **Webhooks** → verify no failed deliveries
6. Check **Disputes** → respond within 7 days

### 4.4 Incident Response

| Severity | Example | Response Time | Action |
|----------|---------|--------------|--------|
| P0 - Critical | Payments broken, app crashes on launch | 1 hour | Hotfix + emergency review |
| P1 - High | Feature broken for all users | 4 hours | Fix in next build |
| P2 - Medium | Feature broken for some users | 24 hours | Scheduled fix |
| P3 - Low | UI glitch, typo | 1 week | Batch with next release |

### 4.5 Rollback Plan

If a critical issue is found after launch:

1. **iOS:** In App Store Connect → select previous build → "Submit for Review" (expedited review)
2. **Android:** In Play Console → Release Management → select previous release → "Roll out"
3. **Server:** Use `webdev_rollback_checkpoint` to restore previous server state
4. **Database:** Do NOT rollback database — only add new migrations forward

---

## 5. Test Account Setup

Create these accounts in your production database before submitting for review:

### Actor Test Account

```sql
-- Create after OAuth setup, or use the app's registration flow
-- Email: testactor@filmcontract.app
-- Password: TestActor2026!
-- Role: actor
-- Name: Taylor Morgan
-- Profile: Complete with headshot, resume, demo reel
```

### Producer Test Account

```sql
-- Email: testproducer@filmcontract.app
-- Password: TestProducer2026!
-- Role: producer
-- Name: Jordan Rivera
-- Company: Sunset Productions
-- Profile: Complete with 2-3 active casting calls
```

### Seed Data

For a complete review experience, ensure:

- [ ] 3-5 active casting calls with different role types
- [ ] 2-3 submissions on at least one casting call
- [ ] 1 signed contract between test accounts
- [ ] 1 funded escrow payment

---

## 6. Legal Requirements

Before submitting to either store:

- [ ] **Privacy Policy** published at a public URL (required by both stores)
- [ ] **Terms of Service** published at a public URL
- [ ] **EULA** (End User License Agreement) — can use Apple's standard EULA
- [ ] **Support URL** — working contact page or email
- [ ] **DMCA/Copyright** policy for user-generated content (self-tapes)

Suggested URLs:
- Privacy: `https://filmcontract.app/privacy`
- Terms: `https://filmcontract.app/terms`
- Support: `https://filmcontract.app/support`

---

## 7. Build Commands

### iOS Build (EAS)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for App Store
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios
```

### Android Build (EAS)

```bash
# Build AAB for Play Store
eas build --platform android --profile production

# Submit to Play Console
eas submit --platform android
```

### Local Testing

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Web Preview
npx expo start --web
```

---

## Quick Reference

| Item | Status | Notes |
|------|--------|-------|
| Stripe Live Keys | ✅ Configured | `sk_live_` and `pk_live_` set |
| Webhook Secret | ⚠️ Needed | Create endpoint in Stripe Dashboard |
| Sentry DSN | ⚠️ Optional | Set `SENTRY_DSN` for error tracking |
| Platform Fee | ✅ Verified | 7.5% using `PLATFORM_FEE_RATE = 0.075` |
| Rate Limiting | ✅ Active | 100/min API, 10/min auth, 20/min payments |
| Security Headers | ✅ Active | HSTS, CSP, X-Frame-Options |
| Test Accounts | ⚠️ Needed | Create before store submission |
| Privacy Policy | ⚠️ Needed | Publish at public URL |
| Screenshots | ⚠️ Needed | Run generator after capturing screens |
