# FilmContract TODO

## Authentication & User Management
- [ ] User authentication system (login/signup)
- [ ] User profile with role selection (Producer/Actor)
- [ ] Profile screen with user details and statistics
- [ ] Logout functionality

## Database Schema
- [x] Users table (id, email, password_hash, name, role, created_at)
- [x] Contracts table (id, project_title, producer_id, actor_id, payment_terms, start_date, end_date, deliverables, status, created_at, updated_at)

## Backend API
- [x] User registration endpoint
- [x] User login endpoint
- [x] Get current user endpoint
- [x] Create contract endpoint
- [x] Get all contracts for user endpoint
- [x] Get contract by ID endpoint
- [x] Update contract status endpoint

## Mobile UI - Authentication
- [x] Welcome screen with login/signup options
- [x] Login screen with form validation
- [x] Signup screen with role selection

## Mobile UI - Home & Navigation
- [x] Tab bar navigation (Home, Create, Profile)
- [x] Home screen with contracts list
- [x] Contract card component with status badges
- [x] Pull-to-refresh on home screen
- [ ] Filter contracts by status
- [ ] Search contracts functionality

## Mobile UI - Contract Management
- [x] Contract detail screen with all information
- [x] Create contract screen with form
- [x] Form validation for contract creation
- [x] Date picker for start/end dates
- [x] Actor selection interface

## Mobile UI - Profile
- [x] Profile screen with user info
- [x] Account statistics display
- [ ] Theme toggle (light/dark)

## Branding
- [x] Generate custom app logo
- [x] Update app name in configuration
- [x] Apply brand colors to theme

## Testing & Polish
- [x] Test authentication flow
- [x] Test contract creation flow
- [x] Test contract viewing flow
- [x] Verify all user flows work end-to-end

## Bug Fixes
- [x] Fix API URL configuration to use actual server URL instead of localhost

## Contract Editing Feature
- [x] Add update contract endpoint in backend API
- [x] Create edit contract screen UI
- [x] Add "Edit" button on contract detail screen (producers only)
- [x] Form validation for contract editing
- [x] Prevent actors from editing contracts
- [x] Test contract update functionality

## Branding Update
- [x] Add "Created by John Dee Page Jr" to app footer
- [x] Update about/credits section with creator info

## Contract Payment System
- [x] Add payment status field to contracts (unpaid/paid/partial)
- [x] Add payment amount tracking to database
- [x] Create payment screen for actors to pay contracts
- [x] Integrate Stripe payment processing (demo mode)
- [x] Add "Pay Now" button on contract detail (actors only)
- [x] Show payment status badge on contracts
- [x] Payment confirmation and receipt

## Developer Donation System
- [x] Create donation/support screen
- [x] Add "Support Developer" button in profile/settings
- [x] Integrate Stripe for donations to John Dee Page Jr (demo mode)
- [x] Preset donation amounts ($5, $10, $20, custom)
- [x] Thank you message after donation
- [ ] Donation history tracking

## Bug Fixes - OAuth
- [x] Fix "Cannot GET /oauth/login" error
- [x] Ensure OAuth routes are properly configured

## PDF Export Feature
- [x] Add PDF generation library
- [x] Create PDF template for contracts
- [x] Add "Export PDF" button on contract detail screen
- [x] Include all contract details in PDF (parties, terms, dates, payment info)
- [x] Add branding and formatting to PDF
- [x] Handle PDF download on mobile and web

## Push Notifications
- [x] Set up push notification permissions
- [x] Create notification service
- [x] Send notification when contract is created (to actor)
- [x] Send notification when payment is received (to producer)
- [x] Send notification when contract status changes
- [x] Add notification preferences in profile

## Contract Timeline/History
- [x] Create contract_history table in database
- [x] Track contract events (created, edited, paid, status changed)
- [x] Add timeline component to contract detail screen
- [x] Show chronological log with timestamps
- [x] Display user who performed each action
- [x] Add icons for different event types
