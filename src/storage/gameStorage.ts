import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_GAME_KEY = 'newsprint-sudoku-currentGame';

import type { MoveRecord } from '../core/types';

export interface SavedGameState {
  grid: unknown; // Serialized SudokuCell[][]
  difficulty: string;
  selectedCell: { row: number; col: number } | null;
  inputMode: string;
  mistakes: number;
  isGameOver: boolean;
  isGameWon: boolean;
  elapsedSeconds: number;
  savedAt: number; // Timestamp
  moveHistory: MoveRecord[];
}

// In-memory cache for sync reads
let cachedState: SavedGameState | null = null;
let isLoaded = false;

/**
 * Initialize storage - call this early in app lifecycle
 */
export const initGameStorage = async (): Promise<void> => {
  try {
    const saved = await AsyncStorage.getItem(CURRENT_GAME_KEY);
    if (saved) {
      cachedState = JSON.parse(saved) as SavedGameState;
    }
    isLoaded = true;
  } catch (error) {
    console.error('[GameStorage] Failed to init storage:', error);
    isLoaded = true;
  }
};

/**
 * Saves the current game state to persistent storage.
 */
export const saveGameState = (state: SavedGameState): void => {
  try {
    cachedState = state;
    AsyncStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(state)).catch(
      (err: Error) => console.error('[GameStorage] Failed to save:', err)
    );
  } catch (error) {
    console.error('[GameStorage] Failed to save game state:', error);
  }
};

/**
 * Loads the saved game state from storage (sync from cache).
 */
export const loadGameState = (): SavedGameState | null => {
  return cachedState;
};

/**
 * Async version for initial load
 */
export const loadGameStateAsync = async (): Promise<SavedGameState | null> => {
  try {
    const saved = await AsyncStorage.getItem(CURRENT_GAME_KEY);
    if (saved) {
      cachedState = JSON.parse(saved) as SavedGameState;
      return cachedState;
    }
    return null;
  } catch (error) {
    console.error('[GameStorage] Failed to load game state:', error);
    return null;
  }
};

/**
 * Checks if there's a saved game in storage.
 */
export const hasSavedGame = (): boolean => {
  return cachedState !== null;
};

/**
 * Async version for checking saved game - always re-fetches from storage
 */
export const hasSavedGameAsync = async (): Promise<boolean> => {
  try {
    const saved = await AsyncStorage.getItem(CURRENT_GAME_KEY);
    if (saved) {
      const state = JSON.parse(saved) as SavedGameState;
      cachedState = state;
      // Only return true if game is still playable (not won/lost)
      return !state.isGameOver && !state.isGameWon;
    }
    cachedState = null;
    return false;
  } catch (error) {
    console.error('[GameStorage] Failed to check saved game:', error);
    return false;
  }
};

/**
 * Clears the saved game from storage.
 */
export const clearSavedGame = (): void => {
  cachedState = null;
  AsyncStorage.removeItem(CURRENT_GAME_KEY).catch((err: Error) =>
    console.error('[GameStorage] Failed to clear:', err)
  );
};

/**
 * Gets the timestamp of the last save.
 */
export const getLastSaveTime = (): number | null => {
  return cachedState?.savedAt ?? null;
};
