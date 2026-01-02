# FilmContract - Project Overview

**Author:** John Dee Page Jr  
**Project Type:** React Native Mobile Application  
**Last Updated:** December 31, 2025

## Executive Summary

**FilmContract is the first mobile application of its kind** - a pioneering solution that revolutionizes contract management and professional networking in the film industry. As the industry's first dedicated mobile platform for film contracts, FilmContract sets a new standard for how producers and actors collaborate. The platform connects producers and actors through transparent contract creation, digital signing, payment tracking, and portfolio management. Built with React Native and Expo, the application provides a native mobile experience on both iOS and Android while maintaining a unified codebase.

## Project Vision

**A First-of-Its-Kind Innovation**: The film industry has traditionally relied on paper contracts, email negotiations, and fragmented communication channels. FilmContract is the pioneering solution that addresses these pain points by providing the industry's first centralized mobile platform where producers can discover talent, create contracts, track payments, and manage projects. Actors benefit from professional portfolio hosting, contract transparency, and secure payment verification. The platform builds trust through verification badges and trust scores based on contract completion history.

## Core Features

### Contract Management System

The contract management system forms the foundation of the application, enabling producers to create legally binding agreements with actors for film projects.

**Contract Creation**: Producers initiate contracts by filling out a comprehensive form that captures project details, role information, compensation terms, and shooting schedules. The system supports multiple contract types including day player agreements, featured roles, background actor contracts, and commercial work. Each contract receives a unique identifier and tracks its lifecycle from draft to completion.

**Digital Signing**: Both parties review contract terms through an intuitive mobile interface. Actors can accept or decline contracts with a single tap, triggering automatic status updates and email notifications. The signing process records timestamps and IP addresses for legal verification. Signed contracts are immutable and stored securely in the database.

**Status Tracking**: Contracts progress through six distinct states: draft (initial creation), pending (awaiting actor response), signed (both parties agreed), active (currently in production), completed (project finished), and cancelled (terminated early). Each status displays appropriate action buttons and visual indicators. Users receive push notifications when contract statuses change.

**Contract History**: The system maintains a complete audit trail of all contract modifications, status changes, and communications. Users can view historical versions and track when specific terms were agreed upon. This transparency protects both parties and provides accountability.

### Payment Tracking and Financial Management

The payment tracking feature ensures financial transparency and helps both producers and actors maintain accurate records of compensation.

**Payment Timeline**: Each contract displays a visual timeline of all recorded payments with amounts, dates, and optional receipt attachments. The timeline component shows a progress bar indicating total paid versus total contract amount. Users can quickly assess payment status and identify outstanding balances.

**Payment Recording**: Producers or production accountants record payments through a modal interface that captures payment amount, payment date, payment method, and optional notes. The system automatically updates the contract's paid amount field and recalculates the remaining balance. Multiple partial payments are supported for contracts with installment schedules.

**Receipt Management**: Users can upload payment receipts (bank transfers, checks, invoices) to cloud storage and attach them to payment records. Receipts display as thumbnails with tap-to-view functionality. This documentation is crucial for tax purposes and dispute resolution.

**Payment Analytics**: The analytics dashboard aggregates payment data across all contracts, showing total earnings, pending payments, and monthly payment trends. Producers can track their spending across multiple projects, while actors monitor their income streams.

### Actor and Producer Directories

The directory features enable talent discovery and professional networking through sophisticated search and filtering capabilities.

**Search Functionality**: Users search for actors or producers by name, specialty, location, or experience level. The search algorithm performs fuzzy matching to handle typos and partial names. Results display in a scrollable list with profile photos, key credentials, and verification badges.

**Advanced Filtering**: The advanced filter interface supports multi-select options for specialties (Drama, Comedy, Action, Horror, Thriller, Romance, Sci-Fi, Voice-Over, Commercial, Theater), locations (Los Angeles, New York, Atlanta, Austin, Chicago, San Francisco, Seattle, Nashville), and experience ranges (0-20+ years). Users can combine multiple filters to narrow results precisely.

**Saved Filter Presets**: Users save frequently used filter combinations with custom names like "LA Comedy Actors" or "Experienced Horror Producers". Saved presets appear as quick-access buttons that instantly apply all saved criteria. This feature dramatically speeds up repeat searches and improves user efficiency.

**Filter Persistence**: The application automatically saves the last-used filter values to device storage using AsyncStorage. When users return to directory screens, their previous filters restore automatically, providing continuity across app sessions and reducing repetitive filter selection.

### Portfolio Management

