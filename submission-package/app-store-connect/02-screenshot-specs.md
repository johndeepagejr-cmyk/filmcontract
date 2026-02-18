# App Store Connect — Screenshot Specifications

## Required Device Sizes

| Device | Resolution | Required |
|--------|-----------|----------|
| iPhone 6.7" (iPhone 15 Pro Max) | 1290 × 2796 px | **Yes** (mandatory) |
| iPhone 6.5" (iPhone 11 Pro Max) | 1242 × 2688 px | **Yes** (mandatory) |
| iPhone 5.5" (iPhone 8 Plus) | 1242 × 2208 px | **Yes** (mandatory) |
| iPad Pro 12.9" (6th gen) | 2048 × 2732 px | **Yes** (if supporting iPad) |
| iPad Pro 12.9" (2nd gen) | 2048 × 2732 px | **Yes** (if supporting iPad) |

## Screenshot Count

Upload **6-10 screenshots** per device size. Apple displays the first 3 prominently in search results.

## Recommended Screenshot Sequence (8 screenshots)

Each screenshot should have a **marketing headline** at the top and the **app screen** below, framed in a device mockup.

### Screenshot 1 — Hero / Casting Feed
- **Headline:** "Discover Casting Calls Instantly"
- **Screen:** Actor Home screen showing the casting feed with 3-4 open casting calls
- **Marketing text overlay:** "Browse roles. Submit tapes. Get hired."

### Screenshot 2 — Casting Call Detail
- **Headline:** "Every Detail at a Glance"
- **Screen:** Casting call detail view showing role description, budget, deadline, and Submit button
- **Marketing text overlay:** "Role details, budgets, and deadlines — all in one place"

### Screenshot 3 — Submit Audition
- **Headline:** "Submit Your Audition in Seconds"
- **Screen:** Submission flow showing tape upload or self-tape recording
- **Marketing text overlay:** "Record or upload your audition tape directly"

### Screenshot 4 — Producer Dashboard
- **Headline:** "Manage Your Production"
- **Screen:** Producer Home dashboard showing stats cards (active contracts, pending payments, casting calls)
- **Marketing text overlay:** "Your entire production pipeline at a glance"

### Screenshot 5 — Contracts
- **Headline:** "Professional Contracts, Digitally Signed"
- **Screen:** Contract detail view showing terms, parties, and signature status
- **Marketing text overlay:** "Create, send, and sign — no paperwork needed"

### Screenshot 6 — Secure Payments
- **Headline:** "Payments Protected by Escrow"
- **Screen:** Payment/escrow view showing a completed transaction with escrow status
- **Marketing text overlay:** "Funds held securely until work is delivered"

### Screenshot 7 — Messaging
- **Headline:** "Communicate Directly"
- **Screen:** Messaging conversation between a producer and actor
- **Marketing text overlay:** "Discuss details, negotiate terms, coordinate schedules"

### Screenshot 8 — Actor Profile
- **Headline:** "Build Your Professional Profile"
- **Screen:** Actor profile with headshot, bio, reel, and portfolio photos
- **Marketing text overlay:** "Showcase your talent to producers worldwide"

## Design Guidelines

The following specifications ensure consistency across all screenshots:

| Element | Specification |
|---------|--------------|
| Background gradient | Navy (#1B2838) to dark blue (#0F1923) |
| Headline font | SF Pro Display Bold, 72pt (6.7"), scale proportionally |
| Headline color | White (#FFFFFF) |
| Subtext font | SF Pro Display Regular, 36pt |
| Subtext color | Light gray (#B0BEC5) |
| Device frame | Use Apple's official device frames from developer.apple.com |
| Safe area | 80px padding on all sides |
| App screen position | Centered, 70% of screenshot height |

## Tools for Creating Screenshots

1. **Figma** — Use the "App Store Screenshot" template from the community
2. **Rotato** (rotato.app) — Drag-and-drop device mockup tool
3. **Screenshots Pro** (screenshots.pro) — Automated screenshot framing
4. **LaunchMatic** — AI-powered App Store screenshot generator

## How to Capture Screenshots

1. Run the app on an iPhone 15 Pro Max simulator in Xcode
2. Log in as `testactor@filmcontract.app` / `TestActor2026!` for actor screenshots
3. Log in as `testproducer@filmcontract.app` / `TestProducer2026!` for producer screenshots
4. Use `Cmd + S` in the Simulator to save screenshots
5. Frame them using one of the tools above
6. Export at the exact resolutions listed in the table
