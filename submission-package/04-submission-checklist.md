# Submission Checklist — Step-by-Step Instructions

## Part 1: Pre-Submission Requirements

Before submitting to either store, ensure these items are complete:

| Requirement | Status | Notes |
|-------------|--------|-------|
| Apple Developer Account ($99/year) | ☐ | [developer.apple.com](https://developer.apple.com) |
| Google Play Developer Account ($25 one-time) | ☐ | [play.google.com/console](https://play.google.com/console) |
| Stripe live mode activated | ☐ | `sk_live_` key in production |
| Stripe webhook endpoint configured | ☐ | See `stripe-checkout/01-webhook-configuration.md` |
| Privacy policy hosted at live URL | ☐ | Currently at `/privacy` on your server |
| Terms of service hosted at live URL | ☐ | Currently at `/terms` on your server |
| Custom domain configured | ☐ | e.g., `filmcontract.app` |
| Test accounts created with seed data | ☐ | Already done: `testactor@` and `testproducer@` |
| App icon at 1024×1024 (iOS) and 512×512 (Android) | ☐ | Export from `assets/images/icon.png` |

---

## Part 2: App Store Connect Submission

### Step 1 — Create the App (5 minutes)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in:
   - **Platform:** iOS
   - **Name:** FilmContract
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select the bundle ID from your provisioning profile
   - **SKU:** `filmcontract-ios-v1`
4. Click **"Create"**

### Step 2 — App Information (10 minutes)

1. Go to **App Information** in the sidebar
2. Fill in:
   - **Subtitle:** Contracts & Casting for Film
   - **Category:** Primary = Entertainment, Secondary = Business
   - **Content Rights:** Select "Yes, this app contains third-party content" → "Yes, I have the rights"
   - **Age Rating:** Click "Edit" and answer the questionnaire (see `app-store-connect/05-app-review-info.md`)
3. Under **Privacy Policy URL:** Enter `https://filmcontract.app/privacy`
4. Click **"Save"**

### Step 3 — Pricing and Availability (2 minutes)

1. Go to **Pricing and Availability**
2. Set **Price:** Free
3. **Availability:** Select all countries/regions you want to launch in
4. Click **"Save"**

### Step 4 — Prepare the Version (20 minutes)

1. Go to your app version (e.g., **1.0 Prepare for Submission**)
2. **Screenshots:** Upload for each device size (see `app-store-connect/02-screenshot-specs.md`)
3. **App Preview:** Upload the video if recorded (see `app-store-connect/03-app-preview-video-script.md`)
4. **Promotional Text:** Paste from `app-store-connect/01-listing-copy.md`
5. **Description:** Paste from `app-store-connect/01-listing-copy.md`
6. **Keywords:** Paste from `app-store-connect/01-listing-copy.md`
7. **Support URL:** `https://filmcontract.app/support`
8. **Marketing URL:** `https://filmcontract.app`

### Step 5 — App Review Information (5 minutes)

1. Scroll to **App Review Information**
2. **Sign-in required:** Yes
3. **Username:** `testactor@filmcontract.app`
4. **Password:** `TestActor2026!`
5. **Notes:** Paste the review notes from `app-store-connect/05-app-review-info.md`
6. **Contact Information:** Fill in your name, phone, and email
7. **Demo Account URL:** (optional) Paste unlisted video link if available

### Step 6 — Privacy Nutrition Label (15 minutes)

1. Go to **App Privacy** in the sidebar
2. Click **"Get Started"**
3. Follow the answers in `app-store-connect/04-privacy-nutrition-label.md` exactly
4. Click through each data type category and select the appropriate options
5. Click **"Publish"** when complete

### Step 7 — Build and Upload (30 minutes)

1. Build the IPA using EAS Build:
   ```bash
   npx eas-cli build --platform ios --profile production
   ```
2. Or build locally with Xcode:
   - Open the `.xcworkspace` file
   - Select **"Any iOS Device"** as the target
   - **Product → Archive**
   - **Distribute App → App Store Connect → Upload**
3. Wait for the build to appear in App Store Connect (5-15 minutes)
4. Select the build in your app version

### Step 8 — Submit for Review (2 minutes)

1. Review all sections for completeness (green checkmarks)
2. Under **Version Release:** Select "Manually release this version" (recommended for first launch)
3. Click **"Submit for Review"**

### Expected Timeline

| Stage | Duration |
|-------|----------|
| Build processing | 15-30 minutes |
| Review queue | 24-48 hours (average) |
| Review itself | 1-2 hours |
| Total | 1-3 days |

---

## Part 3: Google Play Console Submission

### Step 1 — Create the App (5 minutes)

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name:** FilmContract: Casting & Contracts
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept the declarations and click **"Create app"**

### Step 2 — Store Listing (15 minutes)

1. Go to **Main store listing**
2. **Short description:** Paste from `google-play-console/01-listing-copy.md`
3. **Full description:** Paste from `google-play-console/01-listing-copy.md`
4. **App icon:** Upload 512×512 PNG
5. **Feature graphic:** Upload 1024×500 (see `google-play-console/03-screenshot-and-graphic-specs.md`)
6. **Phone screenshots:** Upload 2-8 screenshots
7. **Tablet screenshots:** Upload if supporting tablets
8. Click **"Save"**

### Step 3 — Content Rating (5 minutes)

1. Go to **Content rating**
2. Click **"Start questionnaire"**
3. Select **"Utility, Productivity, Communication, or Other"**
4. Answer questions per `google-play-console/02-iarc-content-rating.md`
5. Click **"Submit"**

### Step 4 — Data Safety (10 minutes)

1. Go to **Data safety**
2. Answer the data collection questions using the same data from the Apple privacy label
3. See the "Data Safety Section" in `google-play-console/02-iarc-content-rating.md`
4. Click **"Submit"**

### Step 5 — App Content (5 minutes)

1. Go to **App content** and complete all required sections:
   - **Privacy policy:** `https://filmcontract.app/privacy`
   - **Ads:** App does not contain ads
   - **App access:** App requires login → Provide test credentials
   - **Content ratings:** Already completed in Step 3
   - **Target audience:** 18+ (professional tool)
   - **News app:** No

### Step 6 — Build and Upload (20 minutes)

1. Build the AAB using EAS Build:
   ```bash
   npx eas-cli build --platform android --profile production
   ```
2. Download the `.aab` file from the EAS dashboard
3. In Google Play Console, go to **Production** → **Create new release**
4. Upload the `.aab` file
5. Add release notes:
   ```
   Initial release of FilmContract — the all-in-one platform for independent film professionals. Post casting calls, submit auditions, create contracts, and process secure escrow payments.
   ```
6. Click **"Review release"** → **"Start rollout to Production"**

### Expected Timeline

| Stage | Duration |
|-------|----------|
| Build processing | Immediate |
| Review | 1-7 days (first submission takes longer) |
| Total | 2-7 days |

---

## Part 4: Common Rejection Reasons and How to Avoid Them

### Apple App Store

| Rejection Reason | How to Avoid |
|-----------------|--------------|
| **Guideline 2.1 — App Completeness** | Ensure all features work. No placeholder content, broken links, or "coming soon" screens. Test every flow end-to-end. |
| **Guideline 2.3 — Accurate Metadata** | Screenshots must show the actual app. Description must match functionality. Don't overclaim. |
| **Guideline 3.1.1 — In-App Purchase** | FilmContract processes payments for real-world services (not digital goods), so Apple's IAP requirement does NOT apply. If questioned, explain: "Payments are for real-world film production services between producers and actors, not digital content." |
| **Guideline 4.0 — Design** | The app must feel native to iOS. Use standard navigation patterns, support dark mode, handle safe areas properly. (Already handled by the codebase.) |
| **Guideline 5.1.1 — Data Collection** | Privacy nutrition label must match actual data collection. Ensure the label is accurate per our document. |
| **Guideline 5.1.2 — Data Use and Sharing** | Disclose all third-party SDKs (Stripe, Sentry). Already covered in the privacy label. |
| **Login/Registration Issues** | Provide working test accounts. Ensure the reviewer can complete the full flow without errors. |

### Google Play

| Rejection Reason | How to Avoid |
|-----------------|--------------|
| **Policy: Payments** | Same as Apple — our payments are for real-world services, not subject to Google Play billing requirements. |
| **Policy: User Data** | Data safety section must be accurate and complete. Privacy policy must be accessible. |
| **Policy: Deceptive Behavior** | App must do what the listing says. No hidden functionality. |
| **Policy: Restricted Content** | User-generated content must have moderation capabilities. Ensure reporting/blocking features exist. |
| **Crashes/ANRs** | Test on multiple Android devices and API levels. The React Native + Expo stack handles most compatibility. |

---

## Part 5: Post-Submission Monitoring

### What to Watch

| Metric | Where to Check | Frequency |
|--------|---------------|-----------|
| Review status | App Store Connect / Play Console | Check daily until approved |
| Crash reports | Sentry dashboard | Daily |
| Payment events | Stripe Dashboard → Payments | Daily |
| User feedback | App Store / Play Store reviews | Daily for first 2 weeks |
| Download count | App Store Connect / Play Console analytics | Weekly |

### Response Timeframes

| Event | Expected Response |
|-------|------------------|
| Apple review | 24-48 hours |
| Apple rejection appeal | 1-3 business days |
| Google review (first submission) | 3-7 days |
| Google review (updates) | 1-3 days |
| Stripe account review | 1-2 business days |

### If Rejected

1. **Read the rejection reason carefully** — Apple provides specific guideline numbers
2. **Don't panic** — Most rejections are fixable in a few hours
3. **Respond via Resolution Center** (Apple) or the Play Console message (Google)
4. **Fix the issue and resubmit** — Re-reviews are typically faster (12-24 hours)
5. **If you disagree**, file an appeal with a clear explanation of why the guideline doesn't apply
