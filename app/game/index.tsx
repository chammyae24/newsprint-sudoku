import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Difficulty } from '../../src/core/types';
import {
  AchievementDef,
  checkAndUnlockAchievements,
} from '../../src/storage/achievementsStorage';
import { getDailyStreakAsync } from '../../src/storage/dailyStorage';
import { clearSavedGame, saveGameState } from '../../src/storage/gameStorage';
import { useSettingsStore } from '../../src/storage/settingsStorage';
import {
  loadStatsAsync,
  recordGameResult,
} from '../../src/storage/statsStorage';
import { useGameStore } from '../../src/store/GameStore';
import { AchievementBanner } from '../../src/ui/components/AchievementBanner';
import { BoardDrawingOverlay } from '../../src/ui/components/BoardDrawingOverlay';
import { Cell } from '../../src/ui/components/Cell';
import { CompletionTimer } from '../../src/ui/components/CompletionTimer';
import { Eraser } from '../../src/ui/components/Eraser';
import { HintOverlay } from '../../src/ui/components/HintOverlay';
import { InputModeSwitcher } from '../../src/ui/components/InputModeSwitcher';
import { Keypad } from '../../src/ui/components/Keypad';
import { LevelSelector } from '../../src/ui/components/LevelSelector';
import { LoseModal } from '../../src/ui/components/LoseModal';
import { MoveHistoryReview } from '../../src/ui/components/MoveHistoryReview';
import { PauseOverlay } from '../../src/ui/components/PauseOverlay';
import { WinModal } from '../../src/ui/components/WinModal';
import { useTheme } from '../../src/ui/hooks/useTheme';
import { haptics } from '../../src/utils/haptics';

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  EXPERT: 'EXPERT',
  MASTER: 'MASTER',
};

