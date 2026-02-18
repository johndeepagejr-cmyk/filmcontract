# App Store Connect — Privacy Nutrition Label

Apple requires you to disclose what data your app collects, how it's used, and whether it's linked to the user's identity. Below are the exact answers to select in App Store Connect under **App Privacy**.

## Does your app collect data?

**Yes**

---

## Data Collection Table

For each data type below, select the corresponding options in App Store Connect.

### 1. Contact Info

| Field | Answer |
|-------|--------|
| **Data type** | Email Address |
| **Collection** | Yes — collected at registration |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

| Field | Answer |
|-------|--------|
| **Data type** | Name |
| **Collection** | Yes — collected at registration and profile setup |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

| Field | Answer |
|-------|--------|
| **Data type** | Phone Number |
| **Collection** | No |

### 2. Financial Info

| Field | Answer |
|-------|--------|
| **Data type** | Payment Info |
| **Collection** | Yes — processed by Stripe (not stored on our servers) |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

| Field | Answer |
|-------|--------|
| **Data type** | Other Financial Info |
| **Collection** | Yes — transaction history, escrow status |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

### 3. User Content

| Field | Answer |
|-------|--------|
| **Data type** | Photos or Videos |
| **Collection** | Yes — headshots, portfolio photos, audition tapes |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

| Field | Answer |
|-------|--------|
| **Data type** | Other User Content |
| **Collection** | Yes — messages, contract text, casting call descriptions |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

### 4. Identifiers

| Field | Answer |
|-------|--------|
| **Data type** | User ID |
| **Collection** | Yes — internal user ID for account management |
| **Linked to identity** | Yes |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

### 5. Usage Data

| Field | Answer |
|-------|--------|
| **Data type** | Product Interaction |
| **Collection** | Yes — via Sentry error tracking (crash reports, screen views) |
| **Linked to identity** | No |
| **Used for tracking** | No |
| **Purpose** | Analytics, App Functionality |

### 6. Diagnostics

| Field | Answer |
|-------|--------|
| **Data type** | Crash Data |
| **Collection** | Yes — via Sentry |
| **Linked to identity** | No |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

| Field | Answer |
|-------|--------|
| **Data type** | Performance Data |
| **Collection** | Yes — via Sentry |
| **Linked to identity** | No |
| **Used for tracking** | No |
| **Purpose** | App Functionality |

---

## Data NOT Collected

The following data types should be marked as **"No, we don't collect this data"**:

- Health & Fitness
- Location (Precise or Coarse)
- Sensitive Info
- Contacts (address book)
- Browsing History
- Search History
- Purchases (handled entirely by Stripe, not stored by us)
- Device ID
- Advertising Data

---

## Third-Party SDKs Disclosure

| SDK | Data Collected | Purpose |
|-----|---------------|---------|
| **Stripe** | Payment info, financial data | Payment processing |
| **Sentry** | Crash data, performance data, device info | Error tracking |
| **Expo Notifications** | Push token | Push notifications |

---

## Summary for App Store Connect Form

When filling out the form, you will go through each data type category. For each one listed above as "Yes," click it, then select:

1. **"Yes, we collect this data"**
2. Check the purpose: **"App Functionality"** (and "Analytics" for diagnostics)
3. **"Yes, this data is linked to the user's identity"** (for contact info, financial info, user content, identifiers)
4. **"No, this data is not used for tracking"** (for all categories)

For everything else, select **"No, we don't collect this data."**
