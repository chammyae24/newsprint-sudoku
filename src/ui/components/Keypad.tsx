import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

export function Keypad() {
  const theme = useTheme();
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
        <Text style={[styles.modeText, { color: theme.textMuted }]}>
          {fastSolveDigit
            ? `Fast Solve: Tap cells to place ${fastSolveDigit}`
            : 'Select a number to fast solve'}
        </Text>
      )}
      {isDrawingMode && (
        <Text style={[styles.modeText, { color: theme.textMuted }]}>
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
                {
                  backgroundColor: theme.buttonBg,
                  borderColor: theme.buttonBorder,
                },
                isCompleted && [
                  styles.keyCompleted,
                  {
                    backgroundColor: theme.surfaceAlt,
                    borderColor: theme.borderLight,
                  },
                ],
                isActive && [
                  styles.keyActive,
                  { backgroundColor: theme.buttonActiveBg },
                ],
                pressed && !isCompleted && styles.keyPressed,
              ]}
            >
              <Text
                style={[
                  styles.keyText,
                  { color: theme.buttonText },
                  isCompleted && { color: theme.textMuted },
                  isActive && { color: theme.buttonActiveText },
                ]}
              >
                {digit}
              </Text>
              {!isCompleted && 9 - digitCounts[digit] > 0 && (
                <View
                  style={[
                    styles.badgeContainer,
                    { backgroundColor: theme.bg, borderColor: theme.border },
                    isActive && { borderColor: theme.buttonActiveBg },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: theme.text },
                      isActive && { color: theme.buttonActiveBg },
                    ]}
                  >
                    {9 - digitCounts[digit]}
                  </Text>
                </View>
              )}
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
    borderRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  keyCompleted: {
    opacity: 0.35,
  },
  keyActive: {
    borderWidth: 2,
    borderBottomWidth: 4,
    borderRightWidth: 3,
  },
  keyPressed: {
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
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 9,
    lineHeight: 11,
  },
});
