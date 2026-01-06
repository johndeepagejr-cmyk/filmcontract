# FilmContract - Comprehensive Code Report

**Author:** John Dee Page Jr  
**Project:** FilmContract - The Industry's First Mobile App for Film Contract Management  
**Date:** January 2026  
**Version:** 3bbf0a4b

---

## Executive Summary

FilmContract is a groundbreaking React Native mobile application built with Expo, TypeScript, and React 19. The application serves as the first-of-its-kind comprehensive platform for managing film industry contracts between producers and actors. The codebase spans over 80 source files organized across frontend components, backend API routes, database schemas, and utility functions.

---

## Project Architecture

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend Framework** | React Native | 0.81.5 |
| **Expo SDK** | Expo | 54.0.29 |
| **Routing** | Expo Router | 6.0.19 |
| **Styling** | NativeWind (Tailwind CSS) | 4.2.1 |
| **Language** | TypeScript | 5.9.3 |
| **State Management** | React Context + AsyncStorage | Built-in |
| **Backend Framework** | Express.js | 4.22.1 |
| **API Layer** | tRPC | 11.7.2 |
| **Database** | MySQL | Via Drizzle ORM |
| **ORM** | Drizzle ORM | 0.44.7 |
| **Authentication** | OAuth (Manus) | Built-in |
| **Payments** | Stripe | Integration Ready |
| **Notifications** | Expo Notifications | 0.32.15 |

---

## Directory Structure

```
filmcontract/
├── app/                          # Main application screens
│   ├── (tabs)/                  # Tab-based navigation
│   │   ├── index.tsx            # Home screen
│   │   ├── analytics.tsx        # Analytics dashboard
│   │   ├── profile.tsx          # User profile
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   └── create.tsx           # Contract creation
│   ├── contract/                # Contract management screens
│   │   ├── [id].tsx             # Contract detail
│   │   ├── edit/[id].tsx        # Contract editing
│   │   ├── pay/[id].tsx         # Payment screen
│   │   ├── versions/[id].tsx    # Version history
│   │   └── renew/[id].tsx       # Contract renewal
│   ├── profile/                 # Profile management
│   │   ├── edit.tsx             # Profile editing
│   │   ├── detailed-profile.tsx # Detailed profile info
│   │   ├── skills-manager.tsx   # Skills management
│   │   ├── credits-manager.tsx  # Credits tracking
│   │   ├── availability-calendar.tsx # Availability
│   │   ├── favorites.tsx        # Favorites section
│   │   ├── filmography.tsx      # Filmography
│   │   ├── qr-code.tsx          # QR code sharing
│   │   └── theme.tsx            # Portfolio theme
│   ├── actors/                  # Actor directory
│   ├── producers/               # Producer directory
│   ├── templates/               # Contract templates
│   ├── payment/                 # Payment processing
│   ├── review/                  # Review submission
│   └── _layout.tsx              # Root layout
├── components/                  # Reusable components
│   ├── ui/                      # UI components
│   │   ├── icon-symbol.tsx      # Icon mapping
│   │   └── collapsible.tsx      # Collapsible component
│   ├── auth/                    # Authentication components
│   │   ├── login-screen.tsx     # Login UI
│   │   └── role-selection-screen.tsx # Role selection
│   ├── contract-timeline.tsx    # Timeline display
│   ├── signature-capture.tsx    # Signature capture
│   ├── payment-timeline.tsx     # Payment history
│   ├── advanced-filters.tsx     # Advanced search filters
│   ├── verification-badge.tsx   # Verification display
│   ├── quick-actions-menu.tsx   # Long-press menu
│   ├── onboarding-tutorial.tsx  # Onboarding flow
│   ├── custom-header.tsx        # Custom header with back button
│   └── portfolio-layouts.tsx    # Portfolio themes
├── server/                      # Backend API
│   ├── _core/                   # Core server setup
│   │   └── index.ts             # Server entry point
│   ├── routers.ts               # tRPC route definitions
│   ├── profiles-router.ts       # Profile endpoints
│   ├── db.ts                    # Database utilities
│   └── middleware/              # Express middleware
├── drizzle/                     # Database schema
│   ├── schema.ts                # Complete schema definition
│   └── meta/                    # Migration metadata
├── hooks/                       # Custom React hooks
│   ├── use-auth.ts              # Authentication hook
│   ├── use-colors.ts            # Theme colors hook
│   └── use-color-scheme.ts      # Dark mode detection
├── lib/                         # Utility libraries
│   ├── utils.ts                 # Helper functions
│   ├── trpc.ts                  # tRPC client setup
│   ├── theme-provider.tsx       # Theme context
│   └── _core/                   # Core utilities
├── constants/                   # Application constants
│   ├── theme.ts                 # Theme configuration
│   ├── oauth.ts                 # OAuth settings
│   └── const.ts                 # General constants
├── assets/                      # Static assets
│   ├── images/                  # App icons and images
│   └── fonts/                   # Custom fonts
├── tests/                       # Test files
│   └── new-features.test.ts     # Feature tests
├── scripts/                     # Build and utility scripts
│   ├── seed-demo-data.ts        # Database seeding
│   ├── load-env.js              # Environment setup
│   └── generate_qr.mjs          # QR code generation
├── app.config.ts                # Expo configuration
├── tailwind.config.js           # Tailwind CSS config
├── theme.config.js              # Theme tokens
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
└── README.md                    # Project documentation
```

