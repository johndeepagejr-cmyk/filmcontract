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

## Digital Signatures
- [x] Add signature fields to contracts table (producer_signature, actor_signature)
- [x] Install and configure signature capture library (react-native-signature-canvas)
- [x] Create signature capture screen/modal
- [x] Add "Sign Contract" button for producers and actors
- [x] Store signatures as base64 images in database
- [x] Display signatures on contract detail screen
- [ ] Include signatures in PDF export
- [x] Prevent editing after both parties sign

## Contract Templates
- [x] Create contract_templates table in database
- [ ] Add template management to producer interface
- [x] Create default templates (feature film, commercial, voice-over, TV series)
- [x] Template fields: name, description, default payment terms, default deliverables
- [x] Add "Use Template" option when creating contracts
- [ ] Allow producers to create custom templates from existing contracts
- [x] Template library screen with search and filter

## Email Notifications (Skipped - Push notifications already implemented)
- [ ] Set up email service integration (requires external API keys)
- [ ] Create email templates (contract created, contract edited, payment received, contract signed)
- [ ] Send email when contract is created (to actor)
- [ ] Send email when contract is edited (to both parties)
- [ ] Send email when payment is received (to producer)
- [ ] Send email when contract is signed (to both parties)
- [ ] Include direct links to contracts in emails
- [ ] Add email notification preferences to user settings

## Bug Fixes - Role Selection
- [x] Fix actor role selection not working when clicked

## Contract Approval Workflow
- [x] Add Accept/Decline buttons for actors on contract detail screen
- [x] Update contract status when actor accepts (pending → active)
- [x] Update contract status when actor declines (pending → cancelled)
- [x] Track approval actions in contract history timeline
- [x] Prevent actors from accepting/declining already active contracts
- [ ] Send push notification to producer when actor responds

## Signatures in PDF Export
- [x] Update PDF generator to include signature section
- [x] Display producer signature in PDF if signed
- [x] Display actor signature in PDF if signed
- [x] Add signature date/timestamp to PDF
- [x] Format signatures properly in PDF layout

## Contract Search
- [x] Add search bar to home screen
- [x] Filter contracts by project title
- [x] Filter contracts by actor name (for producers)
- [x] Filter contracts by producer name (for actors)
- [x] Filter contracts by status
- [x] Show "No results" message when search returns empty

## Contract Versioning
- [x] Create contract_versions table in database
- [x] Track all contract edits as new versions
- [x] Add "View Version History" button on contract detail screen
- [x] Create version history screen showing all versions
- [x] Highlight changes between versions (diff view)
- [x] Show version number and timestamp for each version
- [x] Allow viewing previous version details (read-only)

## Bulk Actions
- [x] Add checkbox selection mode to contracts list
- [x] Add "Select All" / "Deselect All" buttons
- [x] Create bulk actions menu (Export PDFs, Change Status, Archive)
- [x] Implement bulk PDF export (all selected contracts)
- [ ] Implement bulk status change with confirmation
- [ ] Add archive/unarchive functionality
- [x] Show selection count in UI

## Analytics Dashboard
- [x] Create new Analytics tab in navigation
- [x] Add analytics screen with statistics cards
- [x] Show total contracts by status (active, pending, completed, cancelled)
- [x] Show payment statistics (total received, total pending, completion rate)
- [ ] Add monthly contract creation trend chart
- [ ] Add payment trend chart over time
- [ ] Show top actors/producers by contract count
- [ ] Add date range filter for analytics

## Contract Reminders
- [x] Create reminders table in database
- [ ] Add reminder preferences to user settings
- [x] Implement reminder scheduling for contract end dates
- [ ] Implement reminder scheduling for payment due dates
- [ ] Implement reminder scheduling for pending approvals
- [x] Send push notifications for reminders
- [x] Add "Upcoming" section to home screen showing contracts with approaching dates
- [ ] Allow users to snooze or dismiss reminders

## Contract Disputes/Notes System
- [x] Create contract_notes table in database
- [x] Add notes/comments section to contract detail screen
- [x] Allow both parties to add comments with timestamps
- [x] Show conversation history in chronological order
- [ ] Add notification when new comment is added
- [ ] Support @mentions to notify specific party
- [ ] Add "Unresolved Issues" badge when notes exist

## Contract Renewal Workflow
- [x] Add "Renew Contract" button to completed contracts
- [x] Pre-fill renewal form with previous contract terms
- [x] Allow editing terms before creating renewal
- [ ] Link renewed contract to original contract
- [ ] Show contract lineage (original → renewal 1 → renewal 2)
- [ ] Add renewal history to contract detail screen
- [ ] Track renewal count in analytics

