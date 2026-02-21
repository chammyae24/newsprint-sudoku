import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ThemeName } from '../ui/theme';

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showTimer: boolean;
  highlightPeers: boolean;
  autoRemoveNotes: boolean;
  theme: ThemeName;
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  showTimer: true,
  highlightPeers: true,
  autoRemoveNotes: true,
  theme: 'morning',
};

const SETTINGS_KEY = 'newsprint_sudoku_settings';

interface SettingsStore extends GameSettings {
  // Actions
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleTimer: () => void;
  toggleHighlightPeers: () => void;
  toggleAutoRemoveNotes: () => void;
  setTheme: (theme: ThemeName) => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...DEFAULT_SETTINGS,

  toggleSound: () => {
    const newVal = !get().soundEnabled;
    set({ soundEnabled: newVal });
    saveSettingsAsync({ ...get(), soundEnabled: newVal });
  },

  toggleHaptics: () => {
    const newVal = !get().hapticsEnabled;
    set({ hapticsEnabled: newVal });
    saveSettingsAsync({ ...get(), hapticsEnabled: newVal });
  },

  toggleTimer: () => {
    const newVal = !get().showTimer;
    set({ showTimer: newVal });
    saveSettingsAsync({ ...get(), showTimer: newVal });
  },

  toggleHighlightPeers: () => {
    const newVal = !get().highlightPeers;
    set({ highlightPeers: newVal });
    saveSettingsAsync({ ...get(), highlightPeers: newVal });
  },

  toggleAutoRemoveNotes: () => {
    const newVal = !get().autoRemoveNotes;
    set({ autoRemoveNotes: newVal });
    saveSettingsAsync({ ...get(), autoRemoveNotes: newVal });
  },

  setTheme: (theme: ThemeName) => {
    set({ theme });
    saveSettingsAsync({ ...get(), theme });
  },

  loadSettings: async () => {
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json) {
        const saved = JSON.parse(json);
        // Migrate old darkMode -> theme
        if (saved.darkMode !== undefined && saved.theme === undefined) {
          saved.theme = saved.darkMode ? 'evening' : 'morning';
          delete saved.darkMode;
        }
        set({ ...DEFAULT_SETTINGS, ...saved });
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  },
}));

async function saveSettingsAsync(settings: GameSettings) {
  try {
    const json = JSON.stringify({
      soundEnabled: settings.soundEnabled,
      hapticsEnabled: settings.hapticsEnabled,
      showTimer: settings.showTimer,
      highlightPeers: settings.highlightPeers,
      autoRemoveNotes: settings.autoRemoveNotes,
      theme: settings.theme,
    });
    await AsyncStorage.setItem(SETTINGS_KEY, json);
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
