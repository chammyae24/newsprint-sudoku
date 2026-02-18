# Phase 5: Engagement & Retention — Feature Plan

## Overview

Phase 5 transforms Newsprint Sudoku from a feature-complete puzzle game into an app players **come back to daily**. This phase adds persistence (stats, streaks), quality-of-life improvements (undo/redo, auto-note cleanup, pause screen), engagement hooks (daily challenge), and visual polish (animations, settings).

**Priority order is designed for maximum impact with minimal effort first.**

---

## Step 1: Undo / Redo UI Buttons (Quick Win)

> The `undo()` / `redo()` actions and full stacks already exist in `GameStore.ts`. We just need buttons.

### 1.1 Add Undo / Redo Buttons to Game Screen

**File:** `app/game/index.tsx`

**Changes:**

- Import `undo` and `redo` from `useGameStore`
- Import `undoStack` and `redoStack` lengths for disabled state
- Add two buttons to the `actionsRow` — positioned before the Eraser:

```tsx
const undo = useGameStore((state) => state.undo);
const redo = useGameStore((state) => state.redo);
const canUndo = useGameStore((state) => state.undoStack.length > 0);
const canRedo = useGameStore((state) => state.redoStack.length > 0);

// In actionsRow:
<Pressable
  style={[styles.actionButton, !canUndo && styles.actionButtonDisabled]}
  onPress={undo}
  disabled={!canUndo}
>
  <Text style={[styles.actionText, !canUndo && styles.actionTextDisabled]}>
    ↩️ Undo
  </Text>
</Pressable>

<Pressable
  style={[styles.actionButton, !canRedo && styles.actionButtonDisabled]}
  onPress={redo}
  disabled={!canRedo}
>
  <Text style={[styles.actionText, !canRedo && styles.actionTextDisabled]}>
    ↪️ Redo
  </Text>
</Pressable>
```

### 1.2 Add Disabled Button Styles

```tsx
actionButtonDisabled: {
  opacity: 0.4,
  borderBottomWidth: 2,
},
actionTextDisabled: {
  color: '#B0A898',
},
```

---

## Step 2: Statistics & Progress Tracking

### 2.1 Define Stats Data Model

**File:** `src/storage/statsStorage.ts` [NEW]

```typescript
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

export interface DifficultyStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTime: number | null; // seconds
  averageTime: number | null; // seconds
  totalMistakes: number;
  perfectGames: number; // 0 mistakes
}
```

### 2.2 Stats Persistence Functions

**File:** `src/storage/statsStorage.ts` (continued)

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'newsprint_sudoku_stats';

export async function loadStatsAsync(): Promise<GameStats> { ... }
export async function saveStatsAsync(stats: GameStats): Promise<void> { ... }

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
  const ds = stats.byDifficulty[result.difficulty];
  ds.gamesPlayed++;
  if (result.won) {
    ds.gamesWon++;
    ds.bestTime = ds.bestTime ? Math.min(ds.bestTime, result.elapsedSeconds) : result.elapsedSeconds;
    ds.averageTime = ds.averageTime
      ? Math.round((ds.averageTime * (ds.gamesWon - 1) + result.elapsedSeconds) / ds.gamesWon)
      : result.elapsedSeconds;
    if (result.mistakes === 0) ds.perfectGames++;
  }
  ds.totalMistakes += result.mistakes;

  // Update technique usage
  for (const move of result.moveHistory) {
    if (move.technique) {
      stats.techniqueUsage[move.technique] = (stats.techniqueUsage[move.technique] || 0) + 1;
    }
  }

  await saveStatsAsync(stats);
}
```

### 2.3 Integrate Recording into Game Flow

**File:** `app/game/index.tsx`

- In the `useEffect` that clears saved games on win/loss, also call `recordGameResult()`
- Pass `difficulty`, `isGameWon`, `elapsedSeconds`, `mistakes`, and `moveHistory`

### 2.4 Create Statistics Screen

**File:** `app/stats/index.tsx` [NEW]

A full-screen modal or page displaying:

| Section                  | Content                                                              |
| ------------------------ | -------------------------------------------------------------------- |
| **Overview Strip**       | Games played, win rate %, current streak 🔥, best streak             |
| **Per-Difficulty Table** | For each difficulty: played, won, best time, avg time, perfect games |
| **Technique Breakdown**  | Bar chart or ranked list of most-used techniques                     |

**Design:** Newsprint style — use `SpecialElite_400Regular` for labels, `PlayfairDisplay_700Bold` for numbers. Present stats like a newspaper's sports section standings table.

### 2.5 Add Stats Navigation

- Add a "📊 Stats" button to the home screen (`app/index.tsx`)
- Add a "📊 Stats" button to the WinModal and LoseModal

---

## Step 3: Daily Challenge

### 3.1 Seeded Puzzle Generator

**File:** `src/core/SudokuGenerator.ts`

Add a seeded variant that uses a date-based seed:

```typescript
export function generateDailyPuzzle(
  date: Date,
  difficulty: Difficulty
): SudokuCell[][] {
  // Use YYYYMMDD as seed for deterministic generation
  const seed =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  // Use seeded PRNG (e.g., mulberry32) instead of Math.random()
  const rng = createSeededRNG(seed + difficultyOffset(difficulty));
  // Pass rng to existing generator logic
  return generateWithRNG(rng, difficulty);
}

