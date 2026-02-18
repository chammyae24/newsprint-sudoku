import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  showTimer: boolean;
  highlightPeers: boolean;
  autoRemoveNotes: boolean; // New feature for Phase 5
  darkMode: boolean; // Future proofing, though we have a fixed theme for now
}

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  showTimer: true,
  highlightPeers: true,
  autoRemoveNotes: true,
  darkMode: false,
};

const SETTINGS_KEY = 'newsprint_sudoku_settings';

interface SettingsStore extends GameSettings {
  // Actions
  toggleSound: () => void;
  toggleHaptics: () => void;
  toggleTimer: () => void;
  toggleHighlightPeers: () => void;
  toggleAutoRemoveNotes: () => void;
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

  loadSettings: async () => {
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY);
      if (json) {
        const saved = JSON.parse(json);
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
      darkMode: settings.darkMode,
    });
    await AsyncStorage.setItem(SETTINGS_KEY, json);
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
