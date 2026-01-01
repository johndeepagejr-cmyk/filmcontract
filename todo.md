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