// Simple seeded PRNG
function createSeededRNG(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
```

### 3.2 Daily Challenge State

**File:** `src/storage/dailyStorage.ts` [NEW]

```typescript
export interface DailyState {
  date: string;           // "2025-02-18"
  completed: boolean;
  elapsedSeconds: number;
  streak: number;
}

export async function getDailyStateAsync(): Promise<DailyState | null> { ... }
export async function saveDailyStateAsync(state: DailyState): Promise<void> { ... }
export async function getDailyStreakAsync(): Promise<number> { ... }
```

### 3.3 Daily Challenge UI

**File:** `app/index.tsx`

Add a "Daily Challenge" button to the home screen with:

- Today's date as a newspaper dateline
- A "🔥 3-day streak" badge if applicable
- A ✅ checkmark if today's puzzle is already completed

```tsx
<Pressable onPress={handleDailyChallenge} style={styles.tornPaperButton}>
  <View style={styles.postalStamp}>
    <Text style={styles.postalStampText}>DAILY</Text>
  </View>
  <Text style={styles.buttonTitle}>TODAY'S PUZZLE</Text>
  <Text style={styles.buttonSubtitle}>
    {dailyCompleted ? '✅ Completed' : formatDate(new Date())}
  </Text>
</Pressable>
```

---

## Step 4: Animations & Transitions

> Install `react-native-reanimated` if not already present.

### 4.1 Cell Value Appear Animation

**File:** `src/ui/components/Cell.tsx`

When a digit is placed (user or pending confirmed), animate it with a scale-in:

```tsx
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';

// On value change: scale from 0.5 → 1.0 with spring
const scale = useSharedValue(0.5);
useEffect(() => {
  if (cell.value !== null && !cell.isGiven) {
    scale.value = 0.5;
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }
}, [cell.value]);

// Wrap the value Text in Animated.Text with animatedStyle
```

### 4.2 Error Shake Animation

When `isError` becomes true, shake the cell horizontally:

```tsx
import { withSequence, withTiming } from 'react-native-reanimated';

useEffect(() => {
  if (isError) {
    translateX.value = withSequence(
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }
}, [isError]);
```

### 4.3 Win Celebration

**File:** `src/ui/components/WinModal.tsx`

Add a simple confetti-like effect using animated dots/stars:

- Spawn 20-30 small `Text` elements ("★", "✦", "•") with random positions
- Animate each with `withDelay` + `withTiming` for a staggered falling effect
- All wrapped in an `Animated.View` that fades in

### 4.4 Board Entrance Animation

When `newGame()` is called, stagger-animate each row sliding in from the left:

```tsx
// Each row gets a delay: row 0 = 0ms, row 1 = 50ms, ... row 8 = 400ms
const delay = rowIndex * 50;
translateX.value = withDelay(delay, withTiming(0, { duration: 300 }));
opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
```

### 4.5 Modal Transitions

For `WinModal`, `LoseModal`, `LevelSelector`:

- Slide up from bottom with `withSpring`
- Backdrop fades in with `withTiming`

---

## Step 5: Settings Screen

### 5.1 Settings Store

**File:** `src/storage/settingsStorage.ts` [NEW]

```typescript
export interface AppSettings {
  hapticFeedback: boolean;     // default: true
  showTimer: boolean;          // default: true
  autoRemoveNotes: boolean;    // default: false (see Step 6)
  highlightPeers: boolean;     // default: true
  highlightSameDigit: boolean; // default: true
  darkMode: boolean;           // default: false (future)
}

export async function loadSettingsAsync(): Promise<AppSettings> { ... }
export async function saveSettingsAsync(settings: AppSettings): Promise<void> { ... }
```

### 5.2 Settings Screen UI

**File:** `app/settings/index.tsx` [NEW]

Newsprint-styled settings screen with toggle switches:

| Setting                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| **Haptic Feedback**      | Enable/disable vibrations                      |
| **Show Timer**           | Hide timer for stress-free play                |
| **Auto-Remove Notes**    | Auto-clear notes from peers on digit placement |
| **Highlight Peers**      | Highlight row/col/box of selected cell         |
| **Highlight Same Digit** | Highlight all cells with same value            |

**Design:** Each setting is a row with a `SpecialElite` label and a custom toggle styled as an ink switch (filled circle slides between two positions).

### 5.3 Add Settings Navigation

- Add a "⚙️ Settings" button to the home screen
- Wire settings values into `GameStore` or read from context

---

## Step 6: Auto-Note Cleanup

### 6.1 Modify `setCellValue` in GameStore

**File:** `src/store/GameStore.ts`

After a correct digit placement, remove that digit from notes in all peer cells:

```typescript
// Inside setCellValue, after confirming correct placement:
if (settings.autoRemoveNotes && value === cell.solutionValue) {
  // Remove 'value' from notes of all cells in same row, col, and box
  for (let i = 0; i < 9; i++) {
    // Same row
    newGrid[row][i].notes = newGrid[row][i].notes.filter((n) => n !== value);
    // Same col
    newGrid[i][col].notes = newGrid[i][col].notes.filter((n) => n !== value);
  }
  // Same box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      newGrid[r][c].notes = newGrid[r][c].notes.filter((n) => n !== value);
    }
  }
}
```

### 6.2 Apply Same Logic to `confirmPendingDigit`

The same note-removal should fire when a handwritten pending digit is confirmed.

### 6.3 Apply Same Logic to `placeFastSolveDigit`

The same note-removal should fire in fast-solve mode.

---

## Step 7: Pause Screen

### 7.1 Pause Overlay Component

**File:** `src/ui/components/PauseOverlay.tsx` [NEW]

When `isPaused` is true, render a full overlay that **hides the board**:

```tsx
export function PauseOverlay({ onResume }: { onResume: () => void }) {
  return (
    <View style={styles.overlay}>
      <Text style={styles.headline}>PAUSED</Text>
      <Text style={styles.subtext}>Puzzle hidden to prevent peeking</Text>
      <Pressable onPress={onResume} style={styles.resumeButton}>
        <Text style={styles.resumeText}>▶ RESUME</Text>
      </Pressable>
    </View>
  );
}
```

**Design:** Full-screen parchment overlay with a large "PAUSED" headline in `PlayfairDisplay_900Black`, styled like a newspaper's "EXTRA! EXTRA!" banner.

### 7.2 Pause / Resume Controls

**File:** `app/game/index.tsx`

- Add a pause button (⏸) next to the timer
- Tapping the timer strip toggles pause
- When paused, show `<PauseOverlay>` and stop the timer

### 7.3 Auto-Pause on App Background

Already partially implemented via `AppState` listener. Extend to set `isPaused = true` when app goes to background, and show the pause overlay on return.

---

## Step 8: Difficulty Rating Indicator

### 8.1 Visual Difficulty Badge

**File:** `app/game/index.tsx`

Replace the plain `DIFFICULTY: EASY` text with a visual stamp/badge:

```tsx
const DIFFICULTY_VISUAL = {
  EASY: { color: '#3A7A3A', dots: 1, label: 'EASY' },
  MEDIUM: { color: '#8B7355', dots: 2, label: 'MEDIUM' },
  HARD: { color: '#A06020', dots: 3, label: 'HARD' },
  EXPERT: { color: '#A02020', dots: 4, label: 'EXPERT' },
  MASTER: { color: '#4A1010', dots: 5, label: 'MASTER' },
};

