# FilmContract - Build Instructions

**Author:** John Dee Page Jr  
**Last Updated:** December 31, 2025  
**Status:** First-of-Its-Kind Film Contract Management App

## Overview

**FilmContract is the industry's first dedicated mobile application for film contract management.** This pioneering platform revolutionizes how producers and actors collaborate by providing transparent contract creation, digital signing, payment tracking, and professional networking - all in one mobile app.

FilmContract is a React Native mobile application built with Expo SDK 54 that connects film producers and actors through transparent contract management. This document provides comprehensive instructions for building, running, and deploying the application.

## Technology Stack

The application is built using modern web and mobile technologies that ensure cross-platform compatibility and excellent developer experience.

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo | SDK 54 |
| Language | TypeScript | 5.9 |
| Styling | NativeWind (Tailwind CSS) | 4.2.1 |
| Navigation | Expo Router | 6.0.19 |
| Backend | Express + tRPC | 11.7.2 |
| Database | MySQL (via Drizzle ORM) | 0.44.7 |
| State Management | TanStack Query | 5.90.12 |
| Charts | Victory Native | Latest |

## Prerequisites

Before building FilmContract, ensure your development environment meets these requirements.

### Required Software

**Node.js and Package Manager**: The application requires Node.js version 22.13.0 or later. The project uses pnpm as the package manager for faster installations and better disk space efficiency.

**Expo CLI**: Install the Expo command-line tools globally to run and build the application. The Expo CLI provides development servers, build tools, and deployment utilities.

**Mobile Testing Environment**: For iOS testing, you need either a physical iPhone with the Expo Go app installed or Xcode with iOS Simulator on macOS. For Android testing, install the Expo Go app on a physical device or set up Android Studio with an Android emulator.

### Development Tools

**Code Editor**: Visual Studio Code is recommended with the following extensions installed: ESLint for code linting, Prettier for code formatting, and React Native Tools for debugging support.

**Database Access**: The application connects to a MySQL database. Ensure you have database credentials and network access to the database server. The connection details are configured through environment variables.

## Installation Steps

### Step 1: Clone and Install Dependencies

Begin by navigating to the project directory and installing all required dependencies. The project uses pnpm for package management, which creates a more efficient node_modules structure.

```bash
cd /home/ubuntu/filmcontract
pnpm install
```

The installation process downloads all frontend dependencies (React Native, Expo, UI libraries) and backend dependencies (Express, tRPC, database drivers). This typically takes 2-3 minutes depending on your internet connection.

### Step 2: Database Setup

The application requires a MySQL database with proper schema initialization. The database stores user accounts, contracts, payments, portfolio photos, and analytics data.

**Database Migration**: Run the database migration command to create all required tables and relationships. This command generates SQL migration files and applies them to your database.

```bash
pnpm db:push
```

The migration creates 20 tables including users, contracts, actorProfiles, producerProfiles, paymentHistory, portfolioPhotos, favorites, and savedFilterPresets. The schema includes proper indexes and foreign key relationships for data integrity.

**Sample Data (Optional)**: For development and testing purposes, you can populate the database with sample data. The seed script creates 8 producers, 10 actors, and 8 contracts with various statuses.

```sql
-- Run the SQL commands in scripts/seed-demo.sql
-- Or use the webdev_execute_sql tool if available
```

### Step 3: Environment Configuration

Create a `.env` file in the project root directory with the following configuration variables. These settings control database connections, API endpoints, and feature flags.

```env
# Database Configuration
DATABASE_HOST=your-database-host
DATABASE_PORT=3306
DATABASE_USER=your-database-user
DATABASE_PASSWORD=your-database-password
DATABASE_NAME=filmcontract

# Server Configuration
PORT=3000
NODE_ENV=development

# Expo Configuration
EXPO_PORT=8081
```

The database credentials should match your MySQL server configuration. The PORT variable sets the backend API server port, while EXPO_PORT configures the Metro bundler port for the React Native development server.

## Running the Application

### Development Mode

The application uses a concurrent development setup that runs both the backend API server and the Expo Metro bundler simultaneously.

**Start Development Servers**: Execute the development command to launch both servers. The backend API starts on port 3000, and the Metro bundler starts on port 8081.

```bash
pnpm dev
```

You will see console output indicating both servers are running successfully. The backend logs show "server listening on port 3000" and the Metro bundler displays "Metro waiting on exp://".

### Testing on Mobile Devices

**iOS Testing**: Open the Expo Go app on your iPhone and scan the QR code displayed in the terminal. Alternatively, press `i` in the terminal to open the iOS Simulator on macOS.

**Android Testing**: Open the Expo Go app on your Android device and scan the QR code. Or press `a` in the terminal to launch the Android emulator if you have Android Studio installed.

**Web Testing**: Press `w` in the terminal to open the application in your default web browser. The web version provides a desktop preview of the mobile interface.

