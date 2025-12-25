# FilmContract Mobile App Design

## Overview
FilmContract is a mobile app that enables transparent contract management between movie producers and actors. The app provides a centralized platform where both parties can create, view, and track contracts with complete transparency.

## Design Philosophy
- **Mobile-first**: Designed for portrait orientation (9:16) and one-handed usage
- **iOS-native feel**: Following Apple Human Interface Guidelines for a first-party iOS app experience
- **Transparency-focused**: All contract details are clearly visible and accessible to both parties
- **Professional**: Clean, business-appropriate design suitable for industry professionals

## Screen List

### 1. Authentication Screens
- **Welcome Screen**: App introduction with login/signup options
- **Login Screen**: Email/password authentication
- **Signup Screen**: New user registration with role selection (Producer/Actor)

### 2. Home Screen (Contracts List)
- **Primary Content**: List of all contracts (active, pending, completed)
- **Functionality**: 
  - View contract summaries (project name, parties involved, status)
  - Filter by status (All, Active, Pending, Completed)
  - Search contracts by project name or party
  - Pull-to-refresh to update list
  - Tap to view contract details

### 3. Contract Detail Screen
- **Primary Content**: Complete contract information
  - Project title
  - Producer and Actor details
  - Contract terms (payment, dates, deliverables)
  - Status indicator
  - Timestamps (created, updated)
- **Functionality**:
  - View all contract terms
  - Status badge (Draft, Active, Completed)
  - Share contract (if needed)

### 4. Create Contract Screen
- **Primary Content**: Form to create new contract
  - Project title input
  - Actor selection (search/select from users)
  - Payment terms input
  - Start and end dates
  - Deliverables/description text area
- **Functionality**:
  - Form validation
  - Save as draft
  - Submit contract
  - Cancel and discard

### 5. Profile Screen
- **Primary Content**: User profile information
  - Name and email
  - Role (Producer/Actor)
  - Account statistics (total contracts, active contracts)
- **Functionality**:
  - View profile details
  - Logout option
  - Theme toggle (light/dark)

## Key User Flows

### Flow 1: Producer Creates Contract
1. User taps "+" button on Home screen
2. Create Contract screen opens
3. User fills in project details, selects actor, enters terms
4. User taps "Submit Contract"
5. Contract is created and appears in Home screen list
6. Actor receives notification (future feature)

### Flow 2: View Contract Details
1. User taps contract card from Home screen
2. Contract Detail screen opens with full information
3. User can scroll to view all terms
4. User taps back to return to Home screen

### Flow 3: Actor Views Their Contracts
1. Actor logs in
2. Home screen shows all contracts where they are listed as actor
3. Actor taps contract to view details
4. Actor can see all terms and status

### Flow 4: Authentication
1. User opens app → Welcome screen
2. User taps "Login" or "Sign Up"
3. User enters credentials and role (for signup)
4. User is authenticated and redirected to Home screen

## Color Scheme

### Brand Colors
- **Primary**: Deep Blue (#1E40AF) - Professional, trustworthy
- **Success**: Green (#22C55E) - Active/approved contracts
- **Warning**: Amber (#F59E0B) - Pending contracts
- **Error**: Red (#EF4444) - Rejected/issues

### Theme Colors
- **Background**: White (light) / Dark Gray (#151718) (dark)
- **Surface**: Light Gray (#F5F5F5) (light) / Darker Gray (#1E2022) (dark)
- **Foreground**: Near Black (#11181C) (light) / Off White (#ECEDEE) (dark)
- **Muted**: Gray (#687076) (light) / Light Gray (#9BA1A6) (dark)

## Typography
- **Headings**: Bold, 24-32px for screen titles
- **Body**: Regular, 16px for main content
- **Labels**: Medium, 14px for form labels
- **Captions**: Regular, 12px for metadata

## Component Patterns

### Contract Card
- Rounded rectangle with shadow
- Project title (bold, 18px)
- Parties: "Producer Name → Actor Name"
- Status badge (colored pill)
- Date metadata (small, muted)
- Tap area covers entire card

### Status Badge
- Rounded pill shape
- Color-coded by status:
  - Draft: Gray
  - Active: Green
  - Pending: Amber
  - Completed: Blue

### Form Inputs
- Full-width text inputs with labels
- Clear focus states
- Validation messages below inputs
- Date pickers for date fields
- Multi-line text area for descriptions

### Navigation
- Tab bar at bottom with 3 tabs:
  - Home (contracts list)
  - Create (+ icon)
  - Profile (user icon)

## Interaction Design
- **Press feedback**: Opacity 0.7 for list items and cards
- **Button press**: Scale 0.97 with light haptic feedback
- **Pull-to-refresh**: Standard iOS pattern on Home screen
- **Smooth transitions**: 250ms duration between screens

## Data Requirements
- User authentication (email/password)
- User profiles (name, email, role)
- Contracts (project, producer, actor, terms, status, dates)
- Real-time sync across devices (database-backed)
