import AsyncStorage from '@react-native-async-storage/async-storage';
import { Difficulty, MoveRecord } from '../core/types';

export interface DifficultyStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number | null; // seconds
  averageTime: number | null; // seconds
  totalMistakes: number;
  perfectGames: number; // 0 mistakes
}

export interface GameStats {
  // Per-difficulty stats
  byDifficulty: Record<Difficulty, DifficultyStats>;
  // Global
  totalGamesPlayed: number;
  totalGamesWon: number;
  currentWinStreak: number;
  bestWinStreak: number;
  // Technique breakdown
  techniqueUsage: Record<string, number>; // TechniqueType -> count
}

const STATS_KEY = 'newsprint_sudoku_stats';

const DEFAULT_DIFFICULTY_STATS: DifficultyStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestTime: null,
  averageTime: null,
  totalMistakes: 0,
  perfectGames: 0,
};

const DEFAULT_STATS: GameStats = {
  byDifficulty: {
    [Difficulty.EASY]: { ...DEFAULT_DIFFICULTY_STATS },
    [Difficulty.MEDIUM]: { ...DEFAULT_DIFFICULTY_STATS },
    [Difficulty.HARD]: { ...DEFAULT_DIFFICULTY_STATS },
    [Difficulty.EXPERT]: { ...DEFAULT_DIFFICULTY_STATS },
    [Difficulty.MASTER]: { ...DEFAULT_DIFFICULTY_STATS },
  },
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  currentWinStreak: 0,
  bestWinStreak: 0,
  techniqueUsage: {},
};

export async function loadStatsAsync(): Promise<GameStats> {
  try {
    const json = await AsyncStorage.getItem(STATS_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      // Merge with default to ensure all fields/difficulties exist (migration safety)
      return {
        ...DEFAULT_STATS,
        ...parsed,
        byDifficulty: {
          ...DEFAULT_STATS.byDifficulty,
          ...(parsed.byDifficulty || {}),
        },
      };
    }
    return DEFAULT_STATS;
  } catch (error) {
    console.error('Failed to load stats:', error);
    return DEFAULT_STATS;
  }
}

export async function saveStatsAsync(stats: GameStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

export async function recordGameResult(result: {
  difficulty: Difficulty;
  won: boolean;
  elapsedSeconds: number;
  mistakes: number;
  moveHistory: MoveRecord[];
}): Promise<void> {
  const stats = await loadStatsAsync();

  // Update totals
  stats.totalGamesPlayed++;
  if (result.won) {
    stats.totalGamesWon++;
    stats.currentWinStreak++;
    stats.bestWinStreak = Math.max(stats.bestWinStreak, stats.currentWinStreak);
  } else {
    stats.currentWinStreak = 0;
  }

  // Update per-difficulty
  // Ensure difficulty exists in map (it should, but safety first)
  if (!stats.byDifficulty[result.difficulty]) {
    stats.byDifficulty[result.difficulty] = { ...DEFAULT_DIFFICULTY_STATS };
  }
  const ds = stats.byDifficulty[result.difficulty];

  ds.gamesPlayed++;
  if (result.won) {
    ds.gamesWon++;

    // Update best time
    if (ds.bestTime === null || result.elapsedSeconds < ds.bestTime) {
      ds.bestTime = result.elapsedSeconds;
    }

    // Update average time
    if (ds.averageTime === null) {
      ds.averageTime = result.elapsedSeconds;
    } else {
      // Re-calculate average: newAvg = ((oldAvg * (count-1)) + newTime) / count
      // Note: ds.gamesWon is already incremented
      ds.averageTime = Math.round(
        (ds.averageTime * (ds.gamesWon - 1) + result.elapsedSeconds) /
          ds.gamesWon
      );
    }

    if (result.mistakes === 0) ds.perfectGames++;
  }
  ds.totalMistakes += result.mistakes;

  // Update technique usage
  for (const move of result.moveHistory) {
    if (move.technique && move.wasCorrect) {
      const techName = move.technique;
      stats.techniqueUsage[techName] =
        (stats.techniqueUsage[techName] || 0) + 1;
    }
  }

  await saveStatsAsync(stats);
}
