/**
 * Film Contract Design System Tokens
 * Professional navy/gold palette with cinematic dark mode
 * 8pt grid system, Inter/SF Pro typography
 */

// ─── Typography ──────────────────────────────────────────────
export const Typography = {
  // Display
  displayLg: { fontSize: 34, fontWeight: "800" as const, lineHeight: 41, letterSpacing: -0.4 },
  displayMd: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.3 },
  displaySm: { fontSize: 22, fontWeight: "700" as const, lineHeight: 28, letterSpacing: -0.2 },

  // Headings
  h1: { fontSize: 20, fontWeight: "700" as const, lineHeight: 25 },
  h2: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
  h3: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },

  // Body
  bodyLg: { fontSize: 17, fontWeight: "400" as const, lineHeight: 24 },
  bodyMd: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  bodySm: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },

  // Labels
  labelLg: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
  labelMd: { fontSize: 13, fontWeight: "600" as const, lineHeight: 18 },
  labelSm: { fontSize: 11, fontWeight: "600" as const, lineHeight: 14, letterSpacing: 0.3 },

  // Monospaced (for contract terms, legal text)
  mono: { fontSize: 13, fontWeight: "400" as const, lineHeight: 20, fontFamily: "monospace" as const },
  monoSm: { fontSize: 11, fontWeight: "400" as const, lineHeight: 16, fontFamily: "monospace" as const },

  // Caption
  caption: { fontSize: 11, fontWeight: "400" as const, lineHeight: 14 },
} as const;

// ─── Spacing (8pt grid) ─────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
} as const;

// ─── Border Radius ──────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

// ─── Shadows ────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

// ─── Animation Durations ────────────────────────────────────
export const Duration = {
  instant: 80,
  fast: 150,
  normal: 250,
  slow: 400,
  page: 350,
} as const;

// ─── Contract Status Colors ─────────────────────────────────
export const ContractStatusColors = {
  draft:       { bg: "#E5E7EB", text: "#6B7280" },
  sent:        { bg: "#DBEAFE", text: "#1D4ED8" },
  opened:      { bg: "#E0E7FF", text: "#4338CA" },
  negotiating: { bg: "#FEF3C7", text: "#B45309" },
  signed:      { bg: "#D1FAE5", text: "#065F46" },
  active:      { bg: "#CFFAFE", text: "#0E7490" },
  completed:   { bg: "#F3E8FF", text: "#7C3AED" },
  expired:     { bg: "#FEE2E2", text: "#991B1B" },
  cancelled:   { bg: "#FEE2E2", text: "#991B1B" },
} as const;

// ─── Verification Badge Types ───────────────────────────────
export const VerificationTypes = {
  union:    { icon: "🎭", label: "Union Verified", color: "#C9963B" },
  imdb:     { icon: "⭐", label: "IMDb Verified", color: "#F5C518" },
  email:    { icon: "✉️", label: "Email Confirmed", color: "#0969DA" },
  phone:    { icon: "📱", label: "Phone Verified", color: "#1A7F37" },
  govId:    { icon: "🪪", label: "ID Verified", color: "#8250DF" },
} as const;

// ─── Project Types ──────────────────────────────────────────
export const ProjectTypes = [
  "Feature Film",
  "Television Series",
  "TV Movie",
  "Short Film",
  "Commercial",
  "Music Video",
  "Web Series",
  "Documentary",
  "Industrial/Corporate",
  "Voice Over",
  "Theater",
  "Other",
] as const;

// ─── Rate Types ─────────────────────────────────────────────
export const RateTypes = [
  { value: "daily", label: "Daily Rate" },
  { value: "weekly", label: "Weekly Rate" },
  { value: "flat", label: "Flat Fee" },
  { value: "usage", label: "Usage/Buyout" },
  { value: "scale", label: "SAG Scale" },
  { value: "scale_plus", label: "SAG Scale + 10%" },
] as const;

// ─── Payment Schedules ─────────────────────────────────────
export const PaymentSchedules = [
  { value: "upfront", label: "100% Upfront" },
  { value: "deposit_balance", label: "50/50 Deposit + Balance" },
  { value: "thirds", label: "Thirds (Start/Mid/Wrap)" },
  { value: "net_15", label: "Net 15 Days" },
  { value: "net_30", label: "Net 30 Days" },
  { value: "net_60", label: "Net 60 Days" },
] as const;

// ─── Usage Rights ───────────────────────────────────────────
export const UsageRights = [
  { value: "theatrical", label: "Theatrical" },
  { value: "streaming", label: "Streaming/VOD" },
  { value: "broadcast", label: "Broadcast TV" },
  { value: "social_media", label: "Social Media" },
  { value: "web", label: "Web/Digital" },
  { value: "print", label: "Print" },
  { value: "all_media", label: "All Media (Buyout)" },
] as const;

export const UsageTerritories = [
  { value: "domestic", label: "Domestic (US)" },
  { value: "north_america", label: "North America" },
  { value: "worldwide", label: "Worldwide" },
  { value: "specific", label: "Specific Territories" },
] as const;

export const UsageTerms = [
  { value: "1_year", label: "1 Year" },
  { value: "2_years", label: "2 Years" },
  { value: "5_years", label: "5 Years" },
  { value: "perpetuity", label: "In Perpetuity" },
] as const;

// ─── Union Types ────────────────────────────────────────────
export const UnionTypes = [
  { value: "sag_aftra", label: "SAG-AFTRA" },
  { value: "equity", label: "Actors' Equity" },
  { value: "iatse", label: "IATSE" },
  { value: "dga", label: "DGA" },
  { value: "wga", label: "WGA" },
  { value: "non_union", label: "Non-Union" },
  { value: "fi_core", label: "Financial Core" },
] as const;