## Bug Fixes - Contract Display
- [x] Fix contracts not showing on home screen after login (improved role selection with better error handling)
- [ ] Verify contract list query is working correctly
- [ ] Ensure empty state shows properly when no contracts exist

## Bug Fixes - Role Selection Buttons
- [ ] Fix Producer/Actor buttons not responding when clicked
- [ ] Verify updateRole API endpoint exists and works
- [ ] Add proper error handling for failed role updates

## Contract Attachments
- [x] Create contract_attachments table in database
- [x] Add file upload functionality to contract detail screen
- [x] Store uploaded files (base64 for now, S3 in production)
- [x] Display list of attachments on contract detail
- [x] Add download button for each attachment
- [x] Support multiple file types (PDF, DOC, images)
- [x] Show file size and upload date
- [x] Allow both parties to upload attachments

## Contract Milestones
- [ ] Create contract_milestones table in database
- [ ] Add milestones section to contract creation form
- [ ] Allow defining multiple milestones per contract
- [ ] Each milestone has: title, description, due date, payment amount
- [ ] Display milestones on contract detail screen
- [ ] Add milestone completion tracking
- [ ] Calculate total milestone payments vs contract amount
- [ ] Show progress bar for milestone completion
- [ ] Allow marking milestones as complete (producers only)

## Email Integration
- [ ] Set up email service configuration
- [ ] Create email templates for notifications
- [ ] Send email when contract is created
- [ ] Send email when contract is edited
- [ ] Send email when payment is received
- [ ] Send email when contract is signed
- [ ] Send email when new comment is added
- [ ] Add email preferences to user settings
- [ ] Include direct links to contracts in emails

## Bug Fixes - Navigation After Role Selection
- [x] Fix navigation not working after role selection
- [x] Ensure user is redirected to home screen after selecting Producer or Actor

## Bug Fixes - User Data Refresh
- [x] Fix user data not refreshing after role selection (force page reload on web)
- [x] Ensure useAuth hook properly updates user.userRole after mutation
- [x] Verify home screen re-renders with updated user data

## Bug Fixes - Role Detection
- [x] Fix "not in role" message showing when role is actually set
- [x] Verify user.userRole is properly populated from API (added userRole to buildUserResponse)
- [x] Check database to ensure role is actually saved

## Bug Fixes - Page Reload After Role Selection
- [x] Fix page not reloading after role selection success message
- [x] Use router navigation instead of page reload (more reliable)
- [x] Add explicit refresh() call before navigation to ensure user data is updated

## Bug Fixes - Producer Button Not Working
- [x] Debug why Producer button click does nothing
- [x] Check browser console for error messages
- [x] Verify updateRole API endpoint is being called
- [x] Test if window.location.reload() works better than router.replace()
- [x] Add visible loading indicator when button is clicked

## Bug Fixes - Template Selection Routing
- [x] Fix "unmatched route" error when selecting a template
- [x] Verify template selection navigation works correctly
- [x] Ensure template data is passed to contract creation form

## Stripe Payment Integration (Real Payments)
- [x] Request Stripe API keys from user (publishable key and secret key)
- [x] Install stripe npm package on backend
- [x] Create Stripe payment intent API endpoint for contract payments
- [x] Create Stripe payment intent API endpoint for donations
- [x] Update payment screen to use real Stripe checkout
- [ ] Update donation screen to use real Stripe checkout
- [x] Add payment confirmation and success handling
- [x] Update payment status in database after successful payment
- [x] Test contract payment flow end-to-end
- [ ] Test donation payment flow end-to-end (payment screen created)

## Bug Fixes - Contract Detail Error
- [x] Fix "uncaught error" when clicking on a contract (React hooks order issue)
- [x] Add error handling to contract detail screen
- [x] Verify contract data is loading correctly

## Email Notifications Implementation
- [x] Set up email service using built-in backend capabilities
- [x] Create email templates for contract notifications
- [x] Send email when contract is created (to actor)
- [ ] Send email when contract is edited (to both parties)
- [x] Send email when contract is signed (to both parties)
- [x] Send email when payment is received (to producer)
- [x] Send email when contract status changes
- [x] Test email delivery (logs to console for now)

## Date Picker UI Improvement
- [x] Install date picker library for React Native
- [x] Create reusable DatePicker component
- [x] Replace text input with date picker in contract creation form
- [x] Replace text input with date picker in template use form
- [ ] Replace text input with date picker in contract edit form
- [x] Add proper date formatting and validation
- [x] Test date picker on web and mobile

