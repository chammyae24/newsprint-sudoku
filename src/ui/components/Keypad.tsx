import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { cn } from '../../utils/cn';

/**
 * Virtual number keypad (1-9) for cell input.
 * Respects current input mode (solve/note).
 * Supports Fast Solve Mode via toggle.
 */
export function Keypad() {
  const inputMode = useGameStore((state) => state.inputMode);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const grid = useGameStore((state) => state.grid);
  const setCellValue = useGameStore((state) => state.setCellValue);
  const toggleNote = useGameStore((state) => state.toggleNote);
  const isFastSolveMode = useGameStore((state) => state.isFastSolveMode);
  const fastSolveDigit = useGameStore((state) => state.fastSolveDigit);
  const setFastSolveDigit = useGameStore((state) => state.setFastSolveDigit);
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const highlightDigit = useGameStore((state) => state.highlightDigit);
  const setHighlightDigit = useGameStore((state) => state.setHighlightDigit);

  // Count how many of each digit are placed (for "completed" indicator)
  const digitCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;

    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value !== null) {
          counts[cell.value]++;
        }
      });
    });

    return counts;
  }, [grid]);

  const handleNumberPress = async (digit: number) => {
    // Fast Solve Mode behavior
    if (isFastSolveMode) {
      // Toggle between digits or toggle off if same digit
      if (fastSolveDigit === digit) {
        setFastSolveDigit(null);
      } else {
        setFastSolveDigit(digit);
      }

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Haptics may fail
      }
      return;
    }

    // Drawing Mode behavior (Highlighting)
    if (isDrawingMode) {
      setHighlightDigit(digit);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      return;
    }

    // Normal behavior: place digit in selected cell
    if (!selectedCell) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      // Haptics may fail
    }

    if (inputMode === 'solve') {
      const isCorrect = setCellValue(digit);
      if (!isCorrect) {
        // Wrong answer - stronger haptic feedback
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        } catch (e) {
          // Haptics may fail
        }
      }
    } else {
      toggleNote(digit);
    }
  };

  const renderNumber = (digit: number) => {
    const isCompleted = digitCounts[digit] >= 9;
    const isActive =
      fastSolveDigit === digit || (isDrawingMode && highlightDigit === digit);

    return (
      <Pressable
        key={digit}
        onPress={() => handleNumberPress(digit)}
        disabled={isCompleted}
      >
        <View
          className={cn(
            'h-14 w-14 items-center justify-center rounded-full bg-gray-100',
            isCompleted && 'bg-gray-200 opacity-50',
            isActive && 'bg-blue-500'
          )}
        >
          <Text
            className={cn(
              'text-2xl font-semibold text-gray-800',
              isCompleted && 'text-gray-400',
              isActive && 'font-bold text-white'
            )}
          >
            {digit}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View className="gap-2 p-2">
      {/* Fast Solve Mode Indicator */}
      {isFastSolveMode && (
        <View className="mb-1 items-center">
          <Text className="text-sm font-medium text-blue-600">
            {fastSolveDigit
              ? `Fast Solve: Tap cells to place ${fastSolveDigit}`
              : 'Select a number to fast solve'}
          </Text>
        </View>
      )}

      {/* Drawing Mode Highlight Indicator */}
      {isDrawingMode && (
        <View className="mb-1 items-center">
          <Text className="text-sm font-medium text-purple-600">
            {highlightDigit
              ? `Highlighting: ${highlightDigit}`
              : 'Tap a number to highlight'}
          </Text>
        </View>
      )}
      <View className="flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(renderNumber)}
      </View>
    </View>
  );
}
