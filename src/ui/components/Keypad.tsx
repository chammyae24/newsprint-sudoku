import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

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

  const digitCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.value !== null) counts[cell.value]++;
      });
    });
    return counts;
  }, [grid]);

  const handleNumberPress = async (digit: number) => {
    if (isFastSolveMode) {
      if (fastSolveDigit === digit) {
        setFastSolveDigit(null);
      } else {
        setFastSolveDigit(digit);
      }
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
      return;
    }

    if (isDrawingMode) {
      setHighlightDigit(digit);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
      return;
    }

    if (!selectedCell) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}

    if (inputMode === 'solve') {
      const isCorrect = setCellValue(digit);
      if (!isCorrect) {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        } catch (e) {}
      }
    } else {
      toggleNote(digit);
    }
  };

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <View style={styles.container}>
      {isFastSolveMode && (
        <Text style={styles.modeText}>
          {fastSolveDigit
            ? `Fast Solve: Tap cells to place ${fastSolveDigit}`
            : 'Select a number to fast solve'}
        </Text>
      )}
      {isDrawingMode && (
        <Text style={styles.modeText}>
          {highlightDigit
            ? `Highlighting: ${highlightDigit}`
            : 'Tap a number to highlight'}
        </Text>
      )}

      <View style={styles.row}>
        {digits.map((digit) => {
          const isCompleted = digitCounts[digit] >= 9;
          const isActive =
            fastSolveDigit === digit ||
            (isDrawingMode && highlightDigit === digit);

          return (
            <Pressable
              key={digit}
              onPress={() => handleNumberPress(digit)}
              disabled={isCompleted}
              style={({ pressed }) => [
                styles.key,
                isCompleted && styles.keyCompleted,
                isActive && styles.keyActive,
                pressed && !isCompleted && styles.keyPressed,
              ]}
            >
              <Text
                style={[
                  styles.keyText,
                  isCompleted && styles.keyTextCompleted,
                  isActive && styles.keyTextActive,
                ]}
              >
                {digit}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  modeText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 4,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    width: 38,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#422800ff',
    borderRadius: 8,
    // Thick dark border for clear button appearance
    borderWidth: 2,
    borderColor: '#2A2118',
    borderBottomWidth: 4,
    borderBottomColor: '#1A1410',
    borderRightWidth: 3,
    borderRightColor: '#2A2118',
    shadowColor: '#2A2118',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  keyCompleted: {
    opacity: 0.35,
    backgroundColor: '#EDE3D0',
    borderColor: '#B09A6E',
    borderBottomColor: '#B09A6E',
    borderRightColor: '#B09A6E',
  },
  keyActive: {
    backgroundColor: '#A02020',
    borderColor: '#7A1515',
    borderBottomColor: '#5A1010',
    borderRightColor: '#7A1515',
  },
  keyPressed: {
    backgroundColor: '#3d2800ff',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    marginTop: 2,
    marginLeft: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
  },
  keyText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    color: '#F5EDE0',
  },
  keyTextCompleted: {
    color: '#B09A6E',
  },
  keyTextActive: {
    color: '#FDF8F0',
  },
});
