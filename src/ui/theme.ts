/**
 * Centralized theme system for Newsprint Sudoku.
 *
 * Three newspaper-inspired themes with semantic color tokens.
 */

export type ThemeName = 'morning' | 'evening' | 'vintage';

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;

  // Core surfaces
  bg: string; // Page background
  surface: string; // Cards, modals, buttons
  surfaceAlt: string; // Alternate surface (e.g. table headers)

  // Text
  text: string; // Primary text
  textSecondary: string; // Subdued text
  textMuted: string; // Very subtle text

  // Accents
  accent: string; // Gold / primary accent
  accentText: string; // Text on accent backgrounds
  error: string; // Red / error / lives lost
  success: string; // Green / completion

  // Structural
  border: string; // Strong borders (grid, dividers)
  borderLight: string; // Subtle borders
  shadow: string; // Shadow color

  // UI Elements
  buttonBg: string; // Primary button background
  buttonText: string; // Primary button text
  buttonSecondaryBg: string;
  buttonSecondaryText: string;
  buttonActiveBg: string;
  buttonActiveText: string;

  // Board
  cellBg: string;
  cellGivenText: string;
  cellUserText: string;
  cellSelectedBg: string;
  cellHighlightBg: string;
  cellPeerBg: string;
  gridLine: string;
  gridLineMajor: string;

  // Notes
  noteText: string;

  // Header
  headerBg: string;
  headerText: string;
  badgeBg: string;
  badgeText: string;
}

// ── Morning Edition (Default) ──
// The current warm cream/brown newsprint look
export const MORNING_THEME: Theme = {
  name: 'morning',
  label: 'Morning Edition',
  description: 'Warm cream & brown newsprint',

  bg: '#F5EDE0',
  surface: '#FDF8F0',
  surfaceAlt: '#EDE3D0',

  text: '#2A2118',
  textSecondary: '#6B5540',
  textMuted: '#8B7355',

  accent: '#edb942',
  accentText: '#2e1c00',
  error: '#A02020',
  success: '#3A8F3A',

  border: '#2A2118',
  borderLight: '#D4C5A8',
  shadow: '#000000',

  buttonBg: '#4A3828',
  buttonText: '#F5EDE0',
  buttonSecondaryBg: '#EDE3D0',
  buttonSecondaryText: '#8B7355',
  buttonActiveBg: '#A02020',
  buttonActiveText: '#FDF8F0',

  cellBg: '#FDF8F0',
  cellGivenText: '#2A2118',
  cellUserText: '#1d1df6',
  cellSelectedBg: '#edb94240',
  cellHighlightBg: '#edb94218',
  cellPeerBg: '#EDE3D0',
  gridLine: '#C4B08A',
  gridLineMajor: '#2A2118',

  noteText: '#8B7355',

  headerBg: '#2A2118',
  headerText: '#F5EDE0',
  badgeBg: '#edb942',
  badgeText: '#2e1c00',
};

// ── Evening Post (Dark) ──
// Deep charcoal with warm amber accents
export const EVENING_THEME: Theme = {
  name: 'evening',
  label: 'Evening Post',
  description: 'Dark charcoal with amber accents',

  bg: '#1A1610',
  surface: '#2A2520',
  surfaceAlt: '#3A3530',

  text: '#E8DCC8',
  textSecondary: '#B0A48A',
  textMuted: '#8A7E68',

  accent: '#E8A832',
  accentText: '#1A1610',
  error: '#D04040',
  success: '#50B050',

  border: '#8A7E68',
  borderLight: '#4A4540',
  shadow: '#000000',

  buttonBg: '#E8A832',
  buttonText: '#1A1610',
  buttonSecondaryBg: '#3A3530',
  buttonSecondaryText: '#B0A48A',
  buttonActiveBg: '#D04040',
  buttonActiveText: '#F5EDE0',

  cellBg: '#2A2520',
  cellGivenText: '#E8DCC8',
  cellUserText: '#6D9EEB',
  cellSelectedBg: '#E8A83240',
  cellHighlightBg: '#E8A83218',
  cellPeerBg: '#3A3530',
  gridLine: '#4A4540',
  gridLineMajor: '#8A7E68',

  noteText: '#8A7E68',

  headerBg: '#E8A832',
  headerText: '#1A1610',
  badgeBg: '#E8A832',
  badgeText: '#1A1610',
};

// ── Vintage Telegram ──
// Aged yellow/sepia with dark olive and rust red
export const VINTAGE_THEME: Theme = {
  name: 'vintage',
  label: 'Vintage Telegram',
  description: 'Aged sepia with olive & rust',

  bg: '#F0E6C8',
  surface: '#F8F0D8',
  surfaceAlt: '#E0D6B8',

  text: '#3A3828',
  textSecondary: '#6A6448',
  textMuted: '#8A8468',

  accent: '#B85C28',
  accentText: '#F8F0D8',
  error: '#B03030',
  success: '#4A7A3A',

  border: '#5A5840',
  borderLight: '#C8C0A0',
  shadow: '#3A3828',

  buttonBg: '#5A5840',
  buttonText: '#F0E6C8',
  buttonSecondaryBg: '#E0D6B8',
  buttonSecondaryText: '#6A6448',
  buttonActiveBg: '#B85C28',
  buttonActiveText: '#F8F0D8',

  cellBg: '#F8F0D8',
  cellGivenText: '#3A3828',
  cellUserText: '#2848A0',
  cellSelectedBg: '#B85C2840',
  cellHighlightBg: '#B85C2818',
  cellPeerBg: '#E0D6B8',
  gridLine: '#C8C0A0',
  gridLineMajor: '#5A5840',

  noteText: '#8A8468',

  headerBg: '#5A5840',
  headerText: '#F0E6C8',
  badgeBg: '#B85C28',
  badgeText: '#F0E6C8',
};

export const THEMES: Record<ThemeName, Theme> = {
  morning: MORNING_THEME,
  evening: EVENING_THEME,
  vintage: VINTAGE_THEME,
};

export const getTheme = (name: ThemeName): Theme => {
  return THEMES[name] || MORNING_THEME;
};
