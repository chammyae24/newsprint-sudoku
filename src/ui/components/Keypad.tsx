import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { cn } from '../../utils/cn';

/**
 * Virtual number keypad (1-9) for cell input.
 * Respects current input mode (solve/note).
 */
export function Keypad() {
  const inputMode = useGameStore((state) => state.inputMode);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const grid = useGameStore((state) => state.grid);
  const setCellValue = useGameStore((state) => state.setCellValue);
  const toggleNote = useGameStore((state) => state.toggleNote);

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
    if (!selectedCell) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (inputMode === 'solve') {
      const isCorrect = setCellValue(digit);
      if (!isCorrect) {
        // Wrong answer - stronger haptic feedback
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      toggleNote(digit);
    }
  };

  const renderNumber = (digit: number) => {
    const isCompleted = digitCounts[digit] >= 9;

    return (
      <Pressable
        key={digit}
        className={cn(
          'h-14 w-14 items-center justify-center rounded-full bg-gray-100',
          isCompleted && 'bg-gray-200 opacity-50'
        )}
        onPress={() => handleNumberPress(digit)}
        disabled={isCompleted}
      >
        <Text
          className={cn(
            'text-2xl font-semibold text-gray-800',
            isCompleted && 'text-gray-400'
          )}
        >
          {digit}
        </Text>
      </Pressable>
    );
  };

  return (
    <View className="gap-2 p-2">
      <View className="flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(renderNumber)}
      </View>
    </View>
  );
}
