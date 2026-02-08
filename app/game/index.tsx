import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Difficulty } from '../../src/core/types';
import { clearSavedGame, saveGameState } from '../../src/storage/gameStorage';
import { useGameStore } from '../../src/store/GameStore';
import { BoardDrawingOverlay } from '../../src/ui/components/BoardDrawingOverlay';
import { Cell } from '../../src/ui/components/Cell';
import { Eraser } from '../../src/ui/components/Eraser';
import { HintOverlay } from '../../src/ui/components/HintOverlay';
import { InputModeSwitcher } from '../../src/ui/components/InputModeSwitcher';
import { Keypad } from '../../src/ui/components/Keypad';
import { LevelSelector } from '../../src/ui/components/LevelSelector';
import { LoseModal } from '../../src/ui/components/LoseModal';
import { MoveHistoryReview } from '../../src/ui/components/MoveHistoryReview';
import { WinModal } from '../../src/ui/components/WinModal';
import { haptics } from '../../src/utils/haptics';

export default function GameScreen() {
  const router = useRouter();
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
  const autoFillNotes = useGameStore((state) => state.autoFillNotes);
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const toggleDrawingMode = useGameStore((state) => state.toggleDrawingMode);
  const isFastSolveMode = useGameStore((state) => state.isFastSolveMode);
  const toggleFastSolveMode = useGameStore(
    (state) => state.toggleFastSolveMode
  );
  const requestHint = useGameStore((state) => state.requestHint);

  const [showLevelSelector, setShowLevelSelector] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const appState = useRef(AppState.currentState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        // Save game when going to background
        saveCurrentGame();
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
    if (hasEmptyGrid) return; // Don't save empty game

    const timeout = setTimeout(() => {
      saveCurrentGame();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [grid, mistakes, selectedCell]);

  // Clear saved game on completion
  useEffect(() => {
    if (isGameWon || isGameOver) {
      clearSavedGame();
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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 pb-2 pt-4">
        <Text className="text-center text-2xl font-bold text-gray-800">
          Newsprint Sudoku
        </Text>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-sm text-gray-500">
            ❤️ {maxMistakes - mistakes}/{maxMistakes}
          </Text>
          <Text className="text-sm font-medium text-gray-600">
            ⏱️ {formatTime(elapsedSeconds)}
          </Text>
          <Text className="text-sm text-gray-500">
            {inputMode === 'solve' ? '✏️ Solve' : '📝 Notes'}
          </Text>
        </View>
      </View>

      {/* Grid */}
      <View className="items-center py-4">
        <View className="relative border-2 border-gray-700 bg-white">
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row">
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
        </View>
      </View>

      {/* Selected cell info */}
      <View className="items-center py-2">
        {selectedCell ? (
          <Text className="text-sm text-gray-500">
            Selected: Row {selectedCell.row + 1}, Col {selectedCell.col + 1}
          </Text>
        ) : (
          <Text className="text-sm text-gray-500">Tap a cell to select</Text>
        )}
      </View>

      {/* Input Mode Switcher */}
      <InputModeSwitcher />

      {/* Keypad */}
      <Keypad />

      {/* Actions */}
      <View className="flex-row flex-wrap items-center justify-center gap-3 py-3">
        <Eraser />
        <Pressable
          className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${
            isFastSolveMode ? 'bg-blue-500' : 'bg-blue-100'
          }`}
          onPress={() => toggleFastSolveMode()}
        >
          <Text
            className={`text-sm font-medium ${
              isFastSolveMode ? 'text-white' : 'text-blue-700'
            }`}
          >
            ⚡ {isFastSolveMode ? 'Fast Solve ON' : 'Fast Solve'}
          </Text>
        </Pressable>
        <Pressable
          className={`flex-row items-center gap-1.5 rounded-full px-4 py-2.5 ${
            isDrawingMode ? 'bg-purple-500' : 'bg-purple-100'
          }`}
          onPress={() => toggleDrawingMode()}
        >
          <Text
            className={`text-sm font-medium ${
              isDrawingMode ? 'text-white' : 'text-purple-700'
            }`}
          >
            ✏️ {isDrawingMode ? 'Drawing ON' : 'Draw'}
          </Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5 rounded-full bg-green-100 px-4 py-2.5"
          onPress={() => autoFillNotes()}
        >
          <Text className="text-sm font-medium text-green-700">
            📝 Auto Notes
          </Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5 rounded-full bg-blue-100 px-4 py-2.5"
          onPress={() => setShowLevelSelector(true)}
        >
          <Text className="text-sm font-medium text-blue-700">🔄 New Game</Text>
        </Pressable>
        <Pressable
          className="flex-row items-center gap-1.5 rounded-full bg-yellow-100 px-4 py-2.5"
          onPress={() => requestHint()}
        >
          <Text className="text-sm font-medium text-yellow-700">💡 Hint</Text>
        </Pressable>
      </View>

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
        visible={isGameWon && !showStats}
        elapsedSeconds={elapsedSeconds}
        onNewGame={handleNewGame}
        onGoHome={handleGoHome}
        onShowStats={() => setShowStats(true)}
      />

      {/* Lose Modal */}
      <LoseModal
        visible={isGameOver && !isGameWon && !showStats}
        onNewGame={handleNewGame}
        onGoHome={handleGoHome}
        onShowStats={() => setShowStats(true)}
      />

      {/* Move History Review */}
      <MoveHistoryReview
        visible={showStats}
        onClose={() => setShowStats(false)}
      />
    </SafeAreaView>
  );
}