// Render as a stamp with filled dots (●) for intensity:
// EASY:   ● ○ ○ ○ ○
// MASTER: ● ● ● ● ●
```

---

## Implementation Order & Estimated Effort

| Step | Feature             | Effort | Impact |
| ---- | ------------------- | ------ | ------ |
| 1    | Undo/Redo buttons   | 15 min | ★★★★★  |
| 6    | Auto-Note Cleanup   | 30 min | ★★★★☆  |
| 8    | Difficulty badge    | 30 min | ★★★☆☆  |
| 7    | Pause screen        | 1 hr   | ★★★★☆  |
| 2    | Statistics tracking | 3 hr   | ★★★★★  |
| 5    | Settings screen     | 2 hr   | ★★★★☆  |
| 4    | Animations          | 3 hr   | ★★★★☆  |
| 3    | Daily Challenge     | 4 hr   | ★★★★★  |

**Total estimated: ~14 hours**

---

## Dependencies

| Package                                     | Purpose                      | Already Installed?   |
| ------------------------------------------- | ---------------------------- | -------------------- |
| `react-native-reanimated`                   | Animations (Step 4)          | Check `package.json` |
| `@react-native-async-storage/async-storage` | Stats & settings persistence | ✅ Yes               |
| `expo-haptics`                              | Haptic feedback              | ✅ Yes               |

---

## Files Summary

### New Files

- `src/storage/statsStorage.ts` — Stats data model & persistence
- `src/storage/dailyStorage.ts` — Daily challenge state
- `src/storage/settingsStorage.ts` — App settings persistence
- `app/stats/index.tsx` — Statistics screen
- `app/settings/index.tsx` — Settings screen
- `src/ui/components/PauseOverlay.tsx` — Pause screen overlay

### Modified Files

- `app/game/index.tsx` — Undo/redo buttons, pause controls, difficulty badge, auto-save stats
- `app/index.tsx` — Daily challenge button, stats button, settings button
- `src/store/GameStore.ts` — Auto-note cleanup, settings integration
- `src/core/SudokuGenerator.ts` — Seeded daily puzzle generation
- `src/ui/components/Cell.tsx` — Value appear & error shake animations
- `src/ui/components/WinModal.tsx` — Confetti animation, stats button
- `src/ui/components/LoseModal.tsx` — Stats button
