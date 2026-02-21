import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { SudokuCell as SudokuCellType } from '../../core/types';
import { useSettingsStore } from '../../storage/settingsStorage';
import { useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

interface CellProps {
  row: number;
  col: number;
  cell: SudokuCellType;
}

/**
 * Individual Sudoku cell — themed newsprint styled.
 */
export function Cell({ row, col, cell }: CellProps) {
  const theme = useTheme();
  const activeHint = useGameStore((state) => state.activeHint);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const selectCell = useGameStore((state) => state.selectCell);
  const grid = useGameStore((state) => state.grid);
  const fastSolveDigit = useGameStore((state) => state.fastSolveDigit);
  const placeFastSolveDigit = useGameStore(
    (state) => state.placeFastSolveDigit
  );
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const highlightDigit = useGameStore((state) => state.highlightDigit);
  const pendingDigit = useGameStore((state) => state.pendingDigit);
  const highlightPeers = useSettingsStore((state) => state.highlightPeers);
  const inputMode = useGameStore((state) => state.inputMode);
  const toggleNote = useGameStore((state) => state.toggleNote);
  const completedCells = useGameStore((state) => state.completedCells);
  const clearCompletedCells = useGameStore(
    (state) => state.clearCompletedCells
  );

  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox = selectedCell
    ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
    : false;
  const isPeer = isSameRow || isSameCol || isSameBox;

  // Pending digit check
  const isPendingDigit = pendingDigit?.row === row && pendingDigit?.col === col;

  // Hint Logic
  const isHintPrimary = activeHint?.primaryCells.some(
    (c) => c.row === row && c.col === col
  );
  const isHintSecondary = activeHint?.secondaryCells?.some(
    (c) => c.row === row && c.col === col
  );
  const hintPlacement =
    activeHint?.placement?.row === row && activeHint?.placement?.col === col
      ? activeHint?.placement?.value
      : null;
  const hintEliminations = activeHint?.eliminations
    .filter((e) => e.row === row && e.col === col)
    .map((e) => e.value);

  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;
  const highlightValue =
    fastSolveDigit !== null
      ? fastSolveDigit
      : isDrawingMode && highlightDigit !== null
        ? highlightDigit
        : selectedValue;
  const isSameValue = cell.value !== null && cell.value === highlightValue;
  // Pending digits should NOT show error style (they're not validated yet)
  const isError =
    cell.value !== null &&
    !cell.isGiven &&
    !isPendingDigit &&
    cell.value !== cell.solutionValue;
  const isFastSolveTarget =
    fastSolveDigit !== null && cell.value === null && !cell.isGiven;

  // --- Border logic for thick 3x3 box edges ---
  const borderRight = col % 3 === 2 && col !== 8 ? 2.5 : 0.5;
  const borderBottom = row % 3 === 2 && row !== 8 ? 2.5 : 0.5;

  // --- Animations ---
  const scale = useSharedValue(cell.value ? 1 : 0.5);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (cell.value !== null && !cell.isGiven) {
      scale.value = 0.5;
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    }
  }, [cell.value, cell.isGiven]);

  useEffect(() => {
    if (isError) {
      translateX.value = withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isError]);

  const animatedValueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // --- Completion animation (gold flash) ---
  const completionGlow = useSharedValue(0);
  const cellKey = `${row},${col}`;
  const completionDelay = completedCells[cellKey];

  useEffect(() => {
    if (completionDelay !== undefined) {
      completionGlow.value = withDelay(
        completionDelay,
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0.3, { duration: 300 }),
          withTiming(0.6, { duration: 200 }),
          withTiming(0, { duration: 400 })
        )
      );

      // Find the max delay to know when to clear
      const maxDelay = Math.max(...Object.values(completedCells));
      if (completionDelay === maxDelay) {
        // Last cell in animation — clear after it finishes
        const totalDuration = maxDelay + 1100; // sum of animation durations
        const timer = setTimeout(() => clearCompletedCells(), totalDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [completionDelay, completedCells]);

  // --- Background color based on state (themed) ---
  let bgColor = theme.cellBg;
  if (isSelected) {
    bgColor = theme.cellSelectedBg;
  } else if (isSameValue) {
    bgColor = theme.cellHighlightBg;
  } else if (isPeer && highlightPeers) {
    bgColor = theme.cellPeerBg;
  }
  if (isFastSolveTarget) {
    bgColor = theme.cellPeerBg;
  }
  // Hint overrides
  if (isHintPrimary) bgColor = theme.accent + '40';
  if (isHintSecondary) bgColor = theme.accent + '20';
  if (hintPlacement !== null) bgColor = theme.success + '30';

  // Render notes
  const renderNotes = () => {
    if (cell.value !== null) return null;
    if (cell.notes.length === 0 && !hintPlacement) return null;

    return (
      <View style={noteStyles.container}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isEliminated = hintEliminations?.includes(num);
          const isPlacement = hintPlacement === num;
          const isNotePresent = cell.notes.includes(num);

          if (!isNotePresent && !isPlacement) {
            return (
              <Text
                key={num}
                style={[noteStyles.note, { color: 'transparent' }]}
              >
                {num}
              </Text>
            );
          }

          return (
            <Text
              key={num}
              style={[
                noteStyles.note,
                { color: theme.noteText },
                !isEliminated && !isPlacement && { color: theme.noteText },
                isEliminated && {
                  color: theme.error,
                  fontWeight: '700',
                  textDecorationLine: 'line-through',
                },
                isPlacement && {
                  color: theme.success,
                  fontWeight: '700',
                },
              ]}
            >
              {num}
            </Text>
          );
        })}
      </View>
    );
  };

  const clearCell = useGameStore((state) => state.clearCell);
  const selectCellAction = useGameStore((state) => state.selectCell);

  const handlePress = async () => {
    if (fastSolveDigit !== null) {
      if (
        cell.value === fastSolveDigit &&
        !cell.isGiven &&
        cell.value !== cell.solutionValue
      ) {
        selectCellAction(row, col);
        clearCell();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (cell.value === null && !cell.isGiven) {
        selectCellAction(row, col);
        if (inputMode === 'note') {
          toggleNote(fastSolveDigit);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          const isCorrect = placeFastSolveDigit(row, col);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (!isCorrect) {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error
            );
          }
        }
        return;
      }
    }
    selectCellAction(row, col);
  };

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const AnimatedText = Animated.createAnimatedComponent(Text);

  return (
    <AnimatedPressable
      style={[
        cellStyles.cell,
        {
          backgroundColor: bgColor,
          borderRightWidth: borderRight,
          borderBottomWidth: borderBottom,
          borderColor: theme.gridLine,
          borderRightColor:
            borderRight > 1 ? theme.gridLineMajor : theme.gridLine,
          borderBottomColor:
            borderBottom > 1 ? theme.gridLineMajor : theme.gridLine,
        },
        animatedContainerStyle,
      ]}
      onPress={handlePress}
    >
      {/* Completion glow overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.accent,
          },
          useAnimatedStyle(() => ({
            opacity: completionGlow.value * 0.5,
          })),
        ]}
        pointerEvents="none"
      />
      {cell.value !== null ? (
        <AnimatedText
          style={[
            cellStyles.value,
            cell.isGiven && [
              cellStyles.givenValue,
              { color: theme.cellGivenText },
            ],
            !cell.isGiven && [
              cellStyles.userValue,
              { color: theme.cellUserText },
            ],
            isPendingDigit && [
              cellStyles.pendingValue,
              { color: theme.cellUserText },
            ],
            isError && { color: theme.error },
            hintPlacement === cell.value && {
              color: theme.success,
              fontFamily: 'PlayfairDisplay_700Bold',
            },
            !cell.isGiven && animatedValueStyle,
          ]}
        >
          {cell.value}
        </AnimatedText>
      ) : (
        renderNotes()
      )}
    </AnimatedPressable>
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
  },
  value: {
    fontSize: 22,
    lineHeight: 34,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  givenValue: {
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  userValue: {
    fontFamily: 'GloriaHallelujah_400Regular',
    fontSize: 20,
    lineHeight: 30,
  },
  pendingValue: {
    opacity: 0.45,
  },
});

const noteStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 1,
  },
  note: {
    width: '33%',
    textAlign: 'center',
    fontSize: 9,
    lineHeight: 10,
    fontFamily: 'Lora_400Regular',
  },
});
