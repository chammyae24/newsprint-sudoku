import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty } from '../core/types';
import type { GameStats } from './statsStorage';

// ── Achievement Definitions ──

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'FIRST_WIN',
    title: 'First Edition',
    description: 'Win your first puzzle',
    icon: '📰',
  },
  {
    id: 'STREAK_3',
    title: 'Hat Trick',
    description: 'Win 3 games in a row',
    icon: '🔥',
  },
  {
    id: 'STREAK_7',
    title: 'Weekly Column',
    description: 'Win 7 games in a row',
    icon: '📅',
  },
  {
    id: 'STREAK_14',
    title: 'Fortnight Press',
    description: 'Win 14 games in a row',
    icon: '🏅',
  },
  {
    id: 'PERFECT_GAME',
    title: 'Flawless Print',
    description: 'Complete a puzzle with zero mistakes',
    icon: '⭐',
  },
  {
    id: 'SPEED_DEMON',
    title: 'Hot Off the Press',
    description: 'Complete a puzzle in under 3 minutes',
    icon: '⚡',
  },
  {
    id: 'MASTER_PUZZLER',
    title: 'Editor-in-Chief',
    description: 'Win a Master difficulty puzzle',
    icon: '👑',
  },
  {
    id: 'CENTURY',
    title: 'Centennial Issue',
    description: 'Win 100 puzzles',
    icon: '💯',
  },
  {
    id: 'DAILY_DEVOTEE',
    title: 'Daily Subscriber',
    description: 'Complete 7 daily challenges in a row',
    icon: '📬',
  },
  {
    id: 'TEN_WINS',
    title: 'Regular Reader',
    description: 'Win 10 puzzles',
    icon: '📖',
  },
  {
    id: 'FIFTY_WINS',
    title: 'Seasoned Reporter',
    description: 'Win 50 puzzles',
    icon: '🎖️',
  },
  {
    id: 'HARD_WIN',
    title: 'Investigative Report',
    description: 'Win a Hard difficulty puzzle',
    icon: '🔍',
  },
  {
    id: 'EXPERT_WIN',
    title: 'Breaking News',
    description: 'Win an Expert difficulty puzzle',
    icon: '📡',
  },
];

// ── State ──

export type AchievementState = Record<string, number | null>; // id -> unlockedAt timestamp (null = locked)

const ACHIEVEMENTS_KEY = 'newsprint_sudoku_achievements';

export async function loadAchievementsAsync(): Promise<AchievementState> {
  try {
    const json = await AsyncStorage.getItem(ACHIEVEMENTS_KEY);
    if (json) {
      return JSON.parse(json);
    }
    return {};
  } catch (error) {
    console.error('Failed to load achievements:', error);
    return {};
  }
}

export async function saveAchievementsAsync(
  state: AchievementState
): Promise<void> {
  try {
    await AsyncStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save achievements:', error);
  }
}

// ── Unlock Logic ──

export interface GameResultForAchievements {
  won: boolean;
  difficulty: Difficulty;
  elapsedSeconds: number;
  mistakes: number;
  stats: GameStats; // Stats AFTER this game was recorded
  dailyStreak?: number; // Current daily streak
}

/**
 * Check and unlock achievements based on the latest game result.
 * Returns the list of NEWLY unlocked achievement IDs.
 */
export async function checkAndUnlockAchievements(
  result: GameResultForAchievements
): Promise<AchievementDef[]> {
  const current = await loadAchievementsAsync();
  const newlyUnlocked: AchievementDef[] = [];

  const tryUnlock = (id: string) => {
    if (!current[id]) {
      current[id] = Date.now();
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) newlyUnlocked.push(def);
    }
  };

  if (!result.won) {
    // No achievements for losses
    await saveAchievementsAsync(current);
    return newlyUnlocked;
  }

  const { stats } = result;

  // First win
  if (stats.totalGamesWon >= 1) tryUnlock('FIRST_WIN');

  // Win count milestones
  if (stats.totalGamesWon >= 10) tryUnlock('TEN_WINS');
  if (stats.totalGamesWon >= 50) tryUnlock('FIFTY_WINS');
  if (stats.totalGamesWon >= 100) tryUnlock('CENTURY');

  // Streak milestones
  if (stats.currentWinStreak >= 3) tryUnlock('STREAK_3');
  if (stats.currentWinStreak >= 7) tryUnlock('STREAK_7');
  if (stats.currentWinStreak >= 14) tryUnlock('STREAK_14');

  // Perfect game
  if (result.mistakes === 0) tryUnlock('PERFECT_GAME');

  // Speed demon (under 3 minutes)
  if (result.elapsedSeconds < 180) tryUnlock('SPEED_DEMON');

  // Difficulty-based
  if (
    result.difficulty === Difficulty.HARD ||
    result.difficulty === Difficulty.EXPERT ||
    result.difficulty === Difficulty.MASTER
  ) {
    tryUnlock('HARD_WIN');
  }
  if (
    result.difficulty === Difficulty.EXPERT ||
    result.difficulty === Difficulty.MASTER
  ) {
    tryUnlock('EXPERT_WIN');
  }
  if (result.difficulty === Difficulty.MASTER) {
    tryUnlock('MASTER_PUZZLER');
  }

  // Daily devotee
  if (result.dailyStreak && result.dailyStreak >= 7) {
    tryUnlock('DAILY_DEVOTEE');
  }

  await saveAchievementsAsync(current);
  return newlyUnlocked;
}
