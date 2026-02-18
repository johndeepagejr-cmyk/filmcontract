/** @type {const} */
const themeColors = {
  // Professional navy/gold palette — cinematic dark mode
  primary:    { light: '#1B2A4A', dark: '#4A90D9' },    // Navy / bright blue
  accent:     { light: '#C9963B', dark: '#D4A84B' },    // Gold accent
  background: { light: '#F8F9FB', dark: '#0D1117' },    // Clean white / deep dark
  surface:    { light: '#FFFFFF', dark: '#161B22' },     // Card surfaces
  surfaceAlt: { light: '#F0F2F5', dark: '#1C2128' },    // Alternate surface (input bg)
  foreground: { light: '#1B2A4A', dark: '#E6EDF3' },    // Navy text / light text
  muted:      { light: '#6B7B8D', dark: '#8B949E' },    // Secondary text
  border:     { light: '#D8DEE4', dark: '#30363D' },    // Borders
  success:    { light: '#1A7F37', dark: '#3FB950' },     // Green
  warning:    { light: '#BF8700', dark: '#D29922' },     // Amber
  error:      { light: '#CF222E', dark: '#F85149' },     // Red
  info:       { light: '#0969DA', dark: '#58A6FF' },     // Blue info
};

module.exports = { themeColors };