Actors showcase their work through rich multimedia portfolios that highlight their range, experience, and professional achievements.

**Portfolio Photos**: Actors upload professional headshots, action shots, and scene stills to their portfolios. The system supports multiple photos with drag-and-drop reordering (planned feature). Photos are stored in cloud storage with optimized thumbnails for fast loading.

**Portfolio Themes**: Actors choose from three layout styles for their portfolio presentation: Grid Layout (uniform grid with equal-sized photos), Masonry Layout (Pinterest-style staggered layout with varying heights), and Carousel Layout (swipeable horizontal carousel with smooth scrolling). The theme selection affects how their portfolio appears to producers viewing their profile.

**Filmography**: Actors maintain a comprehensive filmography listing all their previous work including project titles, roles, production companies, release years, and project types (feature film, TV series, commercial, theater, etc.). The filmography appears chronologically on their profile.

**Portfolio Analytics**: The system tracks portfolio views and photo engagement metrics. Actors see total views, unique visitors, and view trends over time through the analytics dashboard. This data helps actors understand which photos and content attract the most attention from producers.

### Analytics and Insights

The analytics dashboard provides data-driven insights that help users make informed decisions and track their platform activity.

**Portfolio Analytics**: Displays total portfolio views, unique visitors, and a line chart showing view trends over the selected time period (7 days, 30 days, or 90 days). The data aggregates from the portfolioViews table which records each view with timestamp and viewer IP address.

**Contract Statistics**: Shows contract counts by status (draft, pending, signed, active, completed, cancelled) using a bar chart visualization. Users can filter by time range to see recent activity or long-term trends. The statistics help producers track their hiring activity and actors monitor their booking pipeline.

**Payment Insights**: Aggregates payment data across all contracts, displaying total payments received, pending amounts, and monthly payment trends. The payment chart groups data by month to show income patterns and seasonal variations.

**Engagement Metrics**: Tracks user interactions including profile views, contract proposals sent/received, messages exchanged, and favorite/bookmark actions. These metrics help users understand their platform engagement and optimize their profiles for better visibility.

### Verification and Trust System

The verification system builds credibility within the platform by identifying established professionals and calculating reliability scores based on performance history.

**Verification Badges**: Verified users display a blue checkmark icon next to their name throughout the application. The badge appears in directory listings, profile headers, contract screens, and search results. Verification status is manually granted by platform administrators after identity verification.

**Trust Score Calculation**: The system calculates a trust score (0-100) based on three factors: contract completion rate (40 points maximum), total contracts completed (30 points maximum based on volume), and verification status (30 points bonus). The score updates automatically when users complete contracts or achieve verification.

**Trust Score Display**: The trust score appears on user profiles with a color-coded progress bar (green for 80+, yellow for 60-79, red for below 60) and a descriptive label (Excellent, Good, Fair, Building). The display includes explanatory text about the scoring methodology to help users understand how to improve their scores.

**Reputation Impact**: Trust scores influence search rankings and visibility in directory listings. Higher-scoring users appear more prominently in search results. The reputation system incentivizes professional behavior and contract completion.

### Favorites and Bookmarks

Users can bookmark their favorite actors or producers for quick access and future reference.

**Bookmarking**: Users tap a heart icon on any actor or producer card to add them to their favorites list. The icon changes from outline to filled when bookmarked. The action triggers haptic feedback for tactile confirmation.

**Favorites Management**: The Favorites section in the profile screen displays all bookmarked users organized into separate tabs for actors and producers. Users can remove favorites by tapping the heart icon again or using a delete button in the favorites list.

**Quick Access**: Favorited users appear in a dedicated section for easy retrieval. This feature is particularly useful for producers who work with the same actors repeatedly or actors who want to monitor specific producers' projects.

### Quick Actions Menu

The quick actions menu provides contextual shortcuts for common operations through a long-press gesture.

**Long-Press Activation**: Users long-press any actor or producer card in the directory to reveal a modal menu with action shortcuts. The long-press triggers haptic feedback to confirm activation.

**Available Actions**: The menu includes options for View Profile, View Portfolio, Send Message, Create Contract, and Add/Remove Favorite. Each action navigates directly to the appropriate screen or triggers the relevant modal.

**Efficiency Improvement**: The quick actions menu reduces navigation steps and improves workflow efficiency, especially for power users who perform repetitive actions.

### Onboarding Tutorial

First-time users experience an interactive five-step tutorial that highlights key features and guides them through initial setup.

