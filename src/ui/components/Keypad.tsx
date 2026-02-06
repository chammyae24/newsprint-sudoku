import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Virtual number keypad (1-9) for cell input.
 * Respects current input mode (solve/note).
 */
export function Keypad() {
  const inputMode = useGameStore(state => state.inputMode);
  const selectedCell = useGameStore(state => state.selectedCell);
  const grid = useGameStore(state => state.grid);
  const setCellValue = useGameStore(state => state.setCellValue);
  const toggleNote = useGameStore(state => state.toggleNote);
  
  // Count how many of each digit are placed (for "completed" indicator)
  const digitCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;
    
    grid.forEach(row => {
      row.forEach(cell => {
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
        style={[
          styles.numberButton,
          isCompleted && styles.completedButton,
        ]}
        onPress={() => handleNumberPress(digit)}
        disabled={isCompleted}
      >
        <Text style={[
          styles.numberText,
          isCompleted && styles.completedText,
        ]}>
          {digit}
        </Text>
      </Pressable>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {[1, 2, 3,4,5,6,7,8,9].map(renderNumber)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  numberButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.5,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
  },
  completedText: {
    color: '#9ca3af',
  },
});