## Industry Reputation System (Transparency Feature)
- [x] Create database schema for producer reviews
- [x] Add reputation calculation logic (completed contracts, on-time payments, ratings)
- [x] Create public producer profile API endpoint
- [x] Build producer profile screen showing reputation stats
- [x] Add review submission form for actors (after contract completion)
- [x] Display average rating and review count on producer profiles
- [x] Show contract completion rate and payment reliability
- [x] Add public producer directory/search page
- [x] Allow actors to browse producers by reputation
- [x] Test reputation calculations with sample data

## Actor Directory (Two-Way Transparency)
- [x] Create actor reviews database schema
- [x] Add actor reputation calculation logic
- [x] Create actor profile API endpoints
- [x] Build actor directory screen for producers
- [x] Build actor profile screen showing reputation
- [x] Add review submission for producers to review actors
- [x] Update tab navigation to show Actors tab for producers
- [x] Create sample actor profiles for testing
- [x] Add sample reviews for actors

## Actor Contact & Hire Feature
- [x] Display actor email/contact info on actor profile
- [x] Add "Hire This Actor" button on actor profile (producers only)
- [x] Pre-fill contract creation form with actor email when hiring
- [x] Test hire flow from actor profile to contract creation

## Switch to Live Stripe Payments
- [ ] Update STRIPE_PUBLISHABLE_KEY to live key
- [ ] Update STRIPE_SECRET_KEY to live key
- [ ] Test live payment processing

## Remove Demo Mode from Payment Screen
- [x] Remove "demo mode" text from payment screen
- [x] Integrate real Stripe Checkout instead of test card simulation
- [x] Update payment flow to use actual Stripe payment intents

## Add Pay Now Button to Contract Details
- [x] Add Pay Now button for unpaid contracts on contract detail screen
- [x] Show button only for actors (not producers)
- [x] Navigate to payment screen when clicked
- [x] Hide button for already paid contracts

## Remove Demo Text from Donation Screen
- [x] Remove demo mode text from donation screen
- [x] Update donation screen to show live payment messaging

## Payment Receipt Emails
- [x] Create PDF receipt generator function
- [x] Generate receipt with payment details (amount, date, contract, parties)
- [x] Send receipt email to actor after successful payment
- [x] Send confirmation email to producer when payment received
- [x] Include PDF receipt as email attachment (logged to console for now)

## Real Email Service Integration (Skipped for now)
- [ ] Request SendGrid or Mailgun API key from user
- [ ] Install email service SDK
- [ ] Update receipt-generator.ts to send actual emails
- [ ] Test email delivery

## Downloadable PDF Receipts
- [x] Install PDF generation library (jsPDF)
- [x] Create PDF receipt generator function
- [x] Add download receipt button to contract detail screen
- [x] Generate and download PDF when button clicked
- [x] Test PDF generation and download

## Bug Fixes - Sign-Up Loading Issue
- [x] Fix sign-up button staying on loading screen indefinitely
- [x] Check OAuth callback handling
- [x] Verify redirect URLs are configured correctly
- [x] Test sign-up flow end-to-end on mobile browser

## Actor Profile Portfolio System (Facebook-style)
- [ ] Create actor_profiles table with bio, location, years_experience, specialties
- [ ] Create actor_photos table for profile pictures and portfolio images
- [ ] Create actor_films table for filmography (title, role, year, description, poster_url)
- [ ] Add profile photo upload API endpoint
- [ ] Add portfolio photo upload API endpoint
- [ ] Add filmography CRUD API endpoints
- [ ] Create "Edit Profile" screen for actors
- [ ] Add bio text area with character limit
- [ ] Add location and years of experience fields
- [ ] Add specialties/skills multi-select (Drama, Comedy, Action, Voice-Over, etc.)
- [ ] Add profile photo upload with image picker
- [ ] Add portfolio photo gallery with multiple uploads
- [ ] Add filmography section with add/edit/delete films
- [ ] Update actor profile display to show all portfolio content
- [ ] Add photo gallery viewer with swipe navigation
- [ ] Show filmography list with poster images
- [ ] Test profile creation and editing flow
- [ ] Test photo uploads and display

- [x] Create actor_profiles table with bio, location, years_experience, specialties
- [x] Create actor_photos table for profile pictures and portfolio images
- [x] Create actor_films table for filmography (title, role, year, description, poster_url)
- [x] Add profile photo upload API endpoint
- [x] Add portfolio photo upload API endpoint
- [x] Add filmography CRUD API endpoints
- [x] Create "Edit Profile" screen for actors
- [x] Add bio text area with character limit
- [x] Add location and years of experience fields
- [x] Add specialties/skills multi-select (Drama, Comedy, Action, Voice-Over, etc.)
- [x] Add profile photo upload with image picker
- [x] Add portfolio photo gallery with multiple uploads
- [x] Add filmography section with add/edit/delete films
- [x] Update actor profile display to show all portfolio content
- [x] Add photo gallery viewer with swipe navigation
- [x] Show filmography list with poster images
- [x] Test profile creation and editing flow
- [x] Test photo uploads and display