**Tutorial Steps**: The onboarding covers five essential topics: Welcome and role selection, Finding talent in directories, Creating and managing contracts, Building your portfolio, and Tracking analytics and payments. Each step displays an overlay with explanatory text and visual indicators pointing to relevant UI elements.

**Skip Option**: Users can skip the tutorial at any time using a skip button. The tutorial also includes a "Don't show again" checkbox for users who want to dismiss it permanently.

**Completion Tracking**: The system stores onboarding completion status in AsyncStorage. Completed users never see the tutorial again unless they clear app data or reinstall the application.

## Technical Architecture

### Frontend Architecture

The mobile application follows a component-based architecture using React Native and Expo's managed workflow.

**Navigation System**: Expo Router provides file-based routing where the directory structure directly maps to navigation routes. The main navigation uses a tab bar with four tabs: Home, Analytics, Create, and Profile. Additional screens like Actors, Producers, and Contract Details use stack navigation with custom headers and back buttons.

**State Management**: The application uses TanStack Query (React Query) for server state management, providing automatic caching, background refetching, and optimistic updates. Local UI state is managed with React's useState and useContext hooks. AsyncStorage handles persistent client-side data like filter preferences and onboarding completion status.

**Styling System**: NativeWind 4 provides Tailwind CSS support in React Native, enabling utility-first styling with className props. The theme system uses CSS variables defined in theme.config.js, supporting both light and dark modes. The cn() utility function merges Tailwind classes intelligently.

**Component Library**: Custom components are organized by function: layout components (ScreenContainer, CustomHeader), UI components (VerificationBadge, QuickActionsMenu), feature components (PaymentTimeline, AdvancedFilters), and form components (input fields, buttons, modals).

### Backend Architecture

The backend uses Express.js with tRPC for type-safe API development and Drizzle ORM for database operations.

**API Layer**: tRPC provides end-to-end type safety between frontend and backend without code generation. API routes are organized into logical routers: auth, contracts, payments, analytics, favorites, filterPresets, and verification. Each router contains related procedures (queries and mutations).

**Database Layer**: Drizzle ORM manages database schema definitions, migrations, and query building. The schema includes 20 tables covering users, contracts, profiles, payments, portfolios, analytics, and preferences. All queries use prepared statements to prevent SQL injection.

**Business Logic**: Service modules encapsulate complex business logic separate from route handlers. Services include reputation calculation, notification delivery, email sending, and analytics aggregation. This separation improves testability and maintainability.

**Authentication**: The system uses Manus OAuth for user authentication, providing secure login without managing passwords directly. Session cookies store authentication tokens with httpOnly and secure flags. Protected routes verify authentication before executing.

### Database Schema

The database schema supports all application features with proper relationships and constraints.

**Core Tables**: The users table stores authentication data, roles (producer/actor), verification status, and trust scores. The contracts table links producers and actors with project details, compensation, dates, and status. Profile tables (actorProfiles, producerProfiles) store extended user information including specialties, experience, and contact details.

**Payment Tables**: The paymentHistory table records all payments with contract references, amounts, dates, receipts, and notes. This table enables payment timeline visualization and financial analytics.

**Portfolio Tables**: The portfolioPhotos table stores actor portfolio images with captions and display order. The portfolioViews table tracks view analytics with viewer IP addresses and timestamps. The photoEngagement table records detailed interactions like clicks and zooms.

**Feature Tables**: The favorites table stores user bookmarks with type indicators (actor/producer). The savedFilterPresets table stores named filter combinations as JSON strings. The contractTemplates table (planned) will store reusable contract templates.

### Data Flow

Understanding the data flow helps developers trace how information moves through the system.

**User Actions**: User interactions in the mobile app trigger React component state updates. These updates may call tRPC mutations or queries through the API client configured in lib/trpc.ts.

**API Requests**: tRPC procedures execute on the backend, validating input with Zod schemas. Protected procedures verify authentication tokens before proceeding. Procedures interact with the database through Drizzle ORM queries.

**Database Operations**: Drizzle ORM translates TypeScript queries into SQL statements executed against the MySQL database. Results are returned as typed objects matching the schema definitions.

**Response Handling**: API responses flow back through tRPC to the frontend. TanStack Query caches responses and updates React components. The UI re-renders with new data, providing immediate feedback to users.

## Code Organization

### File Structure

The project follows a logical organization that separates concerns and improves maintainability.