### Backend API Access

The backend API server runs independently and can be accessed directly for testing or integration purposes. The API uses tRPC for type-safe remote procedure calls.

**API Endpoint**: The server exposes endpoints at `http://localhost:3000/api/trpc/`. All API routes are defined in `server/routers.ts` and include authentication, contracts, payments, analytics, and user management.

**Database Management**: Access the database directly through the Management UI in the Manus platform. The UI provides CRUD operations, query execution, and schema visualization.

## Building for Production

### Mobile App Builds

Expo provides cloud-based build services (EAS Build) that compile native iOS and Android applications without requiring local Xcode or Android Studio installations.

**iOS Build**: Generate an iOS app bundle for TestFlight or App Store distribution. This requires an Apple Developer account with proper certificates and provisioning profiles.

```bash
npx expo build:ios
```

**Android Build**: Create an Android APK or AAB file for Google Play Store distribution. The build process signs the app with your keystore credentials.

```bash
npx expo build:android
```

### Backend Deployment

The backend server can be deployed to any Node.js hosting platform that supports Express applications and MySQL databases.

**Build Backend**: Compile the TypeScript backend code into optimized JavaScript bundles using esbuild.

```bash
pnpm build
```

The build output is generated in the `dist/` directory. The compiled code includes all API routes, database queries, and business logic.

**Start Production Server**: Run the production server with the compiled code. Ensure all environment variables are properly configured in your hosting environment.

```bash
NODE_ENV=production pnpm start
```

## Project Structure

Understanding the project organization helps developers navigate the codebase and locate specific features or components.

### Frontend Structure

The mobile application follows Expo Router's file-based routing convention where the directory structure directly maps to navigation routes.

**App Directory** (`app/`): Contains all screen components and navigation configuration. The `(tabs)/` subdirectory defines the main tab navigation with screens for Home, Analytics, Create, and Profile. Additional directories like `actors/`, `producers/`, and `contracts/` contain detail screens and sub-navigation.

**Components Directory** (`components/`): Houses reusable UI components including `ScreenContainer` for safe area handling, `CustomHeader` for navigation headers, `QuickActionsMenu` for long-press actions, `PaymentTimeline` for payment tracking, `AdvancedFilters` for search functionality, and `VerificationBadge` for trust indicators.

**Hooks Directory** (`hooks/`): Contains custom React hooks for state management and side effects. Key hooks include `useAuth` for authentication state, `useColors` for theme colors, and `useColorScheme` for dark mode detection.

**Library Directory** (`lib/`): Provides utility functions and configuration. The `trpc.ts` file configures the API client, `utils.ts` contains helper functions like `cn()` for class name merging, and `theme-provider.tsx` manages the global theme context.

### Backend Structure

The server-side code handles API requests, database operations, and business logic processing.

**Server Directory** (`server/`): Contains the Express server setup and tRPC router definitions. The `routers.ts` file defines all API endpoints organized by feature domain (auth, contracts, payments, analytics, favorites, verification). The `db.ts` file manages database connections and query builders.

**Database Schema** (`drizzle/schema.ts`): Defines all database tables using Drizzle ORM's schema builder. Tables include users, contracts, actorProfiles, producerProfiles, paymentHistory, portfolioPhotos, portfolioViews, favorites, savedFilterPresets, and more. Each table definition includes column types, constraints, and default values.

**Services** (`server/*-service.ts`): Implements business logic separated from route handlers. Services include `reputation-service.ts` for producer ratings, `actor-reputation-service.ts` for actor reviews, `notification-service.ts` for push notifications, and `email-service.ts` for transactional emails.

## Key Features Implementation

### Contract Management

The contract system allows producers to create, send, and manage agreements with actors. Contracts include role details, compensation, shooting dates, and legal terms.

**Contract Creation**: Producers fill out a form with contract details including project name, role, payment amount, start date, and end date. The system generates a unique contract ID and stores it in the database with status "draft".

**Contract Signing**: Actors receive contract notifications and can review terms before signing. The signing process updates the contract status to "signed" and records the signature timestamp. Both parties receive email confirmations.

**Status Tracking**: Contracts progress through multiple states: draft, pending, signed, active, completed, and cancelled. The contract detail screen displays the current status with visual indicators and action buttons appropriate for each state.

### Payment Tracking

The payment tracking feature provides transparency and accountability for financial transactions between producers and actors.

**Payment History**: Each contract maintains a complete payment history showing all recorded payments with amounts, dates, and optional receipts. The `PaymentTimeline` component displays payments chronologically with a progress bar showing total paid versus total contract amount.

**Payment Recording**: Users can record payments through a modal form that captures payment amount, payment date, receipt URL, and optional notes. The system automatically updates the contract's paid amount and calculates the remaining balance.