## Copyright Protection & Legal Documentation
- [ ] Add copyright notice to app footer
- [ ] Create Terms of Service page
- [ ] Create Privacy Policy page
- [ ] Create restrictive LICENSE file
- [ ] Generate ownership documentation (COPYRIGHT.md)
- [ ] Add copyright headers to key source files
- [ ] Link legal pages from app settings

- [x] Add copyright notice to app footer
- [x] Create Terms of Service page
- [x] Create Privacy Policy page
- [x] Create restrictive LICENSE file
- [x] Generate ownership documentation (COPYRIGHT.md)
- [x] Add copyright headers to key source files
- [x] Link legal pages from app settings

## Feature: Photo Upload for Actor Profiles
- [x] Add image picker integration (expo-image-picker)
- [x] Create photo upload API endpoint with S3 storage
- [x] Add profile photo section to Edit Profile screen
- [ ] Add portfolio photo gallery to Edit Profile screen
- [x] Display profile photo in actor profile view
- [ ] Display portfolio gallery in actor profile view
- [ ] Add photo management screen (delete, reorder photos)

## Feature: Actor Search & Discovery
- [x] Create actor directory/search screen for producers
- [x] Add search bar with text search
- [x] Add filter by location
- [x] Add filter by specialties (multi-select)
- [x] Add filter by years of experience (range)
- [x] Display actor cards with photo, name, location, specialties
- [x] Add actor profile detail view from search results
- [x] Add "Contact" or "Create Contract" button from actor profile

## Feature: Contract Templates Library
- [x] Create contract templates database table
- [x] Add pre-made templates (day player, featured role, background, voice-over)
- [x] Create template selection screen when creating contract
- [x] Add template preview before selection
- [x] Auto-fill contract form with template data
- [x] Allow customization after template selection

## Feature: Push Notifications
- [x] Set up Expo push notification service
- [x] Request notification permissions on app start
- [x] Store push tokens in database
- [x] Send notification when contract is created
- [x] Send notification when contract is signed
- [x] Send notification when payment is released
- [ ] Add notification settings toggle in profile
- [ ] Test notifications on iOS and Android

## Feature: Producer Profile System (Match Actor Profiles)
- [x] Create producer_profiles table in database
- [x] Add producer profile fields (company name, bio, location, years in business, profile photo, company logo)
- [x] Create producer profile API endpoints (upsert, get, upload photo)
- [x] Build Edit Producer Profile screen with photo upload
- [x] Update producer profile display to show all info
- [x] Add producer profile photos to producer directory
- [x] Create producer portfolio/past projects section
- [x] Test producer profile system end-to-end

## Feature: Portfolio Galleries (Multiple Photos)
- [ ] Create portfolio_photos table in database
- [ ] Add portfolio photo upload API endpoints
- [ ] Build portfolio photo management screen
- [ ] Add photo gallery display to actor profiles
- [ ] Add photo gallery display to producer profiles
- [ ] Support photo reordering and deletion
- [ ] Add photo captions/descriptions

## Feature: Producer Search Directory
- [ ] Create producer directory screen for actors
- [ ] Add search and filter UI for producers
- [ ] Implement backend search with filters
- [ ] Display producer cards with company info
- [ ] Add producer profile detail view
- [ ] Add "View Contracts" or "Contact" button

## Feature: Verification Badges
- [ ] Add verified field to users table
- [ ] Create verification badge component
- [ ] Display badges on actor profiles
- [ ] Display badges on producer profiles
- [ ] Display badges in search results
- [ ] Add admin interface for verification (future)
- [ ] Define verification criteria

## Bug Fix - Photo Deletion
- [x] Fix photo deletion functionality - delete button not working
- [x] Check delete API endpoint
- [x] Verify frontend delete handler
- [x] Test photo deletion end-to-end

## Photo Management Improvements
- [x] Test photo deletion end-to-end
- [x] Add bulk selection mode for photos
- [x] Add "Select All" / "Deselect All" buttons
- [x] Implement bulk delete for selected photos
- [ ] Add bulk reorder functionality
- [x] Create full-screen photo gallery viewer
- [x] Add swipe navigation between photos
- [ ] Add zoom capability in gallery viewer
- [x] Add close button to exit gallery

## Advanced Photo Features
- [ ] Add drag-and-drop reordering for portfolio photos
- [ ] Install image manipulation library for editing
- [ ] Add photo editing screen with filters (brightness, contrast, saturation)
- [ ] Add crop functionality before upload
- [x] Create public portfolio link generation API
- [x] Add "Share Portfolio" button to profile screen
- [x] Generate unique shareable URLs for portfolios
- [x] Create public portfolio view page (no login required)
- [x] Test shareable links on social media