```
filmcontract/
├── app/                          # Screen components and routing
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── index.tsx            # Home screen
│   │   ├── analytics.tsx        # Analytics dashboard
│   │   ├── create.tsx           # Contract creation
│   │   └── profile.tsx          # User profile
│   ├── actors/                   # Actor directory and details
│   ├── producers/                # Producer directory and details
│   ├── contracts/                # Contract management screens
│   └── _layout.tsx              # Root layout with providers
├── components/                   # Reusable UI components
│   ├── screen-container.tsx     # Safe area wrapper
│   ├── custom-header.tsx        # Navigation header
│   ├── payment-timeline.tsx     # Payment history display
│   ├── advanced-filters.tsx     # Search filter UI
│   ├── verification-badge.tsx   # Trust indicators
│   ├── quick-actions-menu.tsx   # Long-press menu
│   └── onboarding-tutorial.tsx  # First-time user guide
├── server/                       # Backend API and services
│   ├── routers.ts               # tRPC route definitions
│   ├── db.ts                    # Database connection
│   ├── reputation-service.ts    # Producer ratings
│   ├── actor-reputation-service.ts  # Actor reviews
│   ├── notification-service.ts  # Push notifications
│   └── email-service.ts         # Transactional emails
├── drizzle/                      # Database schema and migrations
│   ├── schema.ts                # Table definitions
│   └── migrations/              # SQL migration files
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts              # Authentication state
│   ├── use-colors.ts            # Theme colors
│   └── use-color-scheme.ts      # Dark mode detection
├── lib/                          # Utilities and configuration
│   ├── trpc.ts                  # API client setup
│   ├── utils.ts                 # Helper functions
│   └── theme-provider.tsx       # Theme context
├── assets/                       # Static resources
│   └── images/                  # Icons and splash screens
├── docs/                         # Documentation
│   ├── screenshots/             # Feature screenshots
│   ├── BUILD_INSTRUCTIONS.md    # Setup guide
│   └── PROJECT_OVERVIEW.md      # This document
└── package.json                  # Dependencies and scripts
```

### Key Files

**app/_layout.tsx**: The root layout component wraps the entire application with necessary providers including ThemeProvider for theme management, QueryClientProvider for data fetching, and GestureHandlerRootView for gesture support. This file also configures the Stack navigator with default screen options.

**server/routers.ts**: This file defines all API endpoints using tRPC's router builder. Each router section handles a specific domain (auth, contracts, payments, etc.) with related queries and mutations. The file exports the AppRouter type for frontend type inference.

**drizzle/schema.ts**: The database schema file defines all tables using Drizzle ORM's schema builder. Each table includes column definitions with types, constraints, default values, and relationships. The file exports TypeScript types for type-safe database operations.

**components/screen-container.tsx**: A critical layout component that handles safe area insets for notched devices. The component ensures content stays within visible bounds while allowing background colors to extend to screen edges.

**lib/trpc.ts**: Configures the tRPC client with proper endpoints, headers, and transformers. This file creates typed hooks (useQuery, useMutation) that provide autocomplete and type checking for all API calls.

## Analytics Implementation

### Data Collection

The application collects analytics data to provide insights while respecting user privacy.

**Portfolio Views**: When a user views another user's portfolio, the system records a view event in the portfolioViews table with fields for portfolioUserId (profile owner), viewerIp (anonymized IP address), and timestamp. The system deduplicates views from the same IP within a 24-hour window to count unique visitors accurately.

**Photo Engagement**: The photoEngagement table tracks specific interactions with portfolio photos including view (photo displayed), click (photo tapped), and zoom (photo enlarged). This granular data helps actors understand which photos resonate with producers.

**Contract Metrics**: The system tracks contract lifecycle events including creation, status changes, signing, and completion. These events feed into the analytics dashboard and trust score calculations.

**Payment Tracking**: All payment records in the paymentHistory table contribute to financial analytics. The system aggregates payments by month, contract, and user to generate payment trend charts and statistics.

### Privacy Considerations

The analytics system balances insight generation with user privacy protection.

**IP Address Anonymization**: Viewer IP addresses are hashed before storage to prevent identification of specific individuals while still enabling unique visitor counting.

**Aggregate Reporting**: The analytics dashboard displays aggregate statistics rather than individual user data. For example, "total views" rather than "viewed by specific users".

**Data Retention**: Analytics data older than 90 days is automatically archived to reduce database size and limit long-term data exposure.

**User Control**: Users can view their own analytics but cannot see detailed analytics for other users' profiles. This prevents competitive intelligence gathering and protects user privacy.

## Security Considerations

### Authentication and Authorization

The application implements multiple security layers to protect user data and prevent unauthorized access.

**OAuth Authentication**: Manus OAuth handles user authentication, eliminating the need to store passwords directly. The OAuth flow redirects users to a secure authentication server, receives authorization codes, and exchanges them for access tokens.

