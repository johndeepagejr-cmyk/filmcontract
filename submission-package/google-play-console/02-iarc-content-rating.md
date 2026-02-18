# Google Play Console — IARC Content Rating Questionnaire

The International Age Rating Coalition (IARC) questionnaire is required for all Google Play submissions. Below are the exact answers to select during the rating process.

## How to Access

Google Play Console → Your App → **Content rating** → Start questionnaire → Select **"Utility, Productivity, Communication, or Other"** as the category.

---

## Questionnaire Answers

### Category Selection

| Question | Answer |
|----------|--------|
| What type of app is this? | **Utility, Productivity, Communication, or Other** |

### Violence

| Question | Answer |
|----------|--------|
| Does the app contain violence? | **No** |
| Does the app depict violence against characters? | **No** |
| Does the app contain graphic violence? | **No** |
| Does the app contain realistic violence? | **No** |

### Sexuality

| Question | Answer |
|----------|--------|
| Does the app contain sexual content? | **No** |
| Does the app contain nudity? | **No** |
| Does the app contain sexual themes? | **No** |

### Language

| Question | Answer |
|----------|--------|
| Does the app contain profanity or crude humor? | **No** (the app itself does not, though user-generated messages could) |

### Controlled Substances

| Question | Answer |
|----------|--------|
| Does the app reference or depict the use of controlled substances? | **No** |
| Does the app reference or depict the use of tobacco? | **No** |
| Does the app reference or depict the use of alcohol? | **No** |

### User Interaction

| Question | Answer |
|----------|--------|
| Does the app allow users to interact or exchange information? | **Yes** |
| Does the app allow users to communicate with each other? | **Yes** (messaging feature) |
| Does the app share a user's location with other users? | **No** |
| Does the app allow users to purchase digital goods? | **No** (payments are for real-world services, not digital goods) |

### User-Generated Content

| Question | Answer |
|----------|--------|
| Does the app contain user-generated content? | **Yes** (casting calls, audition tapes, messages, profiles) |
| Can users create content visible to other users? | **Yes** |
| Is the user-generated content moderated? | **Yes** (content is associated with verified accounts) |

### Personal Information

| Question | Answer |
|----------|--------|
| Does the app collect personal information? | **Yes** (name, email, payment info) |
| Does the app share personal information with third parties? | **Yes** (Stripe for payments, Sentry for error tracking) |

### Miscellaneous

| Question | Answer |
|----------|--------|
| Does the app contain ads? | **No** |
| Does the app allow purchases? | **No** (the app facilitates service payments, not in-app purchases) |
| Is the app a news app? | **No** |

---

## Expected Rating Result

Based on these answers, the app should receive a rating of **Rated for 12+** or **Teen** across most regions:

| Rating System | Expected Rating |
|---------------|----------------|
| ESRB (North America) | Teen |
| PEGI (Europe) | 12 |
| USK (Germany) | 12 |
| GRAC (South Korea) | 12 |
| ClassInd (Brazil) | 12 |
| IARC Generic | 12+ |

The rating is driven primarily by the user interaction and user-generated content features. If the messaging feature were removed, the rating would drop to "Everyone."

---

## Data Safety Section

Google Play also requires a **Data Safety** section (similar to Apple's privacy nutrition label). Use the same data as the Apple privacy label document, with these Google-specific mappings:

| Data Type | Collected | Shared | Purpose |
|-----------|-----------|--------|---------|
| Name | Yes | No | App functionality, Account management |
| Email address | Yes | No | App functionality, Account management |
| Payment info | Yes | Yes (Stripe) | App functionality |
| Photos/Videos | Yes | No | App functionality |
| Messages | Yes | No | App functionality |
| App interactions | Yes | No | Analytics |
| Crash logs | Yes | Yes (Sentry) | App functionality |
| Device/other IDs | Yes | No | App functionality |

For the "Is data encrypted in transit?" question: **Yes** (all API communication uses HTTPS/TLS).

For the "Can users request data deletion?" question: **Yes** (users can delete their account through the Profile settings).