## QR Code & Analytics Features
- [x] Install QR code generation library
- [x] Add QR code generation API endpoint
- [x] Create QR code display/download screen
- [x] Add "Generate QR Code" button to profile
- [ ] Implement drag-and-drop reordering for photos
- [ ] Update photo order in database
- [x] Create portfolio_views analytics table
- [x] Track portfolio view counts
- [x] Track photo engagement metrics
- [ ] Add analytics dashboard to profile

## Portfolio Themes Feature
- [x] Add portfolioTheme field to actor_profiles and producer_profiles tables
- [x] Create theme selection screen
- [x] Design grid layout component
- [x] Design masonry layout component
- [x] Design carousel layout component
- [x] Add theme preview in selection screen
- [x] Save user's theme preference to database
- [x] Apply selected theme to public portfolio view
- [x] Test all three themes with different photo counts

## Current Bug Fixes
- [x] Fix uncaught error when navigating to profile screen (missing Image import)

## Analytics Dashboard Feature
- [x] Design dashboard layout with sections for portfolio, contracts, and payments
- [x] Create API endpoint to get portfolio view statistics (total views, unique visitors, views over time)
- [x] Create API endpoint to get contract statistics (by status, monthly trends, completion rate)
- [x] Create API endpoint to get payment statistics (total received, pending, monthly trends)
- [x] Install chart library (victory-native)
- [x] Build portfolio views chart component (line chart showing views over time)
- [x] Build contract status breakdown chart (bar chart)
- [x] Build payment trends chart (bar chart showing payments by month)
- [x] Add statistics cards for key metrics (total views, total contracts, total payments)
- [x] Add date range filter (7 days, 30 days, 90 days)
- [x] Test all analytics calculations with real data

## Navigation Bug Fixes
- [x] Add back button to profile screen to return to previous screen (changed icon to person.fill)
- [x] Ensure profile navigation doesn't redirect to external webpage

## Back Button Navigation Issues
- [x] Add back button to producers screen
- [x] Add back button to actors screen
- [x] Ensure all non-tab screens have proper back navigation (Stack.Screen headerShown: true)

## Favorites/Bookmarks Feature
- [x] Create database schema for favorites (user_id, favorited_user_id, type, created_at)
- [x] Add API endpoint to add favorite (actor or producer)
- [x] Add API endpoint to remove favorite
- [x] Add API endpoint to get user's favorites list
- [x] Add bookmark/heart icon button to actor cards in directory
- [x] Add bookmark/heart icon button to producer cards in directory
- [x] Show filled heart icon for already favorited users
- [x] Create Favorites section in profile screen
- [x] Display favorited actors and producers in separate tabs/sections
- [x] Add ability to remove favorites from the Favorites section
- [x] Test adding and removing favorites

## Back Button Still Not Visible
- [x] Investigate why back button is not showing on Producers/Actors screens
- [x] Fix navigation configuration to ensure back button appears (added headerBackTitle and presentation: card)
- [x] Test that back button works correctly

## Filter Persistence Feature
- [x] Save actor directory filters to AsyncStorage (search query, specialties, min experience)
- [x] Load saved filters on actors screen mount
- [x] Save producer directory filters to AsyncStorage (search query, specialties, location)
- [x] Load saved filters on producers screen mount
- [x] Add "Clear Filters" button that also clears AsyncStorage
- [x] Test filter persistence across app restarts

## Quick Actions Menu Feature
- [x] Install react-native-menu or use ActionSheet for menu component (created custom QuickActionsMenu)
- [x] Add long-press handler to actor cards in directory
- [x] Add long-press handler to producer cards in directory
- [x] Create menu options: View Portfolio, Send Message, Create Contract, Add/Remove Favorite
- [x] Implement navigation for each menu action
- [x] Add haptic feedback on long-press
- [x] Test quick actions menu on all card types

## Onboarding Tutorial Feature
- [x] Create onboarding state management (completed steps, skip status)
- [x] Design onboarding screens with key feature highlights
- [x] Add interactive tooltips for main features (contracts, directory, profile)
- [x] Create skip button and "Don't show again" option
- [x] Show onboarding only on first app launch
- [x] Store onboarding completion status in AsyncStorage
- [x] Test onboarding flow from fresh install

## Back Button Still Missing
- [x] Investigate why Stack.Screen headerShown configuration is not working (tabs override header)
- [x] Check if producers/actors screens need different navigation approach (custom header needed)
- [x] Implement custom back button in screen header if needed (CustomHeader component created)
- [x] Ensure back button is visible and functional on both screens