export default function GameScreen() {
  const router = useRouter();
  const theme = useTheme();
  const grid = useGameStore((state) => state.grid);
  const difficulty = useGameStore((state) => state.difficulty);
  const newGame = useGameStore((state) => state.newGame);
  const mistakes = useGameStore((state) => state.mistakes);
  const maxMistakes = useGameStore((state) => state.maxMistakes);
  const inputMode = useGameStore((state) => state.inputMode);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isGameWon = useGameStore((state) => state.isGameWon);
  const elapsedSeconds = useGameStore((state) => state.elapsedSeconds);
  const tick = useGameStore((state) => state.tick);
  const isPaused = useGameStore((state) => state.isPaused);
  const pause = useGameStore((state) => state.pause);
  const resume = useGameStore((state) => state.resume);
  const autoFillNotes = useGameStore((state) => state.autoFillNotes);
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const toggleDrawingMode = useGameStore((state) => state.toggleDrawingMode);
  const isFastSolveMode = useGameStore((state) => state.isFastSolveMode);
  const toggleFastSolveMode = useGameStore(
    (state) => state.toggleFastSolveMode
  );
  const requestHint = useGameStore((state) => state.requestHint);
  const undo = useGameStore((state) => state.undo);
  const redo = useGameStore((state) => state.redo);
  const canUndo = useGameStore((state) => state.undoStack.length > 0);
  const canRedo = useGameStore((state) => state.redoStack.length > 0);
  const showTimer = useSettingsStore((state) => state.showTimer);
  const isWriting = useGameStore((state) => state.isWriting);

  const [showLevelSelector, setShowLevelSelector] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const appState = useRef(AppState.currentState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Achievement state
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>(
    []
  );
  const [currentAchievement, setCurrentAchievement] =
    useState<AchievementDef | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isPersonalBest, setIsPersonalBest] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!isPaused && !isGameOver && !isGameWon) {
      timerRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, isGameOver, isGameWon, tick]);

  // Haptic feedback on win/lose
  useEffect(() => {
    if (isGameWon) {
      haptics.win();
    }
  }, [isGameWon]);

  useEffect(() => {
    if (isGameOver) {
      haptics.gameOver();
    }
  }, [isGameOver]);

  // Auto-save on app background or game state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        saveCurrentGame();
        // Auto-pause when going to background
        pause();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Auto-save when grid changes (debounced)
  useEffect(() => {
    const hasEmptyGrid = grid.every((row) =>
      row.every((cell) => !cell.isGiven)
    );
    if (hasEmptyGrid) return;

    const timeout = setTimeout(() => {
      saveCurrentGame();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [grid, mistakes, selectedCell]);

  // Clear saved game on completion and record stats + achievements
  useEffect(() => {
    if (isGameWon || isGameOver) {
      clearSavedGame();

      const gameState = useGameStore.getState();

      // Record game result first
      recordGameResult({
        difficulty,
        won: isGameWon,
        elapsedSeconds,
        mistakes,
        moveHistory: gameState.moveHistory,
      }).then(async () => {
        // Then check achievements with updated stats
        const updatedStats = await loadStatsAsync();
        setCurrentStreak(updatedStats.currentWinStreak);

        // Check personal best
        if (isGameWon) {
          const ds = updatedStats.byDifficulty[difficulty];
          if (ds && ds.bestTime === elapsedSeconds) {
            setIsPersonalBest(true);
          }
        }

        const dailyStreak = await getDailyStreakAsync();
        const unlocked = await checkAndUnlockAchievements({
          won: isGameWon,
          difficulty,
          elapsedSeconds,
          mistakes,
          stats: updatedStats,
          dailyStreak,
        });
        if (unlocked.length > 0) {
          setNewAchievements(unlocked);
          setAchievementQueue(unlocked);
        }
      });
    }
  }, [isGameWon, isGameOver]);

  const saveCurrentGame = () => {
    saveGameState({
      grid,
      difficulty,
      selectedCell,
      inputMode,
      mistakes,
      isGameOver,
      isGameWon,
      elapsedSeconds,
      moveHistory: useGameStore.getState().moveHistory,
      savedAt: Date.now(),
    });
  };

  const handleSelectLevel = (selectedDifficulty: Difficulty) => {
    newGame(selectedDifficulty);
    setShowLevelSelector(false);
  };

  const handleNewGame = () => {
    setShowLevelSelector(true);
  };

  const handleGoHome = () => {
    router.replace('/');
  };

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Remaining lives display
  const remainingLives = maxMistakes - mistakes;
  const hearts = Array.from({ length: maxMistakes }, (_, i) => {
    if (i < remainingLives) return '♥';
    return '✕';
  });

  // Process achievement queue — show one banner at a time
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementQueue[0]);
      setAchievementQueue((prev) => prev.slice(1));
    }
  }, [achievementQueue, currentAchievement]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Achievement Banner */}
      <AchievementBanner
        achievement={currentAchievement}
        onDismiss={() => setCurrentAchievement(null)}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        // On Web, touch-action: none handles this better without DOM thrashing
        scrollEnabled={Platform.OS === 'web' ? true : !isWriting}
      >
        <CompletionTimer />
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: theme.headerBg },
            ]}
          >
            <Text style={[styles.difficultyLabel, { color: theme.textMuted }]}>
              LEVEL
            </Text>
            <Text style={[styles.difficultyValue, { color: theme.headerText }]}>
              {DIFFICULTY_LABELS[difficulty] || difficulty}
            </Text>
          </View>
          <Pressable onPress={() => pause()} style={styles.headerCenter}>
            {showTimer && (
              <View style={styles.timerStrip}>
                <Text style={styles.timerText}>
                  ⏱️ {formatTime(elapsedSeconds)}
                </Text>
              </View>
            )}
            {!showTimer && (
              <View
                style={[
                  styles.timerStrip,
                  { opacity: 0.5, borderBottomWidth: 1 },
                ]}
              >
                <Text style={[styles.timerText, { fontSize: 12 }]}>PAUSE</Text>
              </View>
            )}
          </Pressable>
          <Text style={styles.livesText}>
            {hearts.map((h, i) => (
              <Text
                key={i}
                style={
                  i < remainingLives ? styles.heartFilled : styles.heartLost
                }
              >
                {h}{' '}
              </Text>
            ))}
          </Text>
        </View>

        {/* Input Mode Switcher */}
        <InputModeSwitcher />

        {/* Grid */}
        <View style={styles.gridWrapper}>
          <Animated.View
            entering={FadeInDown.delay(300).springify().damping(12)}
            style={[
              styles.gridBorder,
              {
                backgroundColor: theme.cellBg,
                borderColor: theme.gridLineMajor,
              },
            ]}
          >
            {grid.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.gridRow}>
                {row.map((cell, colIndex) => (
                  <Cell
                    key={`${rowIndex}-${colIndex}`}
                    row={rowIndex}
                    col={colIndex}
                    cell={cell}
                  />
                ))}
              </View>
            ))}
            {/* Drawing overlay - positioned on top of grid */}
            {isDrawingMode && (
              <BoardDrawingOverlay
                gridSize={38 * 9} // 38 is cell size
              />
            )}
          </Animated.View>
        </View>

        {/* Selected cell info */}
        <View style={styles.selectionInfo}>
          {selectedCell ? (
            <Text style={styles.selectionText}>
              Selected: Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
            </Text>
          ) : (
            <Text style={styles.selectionText}>Tap a cell to select</Text>
          )}
        </View>

        {/* Keypad */}
        <Keypad />

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[
              styles.actionButton,
              !canUndo && styles.actionButtonDisabled,
            ]}
            onPress={undo}
            disabled={!canUndo}
          >
            <Text
              style={[styles.actionText, !canUndo && styles.actionTextDisabled]}
            >
              ↩️ Undo
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              !canRedo && styles.actionButtonDisabled,
            ]}
            onPress={redo}
            disabled={!canRedo}
          >
            <Text
              style={[styles.actionText, !canRedo && styles.actionTextDisabled]}
            >
              ↪️ Redo
            </Text>
          </Pressable>
          <Eraser />

          <Pressable
            style={[
              styles.actionButton,
              isFastSolveMode && styles.actionButtonActive,
            ]}
            onPress={() => toggleFastSolveMode()}
          >
            <Text
              style={[
                styles.actionText,
                isFastSolveMode && styles.actionTextActive,
              ]}
            >
              ⚡ {isFastSolveMode ? 'Fast ON' : 'Fast Solve'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              isDrawingMode && styles.actionButtonActive,
            ]}
            onPress={() => toggleDrawingMode()}
          >
            <Text
              style={[
                styles.actionText,
                isDrawingMode && styles.actionTextActive,
              ]}
            >
              ✏️ {isDrawingMode ? 'Draw ON' : 'Draw'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => autoFillNotes()}
          >
            <Text style={styles.actionText}>📝 Notes</Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => setShowLevelSelector(true)}
          >
            <Text style={styles.actionText}>🔄 New</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => requestHint()}>
            <Text style={styles.actionText}>🔍 Hint</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Hint Overlay */}
      <HintOverlay />

      {/* Level Selector Drawer */}
      <LevelSelector
        visible={showLevelSelector}
        onClose={() => setShowLevelSelector(false)}
        onSelectLevel={handleSelectLevel}
      />

      {/* Win Modal */}
      <WinModal
        visible={isGameWon && !showStats && !showLevelSelector}
        elapsedSeconds={elapsedSeconds}
        difficulty={difficulty}
        mistakes={mistakes}
        currentStreak={currentStreak}
        isPersonalBest={isPersonalBest}
        newAchievements={newAchievements}
        onNewGame={handleNewGame}
        onGoHome={handleGoHome}
        onShowStats={() => setShowStats(true)}
      />

      {/* Lose Modal */}
      <LoseModal
        visible={isGameOver && !isGameWon && !showStats && !showLevelSelector}
        onNewGame={handleNewGame}
        onGoHome={handleGoHome}
        onShowStats={() => setShowStats(true)}
      />

      {/* Move History Review */}
      <MoveHistoryReview
        visible={showStats}
        onClose={() => setShowStats(false)}
      />

      {/* Pause Overlay */}
      <PauseOverlay
        visible={isPaused && !isGameOver && !isGameWon}
        onResume={resume}
        onQuit={() => {
          resume(); // Unpause state cleanup
          handleGoHome();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    paddingTop: 8,
  },
  difficultyBadge: {
    backgroundColor: '#2A2118',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyLabel: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 8,
    color: '#D4C5A8',
    marginBottom: -2,
  },
  difficultyValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 14,
    color: '#F5EDE0',
    letterSpacing: 0.5,
  },
  headerCenter: {
    alignItems: 'center',
  },
  livesText: {
    fontSize: 20,
  },
  heartFilled: {
    color: '#A02020',
    fontSize: 20,
  },
  heartLost: {
    color: '#2A2118',
    fontSize: 18,
    opacity: 0.4,
  },
  timerStrip: {
    backgroundColor: '#EDE3D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D4C5A8',
    borderBottomWidth: 2,
  },
  timerText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 15,
    color: '#2A2118',
    fontVariant: ['tabular-nums'],
  },

  // --- Grid ---
  gridWrapper: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridBorder: {
    position: 'relative',
    borderWidth: 3,
    borderColor: '#2A2118',
    backgroundColor: '#F5EDE0',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  gridRow: {
    flexDirection: 'row',
  },

  // --- Selection Info ---
  selectionInfo: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectionText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
    color: '#8B7355',
  },

  // --- Actions ---
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FDF8F0',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2A2118',
    borderBottomWidth: 3,
    borderBottomColor: '#1A1410',
    shadowColor: '#2A2118',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  actionButtonActive: {
    backgroundColor: '#A02020',
    borderColor: '#7A1515',
    borderBottomColor: '#5A1010',
  },
  actionText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 11,
    color: '#2A2118',
  },
  actionTextActive: {
    color: '#FDF8F0',
  },
  actionButtonDisabled: {
    opacity: 0.4,
    borderBottomWidth: 2,
    borderColor: '#C4B08A',
    backgroundColor: '#F5EDE0',
  },
  actionTextDisabled: {
    color: '#B0A898',
  },
});