---

## Core Features Implementation

### 1. Authentication System

**File:** `components/auth/login-screen.tsx`, `hooks/use-auth.ts`

The authentication system uses OAuth integration with Manus platform. Users can sign in, select their role (Producer or Actor), and manage their accounts. The system stores authentication state in React Context and persists user data via AsyncStorage.

**Key Functions:**
- OAuth login with Manus credentials
- Role selection (Producer/Actor)
- User session management
- Automatic token refresh

### 2. Contract Management

**Files:** `app/contract/[id].tsx`, `app/contract/edit/[id].tsx`, `server/routers.ts`

The contract system allows producers to create contracts and actors to review and accept them. Contracts include:

- Project title and description
- Payment terms and amounts
- Start and end dates
- Deliverables and requirements
- Digital signatures from both parties
- Version history tracking
- Status workflow (draft → pending → active → completed)

**Database Schema:**
```sql
CREATE TABLE contracts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producerId INT NOT NULL,
  actorId INT NOT NULL,
  projectTitle VARCHAR(255) NOT NULL,
  description TEXT,
  paymentTerms DECIMAL(10,2),
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  deliverables TEXT,
  status ENUM('draft','pending','active','completed','cancelled'),
  producerSignature LONGTEXT,
  actorSignature LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3. Payment System

**Files:** `app/contract/pay/[id].tsx`, `server/routers.ts`

Integrated Stripe payment processing for contract payments. Producers can receive payments from actors, with automatic status tracking and receipt generation.

**Features:**
- Stripe payment intent creation
- Payment status tracking (unpaid, partial, paid)
- Receipt generation and storage
- Payment history timeline
- Escrow integration ready

### 4. Portfolio & Profile Management

**Files:** `app/profile/detailed-profile.tsx`, `app/profile/skills-manager.tsx`, `components/portfolio-layouts.tsx`

Comprehensive profile system for actors and producers:

**Actor Profiles Include:**
- Headshots and portfolio photos
- Reels and demo videos
- Resume/CV documents
- Skills and specialties
- Credits and filmography
- Union memberships
- Availability calendar
- Portfolio theme selection (grid, masonry, carousel)

**Producer Profiles Include:**
- Company information
- Production specialties
- Years in industry
- Website and contact info
- Company logo and branding

### 5. Directory & Discovery

**Files:** `app/actors/index.tsx`, `app/producers/index.tsx`

Searchable directories for discovering talent and production companies:

- Advanced multi-select filtering
- Search by name, specialty, location
- Filter persistence with AsyncStorage
- Saved filter presets
- Quick actions menu (long-press)
- Bookmark/favorites system

### 6. Analytics Dashboard

**Files:** `app/(tabs)/analytics.tsx`, `components/payment-timeline.tsx`

Comprehensive analytics for tracking performance:

**For Actors:**
- Portfolio view statistics
- Contract submission tracking
- Payment received analytics
- Booking conversion rates

**For Producers:**
- Contract creation trends
- Payment statistics
- Actor engagement metrics
- Response rates

### 7. Social Features

**Database Schema (Phase 3):**
```sql
CREATE TABLE socialPosts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  content TEXT NOT NULL,
  imageUrl TEXT,
  likesCount INT DEFAULT 0,
  commentsCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE socialFollows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  followerId INT NOT NULL,
  followingId INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE socialGroups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  genre VARCHAR(50),
  location VARCHAR(100),
  membersCount INT DEFAULT 0,
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8. Casting Board System

**Database Schema (Phase 3):**
```sql
CREATE TABLE castingCalls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  producerId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  roles JSON,
  budget DECIMAL(10,2),
  deadline TIMESTAMP,
  status ENUM('open','closed','filled') DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE castingSubmissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  castingCallId INT NOT NULL,
  actorId INT NOT NULL,
  videoUrl TEXT,
  notes TEXT,
  status ENUM('submitted','reviewing','shortlisted','rejected','hired'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 9. AI Smart Matching

**Database Schema (Phase 3):**
```sql
CREATE TABLE aiRecommendations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  recommendedUserId INT NOT NULL,
  matchScore INT,
  reason TEXT,
  status ENUM('pending','viewed','contacted','hired'),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Key Components