## Sample Data Population
- [x] Create seed script with realistic producer profiles (names, companies, specialties)
- [x] Create seed script with realistic actor profiles (names, specialties, experience)
- [x] Create seed script with sample contracts (various statuses, dates, amounts)
- [x] Run seed script to populate database (8 producers, 10 actors, 8 contracts)
- [x] Verify data displays correctly in all screens

## Contract Payment Tracking Feature
- [x] Create paymentHistory table schema (contractId, amount, date, receipt, notes)
- [x] Add API endpoint to record payment
- [x] Add API endpoint to get payment history for contract
- [x] Build payment timeline UI component showing all payments
- [x] Display payment progress bar (paid vs total amount)
- [x] Show receipt thumbnails with tap to view full size
- [ ] Add "Record Payment" button to contract detail screen
- [ ] Create payment recording modal with amount, date, receipt upload

## Advanced Multi-Select Filtering Feature
- [x] Create saved filter presets table schema (userId, name, filters JSON)
- [x] Add API to save filter preset
- [x] Add API to load saved filter presets
- [x] Add multi-select specialty filter (checkboxes for multiple specialties)
- [x] Add location multi-select filter
- [x] Add experience range filter (0-20+ years)
- [x] Build "Save Current Filters" button
- [x] Build "Load Preset" dropdown menu
- [x] Add "Clear All Filters" button
- [ ] Integrate AdvancedFilters component into actors/producers screens
- [ ] Update actors/producers API to support array filters

## Profile Verification Badge System
- [x] Add verification fields to user schema (isVerified, verifiedAt, trustScore)
- [x] Add API endpoint to calculate trust score (contracts completed, ratings, on-time rate)
- [x] Build verification badge UI component (checkmark icon)
- [x] Display trust score on profile (0-100 scale with color coding)
- [ ] Show verification badge on directory cards
- [ ] Add "Get Verified" button to profile screen

## Documentation Package
- [x] Create BUILD_INSTRUCTIONS.md with setup steps
- [x] Capture screenshots of all major features
- [x] Create PROJECT_OVERVIEW.md with architecture documentation
- [x] Document analytics features and data tracking (FEATURES_AND_ANALYTICS.md)
- [x] Export source code with comments
- [x] Compile final documentation package

## App Store Deployment
- [x] Create comprehensive build guide for iOS and Android (APP_STORE_DEPLOYMENT.md)
- [x] Write app store descriptions and marketing copy
- [x] Document submission process and review guidelines
- [ ] Create iOS build for App Store (requires Apple Developer account)
- [ ] Create Android build for Google Play Store (requires Google Play Developer account)
- [ ] Submit to app stores and monitor review process

## Demo Video Creation
- [x] Write demo video script (2-3 minutes) (DEMO_VIDEO_SCRIPT.md)
- [x] Document production guidelines and technical specifications
- [ ] Record feature walkthrough video
- [ ] Add voiceover narration
- [ ] Edit video with transitions and captions
- [ ] Export video for app stores and marketing

## Production Database Setup
- [x] Create production database setup guide (PRODUCTION_DATABASE_SETUP.md)
- [x] Document hosting options and security best practices
- [x] Include backup and disaster recovery procedures
- [ ] Configure production MySQL database
- [ ] Set up automated backups
- [ ] Configure database security and access controls
- [ ] Create production environment variables
- [ ] Set up monitoring and alerting

## Documentation Updates
- [x] Update PROJECT_OVERVIEW.md to highlight FilmContract as the first app of its kind
- [x] Update BUILD_INSTRUCTIONS.md with pioneering status
- [x] Update FEATURES_AND_ANALYTICS.md with first-mover positioning
- [x] Update APP_STORE_DEPLOYMENT.md with unique market position
- [x] Update DEMO_VIDEO_SCRIPT.md with first-of-its-kind messaging
- [x] Update PRODUCTION_DATABASE_SETUP.md with pioneering status


## Phase 2: Additional Features (14 Major Features)

### 1. Detailed Profiles Feature
- [x] Add profile fields for headshots, reels, resumes, skills, credits, unions, availability (database schema created)
- [x] Create searchable profile attributes (API endpoints created)
- [x] Build profile customization interface (detailed-profile.tsx, skills-manager.tsx, credits-manager.tsx, availability-calendar.tsx)
- [ ] Add profile completion percentage indicator
- [ ] Implement profile view analytics

### 2. Social Feed & Networking
- [ ] Create social feed component with posts and updates
- [ ] Implement likes, comments, and shares functionality
- [ ] Build follow/unfollow system
- [ ] Create genre and location-based groups
- [ ] Add group messaging and collaboration features

### 3. Job & Casting Board
- [ ] Create casting board interface for directors
- [ ] Build role/breakdown posting system
- [ ] Implement actor submission system with self-tapes
- [ ] Create submission management dashboard
- [ ] Add filtering and search for casting directors

