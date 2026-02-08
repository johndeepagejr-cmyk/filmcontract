# FilmContract — Google Play Submission Guide

**Author:** John dee page jr  
**Date:** February 8, 2026

---

## Prerequisites

Before submitting to Google Play, ensure you have the following:

1. **Google Play Developer Account** ($25 one-time registration fee at [play.google.com/console](https://play.google.com/console))
2. **A signed AAB (Android App Bundle)** — built using the `production` profile in `eas.json`
3. **All store listing assets** (included in this project under `assets/`)

---

## Step 1: Build the Production AAB

The `eas.json` production profile is configured to output an AAB (Android App Bundle), which is required by Google Play.

```bash
# Build production AAB
eas build --platform android --profile production
```

This will produce a `.aab` file that you can download from the EAS dashboard.

---

## Step 2: Create Your App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in the following:

| Field | Value |
|-------|-------|
| App name | FilmContract |
| Default language | English (United States) |
| App or game | App |
| Free or paid | Free |

4. Accept the declarations and click **Create app**

---

## Step 3: Store Listing

Navigate to **Grow > Store listing** and fill in:

**Main store listing:**

| Field | Value |
|-------|-------|
| App name | FilmContract |
| Short description | Professional film contract management for actors and producers. |
| Full description | *(Copy from `docs/google-play-store-listing.md`)* |

**Graphics:**

| Asset | File | Dimensions |
|-------|------|------------|
| App icon | `assets/google-play-icon-512.png` | 512 x 512 px |
| Feature graphic | `assets/google-play-feature-graphic.png` | 1024 x 500 px |
| Phone screenshots (min 2) | `assets/google-play-screenshots/screenshot-1.png` through `screenshot-5.png` | 1080 x 1920 px each |

**Categorization:**

| Field | Value |
|-------|-------|
| App category | Business |
| Tags | Film, Contracts, Entertainment, Legal |
| Contact email | support@filmcontract.app |

---

## Step 4: Content Rating

Navigate to **Policy > App content > Content rating** and complete the IARC questionnaire:

- Violence: **No**
- Sexual Content: **No**
- Language: **No**
- Controlled Substances: **No**
- User-Generated Content: **Yes** (users upload profile photos)
- Shares Location: **No**

This should result in an **Everyone** rating.

---

## Step 5: Data Safety

Navigate to **Policy > App content > Data safety** and fill in:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | Account functionality |
| Email address | Yes | No | Account functionality |
| Photos | Yes (optional) | No | App functionality (portfolio) |
| Payment info | Yes | No | Contract payments |
| App interactions | Yes | No | Analytics |

**Security practices:**
- Data is encrypted in transit: **Yes**
- Data deletion mechanism: **Yes** (users can request deletion)

---

## Step 6: Privacy Policy

Google Play requires a privacy policy URL. The app includes a privacy policy screen at `/legal/privacy`. You need to host this at a public URL.

**Option A:** Use the deployed web version URL (e.g., `https://your-domain.com/legal/privacy`)

**Option B:** Host the privacy policy as a standalone webpage and enter that URL in the Play Console.

---

## Step 7: Target Audience & Ads

Navigate to **Policy > App content > Target audience**:

- Target age group: **18 and over** (business/professional app)
- Contains ads: **No**

---

## Step 8: Upload the AAB

Navigate to **Release > Production** (or **Testing > Internal testing** for initial testing):

1. Click **Create new release**
2. Upload the `.aab` file from your EAS build
3. Add release notes:

```
Initial release of FilmContract — the professional film contract management platform.

• Create and manage film industry contracts with industry-standard templates
• Browse and connect with verified actors and producers
• Digitally sign contracts with legally binding e-signatures
• Process payments securely through the platform
• Build your professional profile with portfolio photos and reviews
• Track contract status and payment history with analytics
```

4. Click **Review release** then **Start rollout to production**

---

## Step 9: Review & Approval

Google Play typically reviews new apps within **1-3 business days**. During review, they check for:

- Policy compliance (content, privacy, data safety)
- Technical quality (crashes, ANRs)
- Store listing accuracy

If rejected, you'll receive specific feedback on what needs to change.

---

## Asset Checklist

| Asset | Location | Status |
|-------|----------|--------|
| App icon (512x512) | `assets/google-play-icon-512.png` | Ready |
| Feature graphic (1024x500) | `assets/google-play-feature-graphic.png` | Ready |
| Screenshot 1 — Home | `assets/google-play-screenshots/screenshot-1.png` | Ready |
| Screenshot 2 — Templates | `assets/google-play-screenshots/screenshot-2.png` | Ready |
| Screenshot 3 — Profile | `assets/google-play-screenshots/screenshot-3.png` | Ready |
| Screenshot 4 — Signing | `assets/google-play-screenshots/screenshot-4.png` | Ready |
| Screenshot 5 — Payment | `assets/google-play-screenshots/screenshot-5.png` | Ready |
| Store listing text | `docs/google-play-store-listing.md` | Ready |
| Privacy policy (in-app) | `app/legal/privacy.tsx` | Ready |
| Terms of service (in-app) | `app/legal/terms.tsx` | Ready |
| EAS config (AAB production) | `eas.json` | Ready |

---

## Important Notes

1. **Google Play requires AAB format** (not APK) for new apps. The `eas.json` production profile is already configured for this.

2. **App signing:** Google Play manages app signing for AAB uploads. On your first upload, Google will generate and manage the signing key. EAS Build handles the upload key automatically.

3. **Copyright:** All content and code is copyright John dee page jr. Ensure this is reflected in your developer account settings.

4. **Updates:** For future updates, increment the version in `app.config.ts`, build a new AAB, and upload to the Play Console. The `autoIncrement` setting in `eas.json` handles versionCode automatically.
