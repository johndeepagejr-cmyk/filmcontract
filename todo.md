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