### Screen Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `index.tsx` | Home screen | Contract list, pull-to-refresh, search |
| `create.tsx` | Contract creation | Form validation, template selection |
| `[id].tsx` | Contract detail | Full contract view, signatures, notes |
| `analytics.tsx` | Analytics dashboard | Charts, statistics, date filters |
| `profile.tsx` | User profile | Profile info, statistics, settings |
| `detailed-profile.tsx` | Detailed profile | Skills, credits, availability |
| `actors/index.tsx` | Actor directory | Search, filters, bookmarks |
| `producers/index.tsx` | Producer directory | Search, filters, reputation |

### Utility Components

| Component | Purpose |
|-----------|---------|
| `screen-container.tsx` | SafeArea wrapper for all screens |
| `contract-timeline.tsx` | Timeline display for contract history |
| `signature-capture.tsx` | Digital signature capture |
| `payment-timeline.tsx` | Payment history visualization |
| `advanced-filters.tsx` | Multi-select filtering UI |
| `verification-badge.tsx` | Trust score display |
| `quick-actions-menu.tsx` | Long-press context menu |
| `onboarding-tutorial.tsx` | First-time user walkthrough |
| `custom-header.tsx` | Navigation header with back button |
| `portfolio-layouts.tsx` | Portfolio theme variations |

---

## Backend API Routes