### 4. AI Smart Matching
- [ ] Develop AI recommendation algorithm
- [ ] Implement actor-to-director matching
- [ ] Create director-to-actor matching
- [ ] Build recommendation UI components
- [ ] Add match confidence scoring

### 5. In-App Self-Tape Tool
- [ ] Build video recording component
- [ ] Implement slate capture (name, role, date)
- [ ] Add multiple take management
- [ ] Create lighting tips and guidance
- [ ] Implement direct submission to casting calls

### 6. Transparent Contract Builder
- [ ] Create customizable contract templates
- [ ] Add SAG-AFTRA rate templates
- [ ] Build indie contract templates
- [ ] Implement residuals and credits tracking
- [ ] Add e-signature integration
- [ ] Create version tracking system

### 7. Smart Contract Automation
- [ ] Research blockchain integration options
- [ ] Implement milestone-based auto-payments
- [ ] Create royalty tracking system
- [ ] Build immutable record system
- [ ] Add smart contract deployment

### 8. Secure Messaging & Collaboration
- [ ] Build in-app chat system
- [ ] Implement video call functionality
- [ ] Create file sharing system
- [ ] Add message encryption
- [ ] Build collaboration workspace

### 9. Reviews & Ratings System
- [ ] Create post-project review interface
- [ ] Implement verified review system
- [ ] Build rating aggregation
- [ ] Add review moderation
- [ ] Create reputation score calculation

### 10. Availability & Calendar Sync
- [ ] Build calendar interface
- [ ] Implement calendar sync (Google, Apple)
- [ ] Create availability blocking
- [ ] Add conflict detection
- [ ] Implement push notifications

### 11. Payment Escrow Integration
- [ ] Research escrow service providers
- [ ] Implement escrow account creation
- [ ] Build fund holding mechanism
- [ ] Create milestone-based release logic
- [ ] Add dispute resolution process

### 12. Enhanced Verification Badges
- [ ] Add union verification (SAG-AFTRA, etc.)
- [ ] Implement agent verification
- [ ] Create credit verification system
- [ ] Build verification request workflow
- [ ] Add badge display on profiles

### 13. Community Events & Workshops
- [ ] Create events listing page
- [ ] Build event creation interface
- [ ] Implement RSVP system
- [ ] Add virtual event support
- [ ] Create workshop scheduling

### 14. Enhanced Analytics Dashboard
- [ ] Build submission tracking for actors
- [ ] Create audition analytics
- [ ] Implement booking analytics
- [ ] Build response rate analytics for directors
- [ ] Add trend analysis and insights


## Phase 3: Advanced Features

### 2. Social Feed & Networking Feature
- [ ] Create posts table (userId, content, likes, comments)
- [ ] Create follows table (followerId, followingId)
- [ ] Create groups table (name, genre, location, members)
- [ ] Build API endpoints for posts (create, read, like, comment)
- [ ] Build API endpoints for follows (follow, unfollow, get followers)
- [ ] Build API endpoints for groups (create, join, leave)
- [ ] Create social feed UI screen
- [ ] Create post creation modal
- [ ] Create groups discovery screen
- [ ] Add follow/unfollow buttons to profiles

### 3. Job & Casting Board Feature
- [ ] Create casting_calls table (producerId, title, description, roles, deadline)
- [ ] Create submissions table (actorId, castingCallId, videoUrl, notes)
- [ ] Build API endpoints for casting calls (create, read, update)
- [ ] Build API endpoints for submissions (create, read, update status)
- [ ] Create casting board screen for directors
- [ ] Create role posting form
- [ ] Create submissions management interface
- [ ] Create actor-side casting board with submissions
- [ ] Add video submission upload
- [ ] Add submission status tracking

### 4. AI Smart Matching Feature
- [ ] Create matching algorithm based on skills, experience, availability
- [ ] Build recommendation API endpoint
- [ ] Create recommendations screen for directors
- [ ] Create recommendations screen for actors
- [ ] Add recommendation cards with match score
- [ ] Implement filtering by match strength
- [ ] Add one-click contact from recommendations
- [ ] Track recommendation engagement metrics


## Bug Fixes - Navigation & Actors Screen
- [x] Fix error that appears when navigating to actors screen (Fixed: Added missing Image import from expo-image)


## Deployment to Vercel
- [ ] Configure Vercel deployment settings
- [ ] Deploy web app to Vercel free tier
- [ ] Set up permanent Vercel subdomain
- [ ] Configure environment variables on Vercel
- [ ] Test deployed app functionality