**Receipt Management**: Users can upload payment receipts (invoices, bank transfers, checks) to cloud storage and attach them to payment records. Receipts are displayed as thumbnails with tap-to-view functionality.

### Advanced Search and Filtering

The directory screens for actors and producers include sophisticated filtering capabilities that help users find the right talent quickly.

**Multi-Select Filters**: Users can select multiple specialties (Drama, Comedy, Action, etc.) and locations (Los Angeles, New York, Atlanta, etc.) simultaneously. The filter UI uses chip-style buttons that toggle on and off with visual feedback.

**Experience Range**: For actor searches, users can set a minimum years of experience requirement using increment/decrement buttons. The filter applies to the `yearsOfExperience` field in actor profiles.

**Saved Filter Presets**: Users can save their current filter combination with a custom name (e.g., "LA Comedy Actors" or "Experienced Horror Producers"). Saved presets appear as quick-access buttons that instantly apply all saved filter values. Users can delete presets they no longer need.

**Filter Persistence**: The application automatically saves the last-used filter values to AsyncStorage. When users return to the directory screens, their previous filters are restored, providing continuity across app sessions.

### Analytics Dashboard

The analytics feature provides data-driven insights into portfolio performance, contract activity, and payment trends.

**Portfolio Analytics**: Tracks total portfolio views, unique visitors, and view trends over time. The data comes from the `portfolioViews` table which records each view with viewer IP and timestamp. A line chart visualizes view counts by date.

**Contract Statistics**: Displays contract counts by status (draft, pending, signed, active, completed) using a bar chart. Users can filter by time range (7 days, 30 days, 90 days) to see recent activity or long-term trends.

**Payment Insights**: Shows total payments received, pending amounts, and monthly payment trends. The payment chart aggregates data from the `paymentHistory` table grouped by month.

### Verification and Trust Scores

The verification system builds credibility and trust within the platform by highlighting established professionals and calculating reliability scores.

**Verification Badge**: Verified users display a blue checkmark icon next to their name throughout the application. The badge appears in directory listings, profile headers, and contract screens. Verification status is stored in the `users.isVerified` field.

**Trust Score Calculation**: The system calculates a trust score (0-100) based on multiple factors: contract completion rate (40 points), total contracts completed (30 points), and verification status (30 points). The score updates automatically when users complete contracts or achieve verification.

**Trust Score Display**: The `TrustScoreDisplay` component shows the numerical score with a color-coded progress bar (green for 80+, yellow for 60-79, red for below 60) and a descriptive label (Excellent, Good, Fair, Building). The display includes explanatory text about the scoring factors.

## Testing and Quality Assurance

### Type Safety

The application uses TypeScript throughout the codebase to catch errors at compile time and provide better developer experience with autocomplete and inline documentation.

**Type Checking**: Run the TypeScript compiler in check mode to verify type correctness without generating output files.

```bash
pnpm check
```

### Code Linting

ESLint enforces code quality standards and catches common programming errors. The project uses Expo's recommended ESLint configuration.

```bash
pnpm lint
```

### Code Formatting

Prettier ensures consistent code style across the entire codebase. Run the formatter to automatically fix style issues.

```bash
pnpm format
```

## Troubleshooting

### Common Issues

**Metro Bundler Port Conflict**: If port 8081 is already in use, either stop the conflicting process or change the EXPO_PORT environment variable to use a different port.

**Database Connection Errors**: Verify that your database credentials in the `.env` file are correct and that the database server is accessible from your development machine. Check firewall rules and network connectivity.

**Module Not Found Errors**: Clear the Metro bundler cache and reinstall dependencies if you encounter module resolution errors.

```bash
pnpm install
npx expo start --clear
```

**iOS Simulator Not Opening**: Ensure Xcode is properly installed on macOS and that the command line tools are configured. Run `xcode-select --install` if needed.

**Android Emulator Issues**: Verify that Android Studio is installed with the Android SDK and that an emulator is created in AVD Manager. Check that the ANDROID_HOME environment variable is set correctly.

## Additional Resources

**Expo Documentation**: The official Expo documentation provides comprehensive guides for all platform features, API references, and troubleshooting tips. Visit [docs.expo.dev](https://docs.expo.dev) for detailed information.

**React Native Documentation**: Learn about core React Native components, APIs, and platform-specific considerations at [reactnative.dev](https://reactnative.dev).

**tRPC Documentation**: Understand type-safe API development with tRPC at [trpc.io](https://trpc.io). The documentation covers router setup, procedure definitions, and client integration.

**Drizzle ORM Documentation**: Explore database schema definitions, query builders, and migrations at [orm.drizzle.team](https://orm.drizzle.team).

## Support and Maintenance

For questions, bug reports, or feature requests related to FilmContract, please contact the development team or submit issues through the project management system. Regular updates and security patches are released on a monthly schedule.