### Authentication Routes
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updateRole` - Update user role

### Contract Routes
- `POST /api/contracts/create` - Create contract
- `GET /api/contracts/list` - List user contracts
- `GET /api/contracts/:id` - Get contract detail
- `PUT /api/contracts/:id` - Update contract
- `POST /api/contracts/:id/sign` - Sign contract
- `POST /api/contracts/:id/accept` - Accept contract
- `POST /api/contracts/:id/decline` - Decline contract

### Payment Routes
- `POST /api/payments/createIntent` - Create payment intent
- `POST /api/payments/recordPayment` - Record payment
- `GET /api/payments/history/:contractId` - Get payment history

### Profile Routes
- `GET /api/profiles/actor/:userId` - Get actor profile
- `GET /api/profiles/producer/:userId` - Get producer profile
- `PUT /api/profiles/update` - Update profile
- `GET /api/profiles/search` - Search profiles

### Analytics Routes
- `GET /api/analytics/portfolio` - Portfolio statistics
- `GET /api/analytics/contracts` - Contract statistics
- `GET /api/analytics/payments` - Payment statistics

### Favorites Routes
- `POST /api/favorites/add` - Add favorite
- `DELETE /api/favorites/remove` - Remove favorite
- `GET /api/favorites/list` - List favorites

---

## Database Schema

### Core Tables

**users** - User accounts and authentication
- id, openId, name, email, loginMethod, role, userRole, pushToken, isVerified, verifiedAt, trustScore, createdAt, updatedAt, lastSignedIn

**contracts** - Film contracts between producers and actors
- id, producerId, actorId, projectTitle, description, paymentTerms, startDate, endDate, deliverables, status, producerSignature, actorSignature, createdAt, updatedAt

**actorProfiles** - Detailed actor information
- id, userId, bio, location, yearsExperience, specialties, profilePhotoUrl, coverPhotoUrl, height, weight, eyeColor, hairColor, website, imdbUrl, portfolioTheme, createdAt, updatedAt

**producerProfiles** - Detailed producer information
- id, userId, companyName, bio, location, yearsInIndustry, producerType, createdAt, updatedAt

**portfolioPhotos** - Actor portfolio images
- id, userId, photoUrl, caption, displayOrder, createdAt, updatedAt

**actorFilms** - Actor filmography/credits
- id, userId, title, role, year, description, imdbUrl, createdAt

**contractHistory** - Contract event tracking
- id, contractId, eventType, userId, description, createdAt

**contractVersions** - Contract version history
- id, contractId, versionNumber, data, createdBy, createdAt

**paymentHistory** - Payment tracking
- id, contractId, amount, paymentDate, receiptUrl, notes, recordedBy, createdAt

**favorites** - User bookmarks
- id, userId, favoritedUserId, type, createdAt

**savedFilterPresets** - Saved search filters
- id, userId, name, filterType, filters, createdAt, updatedAt

**socialPosts** - Social feed posts
- id, userId, content, imageUrl, likesCount, commentsCount, createdAt, updatedAt

**socialFollows** - Following relationships
- id, followerId, followingId, createdAt

**socialGroups** - Community groups
- id, name, description, genre, location, membersCount, createdBy, createdAt

**castingCalls** - Job postings
- id, producerId, title, description, roles, budget, deadline, status, createdAt, updatedAt

**castingSubmissions** - Actor submissions
- id, castingCallId, actorId, videoUrl, notes, status, createdAt, updatedAt

**aiRecommendations** - Smart matching suggestions
- id, userId, recommendedUserId, matchScore, reason, status, createdAt

---

## State Management

### Context Providers

**ThemeProvider** (`lib/theme-provider.tsx`)
- Manages light/dark mode
- Provides color tokens via `useColors()` hook
- Persists theme preference

**AuthContext** (`hooks/use-auth.ts`)
- Manages user authentication state
- Stores user profile and role
- Handles login/logout/role updates

### Local Storage

**AsyncStorage Keys:**
- `user_auth_token` - Authentication token
- `user_role` - User role (producer/actor)
- `theme_preference` - Light/dark mode
- `actor_filters` - Saved actor search filters
- `producer_filters` - Saved producer search filters
- `onboarding_completed` - Onboarding status
- `saved_filter_presets` - Saved search presets

---

## Styling System

### Theme Configuration

**File:** `theme.config.js`

```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  surface: { light: '#f5f5f5', dark: '#1e2022' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  muted: { light: '#687076', dark: '#9BA1A6' },
  border: { light: '#E5E7EB', dark: '#334155' },
  success: { light: '#22C55E', dark: '#4ADE80' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
};
```

### NativeWind Classes

All styling uses Tailwind CSS classes through NativeWind v4:

```tsx
<View className="flex-1 items-center justify-center p-4 bg-background">
  <Text className="text-2xl font-bold text-foreground">Hello</Text>
  <Text className="text-sm text-muted mt-2">Subtitle</Text>
</View>
```

---

## Configuration Files

### app.config.ts
Expo configuration with app name, icons, splash screen, and platform-specific settings.

### tailwind.config.js
Tailwind CSS configuration with custom theme tokens and NativeWind preset.

### tsconfig.json
TypeScript configuration with path aliases for clean imports:
- `@/*` → `./` (root directory)

### package.json
Dependencies and scripts for development, testing, and building.

---

## Build & Deployment

### Development Commands
```bash
pnpm dev              # Start dev server
pnpm dev:server       # Start backend server
pnpm dev:metro        # Start Metro bundler
pnpm android          # Run on Android
pnpm ios              # Run on iOS
pnpm check            # TypeScript check
pnpm lint             # ESLint
pnpm test             # Run tests
```

### Database Commands
```bash
pnpm db:push          # Push schema changes
```

### Production Build
```bash
pnpm build            # Build backend
pnpm start            # Start production server
```

---

## Testing

**File:** `tests/new-features.test.ts`

Test suite covers:
- Authentication flows
- Contract creation and management
- Payment processing
- Profile operations
- Search and filtering

---

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `BUILD_INSTRUCTIONS.md` | Detailed build and deployment guide |
| `PROJECT_OVERVIEW.md` | Technical architecture documentation |
| `FEATURES_AND_ANALYTICS.md` | Feature descriptions and analytics |
| `APP_STORE_DEPLOYMENT.md` | App store submission guide |
| `DEMO_VIDEO_SCRIPT.md` | Video walkthrough script |
| `PRODUCTION_DATABASE_SETUP.md` | Production database setup |
| `CODE_REPORT.md` | This comprehensive code report |

---

## Performance Optimizations

1. **Lazy Loading** - Screens loaded on demand via Expo Router
2. **Image Optimization** - Expo Image component with caching
3. **List Optimization** - FlatList for efficient scrolling
4. **Code Splitting** - Separate bundles for web and native
5. **AsyncStorage Caching** - Local data persistence
6. **API Response Caching** - React Query integration

---

## Security Considerations

1. **OAuth Authentication** - Secure token-based auth
2. **Signature Verification** - Digital signatures for contracts
3. **HTTPS Only** - All API calls use HTTPS
4. **Token Refresh** - Automatic token rotation
5. **Input Validation** - Zod schema validation on all inputs
6. **SQL Injection Prevention** - Drizzle ORM parameterized queries

---

## Future Enhancements

1. **Push Notifications** - Real-time alerts for contract updates
2. **Video Streaming** - In-app video playback for reels
3. **Blockchain** - Smart contracts for payments
4. **Machine Learning** - Improved AI matching algorithm
5. **Internationalization** - Multi-language support
6. **Offline Mode** - Work without internet connection

---

## Conclusion

FilmContract represents a comprehensive, production-ready mobile application for the film industry. The codebase is well-organized, thoroughly documented, and built on modern technologies. With over 80 source files, a robust backend API, and a complete database schema, the application is ready for deployment to iOS and Android app stores.

The architecture supports future scalability with modular components, clean separation of concerns, and extensible database schemas. All code follows TypeScript best practices, React Native conventions, and industry standards for security and performance.

---

**Generated:** January 2026  
**Author:** John Dee Page Jr  
**Project:** FilmContract v3bbf0a4b