**Session Management**: Authenticated sessions use httpOnly cookies that cannot be accessed by JavaScript, preventing XSS attacks. Cookies include secure flags to ensure transmission only over HTTPS connections.

**Authorization Checks**: Protected API procedures verify user authentication before executing. The system checks that users can only access and modify their own data or data they have permission to view.

**Role-Based Access**: Users have roles (producer, actor) that determine available features. Producers can create contracts but not actor portfolios. Actors can manage portfolios but not initiate contracts.

### Data Protection

The system protects sensitive user data through encryption and access controls.

**Database Encryption**: The MySQL database uses encryption at rest to protect stored data. Database connections use TLS encryption to prevent eavesdropping during transmission.

**Input Validation**: All API inputs are validated using Zod schemas that enforce type safety, format requirements, and length limits. Invalid inputs are rejected before reaching business logic or database queries.

**SQL Injection Prevention**: Drizzle ORM uses prepared statements for all database queries, preventing SQL injection attacks. User inputs are never concatenated directly into SQL strings.

**XSS Prevention**: React Native automatically escapes text content, preventing cross-site scripting attacks. User-generated content is sanitized before display.

## Performance Optimization

### Frontend Performance

The mobile application employs several optimization techniques to ensure smooth performance on various devices.

**Image Optimization**: Portfolio photos are resized and compressed before upload. The system generates multiple sizes (thumbnail, medium, full) and serves appropriate sizes based on display context. Images use lazy loading to defer loading until needed.

**List Virtualization**: Directory screens use FlatList with virtualization to render only visible items. This approach handles large datasets efficiently without performance degradation.

**Query Caching**: TanStack Query caches API responses in memory, reducing redundant network requests. The cache automatically invalidates and refetches data when it becomes stale.

**Code Splitting**: Expo Router automatically code-splits routes, loading screen components only when navigated to. This reduces initial bundle size and improves startup time.

### Backend Performance

The server implements caching and query optimization to handle concurrent users efficiently.

**Database Indexing**: Critical database columns (user IDs, contract IDs, timestamps) have indexes to accelerate query performance. The schema includes foreign key indexes for join operations.

**Query Optimization**: Database queries use selective column fetching to minimize data transfer. Complex queries are optimized with proper joins and where clauses to reduce database load.

**Connection Pooling**: The database connection pool reuses connections across requests, reducing connection overhead and improving response times.

**Response Compression**: API responses use gzip compression to reduce bandwidth usage and improve load times on slow networks.

## Future Enhancements

### Planned Features

Several features are planned for future releases to expand platform capabilities.

**Contract Templates Library**: Pre-built contract templates for common scenarios (day player, featured role, background actor, commercial work) with customizable fields. Templates will reduce contract creation time by 80% and ensure legal compliance.

**Real-Time Messaging**: In-app messaging system with typing indicators, read receipts, and file sharing. Producers and actors can negotiate terms directly without exchanging personal contact information.

**Calendar Integration**: Production calendar showing shooting dates, availability windows, and contract deadlines. The calendar will sync to device calendars and detect conflicts for overlapping bookings.

**Video Portfolios**: Support for video reels and demo clips in actor portfolios. Videos will be transcoded to multiple formats and resolutions for optimal playback across devices.

**Advanced Analytics**: Enhanced analytics including conversion rates (views to contracts), response time metrics, and competitive benchmarking. Machine learning models will provide personalized recommendations.

**Multi-Language Support**: Internationalization support for Spanish, French, German, and other languages. The system will detect device language and display appropriate translations.

### Technical Improvements

**Offline Support**: Implement offline-first architecture using local database synchronization. Users can view contracts and portfolios without internet connectivity, with changes syncing when connection is restored.

**Push Notification Enhancement**: Rich push notifications with images, action buttons, and deep linking. Users can respond to contract offers directly from notifications.

**Performance Monitoring**: Integrate application performance monitoring (APM) to track crashes, slow queries, and user experience metrics. Automated alerts will notify developers of performance regressions.

**Automated Testing**: Expand test coverage with unit tests, integration tests, and end-to-end tests. Continuous integration will run tests automatically on every code change.

## Conclusion

FilmContract represents a comprehensive solution for contract management and professional networking in the film industry. The application combines modern mobile development practices with domain-specific features to address real pain points faced by producers and actors. The technical architecture provides a solid foundation for future growth while maintaining code quality and performance. With continued development and user feedback, FilmContract has the potential to become the industry standard platform for film production contracts and talent discovery.
