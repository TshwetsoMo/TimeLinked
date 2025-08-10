// theme/colors.ts

export interface Colors {
  // Core Palette
  primary: string;         // Main brand color for interactive elements (buttons, links).
  accent: string;          // A secondary color for highlights, new items, or special actions.
  notification: string;    // Color for errors, alerts, or destructive actions.

  // UI Neutrals
  background: string;      // The base background color for screens.
  card: string;            // The background for elevated surfaces like cards and headers.
  border: string;          // Color for dividers, input borders, and subtle outlines.
  inputBg: string;         // The specific background color for text inputs.

  // Text
  text: string;            // The primary, high-emphasis text color.
  textMuted: string;       // A secondary, lower-emphasis text color for placeholders and metadata.
}

/**
 * A modern, clean, and accessible light theme.
 * Primary Color: Soothing Teal-Blue
 * Accent Color: Warm Amber
 */
export const LightColors: Colors = {
  // Core Palette
  primary:      '#00796B', // A deep, trustworthy teal
  accent:       '#FFA000', // A warm, inviting amber/orange for highlights
  notification: '#D32F2F', // A standard, clear red for errors

  // UI Neutrals
  background:   '#F4F6F8', // A very light, soft gray, easier on the eyes than pure white
  card:         '#FFFFFF', // Pure white for cards to make them pop
  border:       '#E0E0E0', // A subtle, light gray for borders
  inputBg:      '#FFFFFF', // Inputs match the card background

  // Text
  text:         '#212121', // A dark, near-black for high contrast and readability
  textMuted:    '#66757F', // A muted, professional gray for secondary text
};

/**
 * A modern, calming, and high-contrast dark theme.
 * Primary Color: Bright Teal-Blue
 * Accent Color: Rich Amber
 */
export const DarkColors: Colors = {
  // Core Palette
  primary:      '#48B5A9', // A brighter, more vibrant teal for dark backgrounds
  accent:       '#FFC107', // A rich, vibrant gold for highlights
  notification: '#EF5350', // A slightly brighter red for visibility on dark backgrounds

  // UI Neutrals
  background:   '#121212', // A true, deep black as per Material Design dark theme guidelines
  card:         '#1E1E1E', // An elevated surface color, slightly lighter than the background
  border:       '#2F2F2F', // A subtle border color that's visible but not distracting
  inputBg:      '#2F2F2F', // Inputs can have a slightly different shade to stand out

  // Text
  text:         '#E1E1E1', // An off-white for primary text to reduce eye strain
  textMuted:    '#9E9E9E', // A light gray for secondary text
};