## Social Features - Phase 1 (Core)
### Follow System
- [ ] Create follows table in database
- [ ] Add follow/unfollow API endpoints
- [ ] Add follow button to actor/producer profiles
- [ ] Display follower/following counts on profiles
- [ ] Add followers list screen

### Activity Feed
- [ ] Create activity_feed table in database
- [ ] Add activity logging for key events (new contract, contract signed, review posted)
- [ ] Build activity feed screen showing recent activity
- [ ] Add filters for activity types
- [ ] Display user avatars and action descriptions

### Messaging System
- [ ] Create messages table in database
- [ ] Add send message API endpoint
- [ ] Build direct message screen
- [ ] Add message list/conversations screen
- [ ] Display unread message count
- [ ] Add real-time message notifications


## Deployment to Vercel
- [x] Configure Vercel deployment settings (vercel.json created)
- [ ] Deploy web app to Vercel free tier
- [ ] Set up permanent Vercel subdomain
- [ ] Configure environment variables on Vercel
- [ ] Test deployed app functionality

## Social Features - Phase 1 (Core)
### Follow System
- [x] Create follows table in database (already exists in schema)
- [x] Add follow/unfollow API endpoints (implemented in social-router.ts)
- [ ] Add follow button to actor/producer profiles
- [x] Display follower/following counts on profiles (API endpoints created)
- [ ] Add followers list screen (created at app/social/followers.tsx)

### Activity Feed
- [x] Create activity_feed table in database (socialPosts table exists)
- [x] Add activity logging for key events (implemented in social-router.ts)
- [x] Build activity feed screen showing recent activity (created at app/social/feed.tsx)
- [ ] Add filters for activity types
- [ ] Display user avatars and action descriptions

### Messaging System
- [x] Create messages table in database (schema ready)
- [x] Add send message API endpoint (implemented in social-router.ts)
- [x] Build direct message screen (created at app/social/messages.tsx)
- [ ] Add message list/conversations screen (partial implementation)
- [ ] Display unread message count
- [ ] Add real-time message notifications


## Messaging & Calling Features
- [x] Create messages database table
- [x] Create messaging API endpoints
- [x] Build conversations list screen
- [x] Build chat/message screen
- [x] Add call button with phone integration
- [x] Add message/call buttons to actor profiles
- [x] Add messages link to profile screen


## Push Notifications & Phone Number Features
- [x] Add phone number field to actor profiles database
- [x] Add phone number field to producer profiles database
- [x] Update actor profile edit screen with phone number input
- [x] Update producer profile edit screen with phone number input
- [x] Implement push notifications for new messages
- [x] Update call button to dial phone numbers


## Development Build (EAS Build)
- [x] Set up EAS Build configuration (eas.json)
- [x] Configure app for development build (expo-dev-client added)
- [x] Create development build guide
- [ ] Create Expo account and link project (user action required)
- [ ] Build Android APK for testing (user action required)
- [ ] Build iOS app for testing (requires Apple Developer account)


## Video Audition Feature
- [ ] Research and select video call SDK (Agora/Twilio/Daily.co)
- [ ] Create audition_calls database table (participants, scheduled_time, status, recording_url)
- [ ] Create video call API endpoints (create room, join room, end call)
- [ ] Build video call UI screen with camera/mic controls
- [ ] Implement audition scheduling and invitation flow
- [ ] Add push notifications for audition reminders
- [ ] Add call recording option for self-tape reviews
- [ ] Integrate with existing messaging system for call invites


## Video Audition Feature (Daily.co Integration)
- [x] Create database schema for video auditions (video_auditions, audition_participants, audition_invitations tables)
- [x] Create video audition tRPC router with endpoints (scheduleAudition, getAudition, getMyAuditions, joinAudition, leaveAudition, endAudition, cancelAudition, respondToInvitation, getMyInvitations)
- [x] Create auditions list screen (/app/auditions/index.tsx) with status filters and invitation display
- [x] Create audition details screen (/app/auditions/[id]/index.tsx) with full audition info
- [x] Create video call screen (/app/auditions/[id]/call.tsx) with Daily.co WebView integration
- [x] Create schedule audition screen (/app/auditions/schedule.tsx) for producers
- [x] Create invitation response screen (/app/auditions/invitation/[id].tsx) for actors
- [x] Add video auditions link to profile screen
- [x] Add "Schedule Video Audition" to actors quick actions menu
- [x] Install required packages (date-fns, react-native-webview, expo-screen-orientation, @react-native-community/datetimepicker)
- [x] Add new icons to icon-symbol.tsx for video features
- [x] Push notifications for audition invitations and responses
- [ ] Request Daily.co API key from user (DAILY_API_KEY)
- [ ] Test video call functionality in development build
- [ ] Add recording playback screen
- [ ] Add audition reminders before scheduled time
