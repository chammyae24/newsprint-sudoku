import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyState {
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  elapsedSeconds: number;
  difficulty: 'MEDIUM'; // Fixed difficulty for daily challenge
}

export interface DailyStreak {
  currentStreak: number;
  lastCompletedDate: string | null; // "YYYY-MM-DD"
}

const DAILY_STATE_KEY = 'newsprint_sudoku_daily_state';
const DAILY_STREAK_KEY = 'newsprint_sudoku_daily_streak';

export async function getDailyStateAsync(): Promise<DailyState | null> {
  try {
    const json = await AsyncStorage.getItem(DAILY_STATE_KEY);
    if (!json) return null;

    // Check if the saved state is for today
    const state = JSON.parse(json) as DailyState;
    const today = new Date().toISOString().split('T')[0];

    if (state.date === today) {
      return state;
    }
    return null;
  } catch (error) {
    console.error('Failed to load daily state:', error);
    return null;
  }
}

export async function saveDailyStateAsync(state: DailyState): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save daily state:', error);
  }
}

export async function getDailyStreakAsync(): Promise<number> {
  try {
    const json = await AsyncStorage.getItem(DAILY_STREAK_KEY);
    if (!json) return 0;
    const streakData = JSON.parse(json) as DailyStreak;
    return streakData.currentStreak;
  } catch (error) {
    console.error('Failed to load streak:', error);
    return 0;
  }
}

export async function updateDailyStreakAsync(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const json = await AsyncStorage.getItem(DAILY_STREAK_KEY);

    let streakData: DailyStreak = {
      currentStreak: 0,
      lastCompletedDate: null,
    };

    if (json) {
      streakData = JSON.parse(json);
    }

    // If already completed today, do nothing
    if (streakData.lastCompletedDate === today) {
      return;
    }

    // Check if yesterday was completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (streakData.lastCompletedDate === yesterdayStr) {
      streakData.currentStreak++;
    } else {
      streakData.currentStreak = 1;
    }

    streakData.lastCompletedDate = today;
    await AsyncStorage.setItem(DAILY_STREAK_KEY, JSON.stringify(streakData));
  } catch (error) {
    console.error('Failed to update streak:', error);
  }
}
