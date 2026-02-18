# Google Play Console — Screenshots & Feature Graphic

## Screenshot Requirements

| Device Type | Resolution | Min Count | Max Count |
|-------------|-----------|-----------|-----------|
| Phone | 1080 × 1920 px (min) to 1440 × 2560 px (recommended) | 2 | 8 |
| 7-inch Tablet | 1200 × 1920 px | 0 (recommended: 2+) | 8 |
| 10-inch Tablet | 1600 × 2560 px | 0 (recommended: 2+) | 8 |

Use the same 8-screenshot sequence from the App Store package (see `app-store-connect/02-screenshot-specs.md`), resized to the Google Play dimensions. The marketing headlines and layout remain the same.

## Feature Graphic (Required)

The feature graphic is the large banner displayed at the top of your Play Store listing and in promotional placements.

| Property | Value |
|----------|-------|
| Dimensions | 1024 × 500 px |
| Format | PNG or JPEG |
| Max file size | 1 MB |

### Design Specification

**Layout:** Centered composition on a dark gradient background.

| Element | Specification |
|---------|--------------|
| Background | Linear gradient: #1B2838 (top-left) → #0A1628 (bottom-right) |
| App icon | Centered-left, 200 × 200 px, with subtle drop shadow |
| App name | "FilmContract" — White (#FFFFFF), bold, 72px, right of icon |
| Tagline | "Casting. Contracts. Payments." — Light gray (#B0BEC5), 32px, below app name |
| Accent elements | Two thin horizontal lines in primary blue (#0A7EA4), flanking the tagline |
| Bottom strip | Subtle film strip pattern at 10% opacity along the bottom edge |

**Do NOT include:**
- Screenshots of the app (Google discourages this in feature graphics)
- Pricing or promotional text ("FREE", "50% OFF")
- Badges or award logos
- Text that would be unreadable at small sizes

### Creating the Feature Graphic

1. **Figma:** Create a 1024 × 500 frame, apply the gradient, place the icon and text
2. **Canva:** Use the "YouTube Channel Art" template (similar dimensions), customize
3. **Photoshop/Illustrator:** Standard canvas at 1024 × 500, 72 DPI

---

## Promotional Video (Optional)

Google Play supports a YouTube video link (not a direct upload like Apple). If you record the App Preview video for iOS, upload it to YouTube as **unlisted** and paste the link.

| Property | Value |
|----------|-------|
| Format | YouTube URL (unlisted or public) |
| Recommended length | 30 seconds to 2 minutes |
| Orientation | Portrait preferred for phone apps |

---

## Hi-Res Icon (Required)

| Property | Value |
|----------|-------|
| Dimensions | 512 × 512 px |
| Format | PNG (32-bit, with alpha) |
| Shape | Full-bleed square (Google applies the adaptive icon mask automatically) |

Use the same app icon from `assets/images/icon.png`, exported at 512 × 512.
