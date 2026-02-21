import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { useTheme } from '../hooks/useTheme';

/**
 * Eraser tool — styled as newspaper eraser icon, themed.
 */
export function Eraser() {
  const theme = useTheme();
  const selectedCell = useGameStore((state) => state.selectedCell);
  const grid = useGameStore((state) => state.grid);
  const clearCell = useGameStore((state) => state.clearCell);
  const pendingDigit = useGameStore((state) => state.pendingDigit);
  const cancelPendingDigit = useGameStore((state) => state.cancelPendingDigit);

  const isPendingSelected =
    selectedCell &&
    pendingDigit &&
    pendingDigit.row === selectedCell.row &&
    pendingDigit.col === selectedCell.col;

  const canErase = React.useMemo(() => {
    if (!selectedCell) return false;
    // Always allow erasing pending digits
    if (isPendingSelected) return true;
    const cell = grid[selectedCell.row][selectedCell.col];
    return (
      !cell.isGiven &&
      ((cell.value !== null && cell.value !== cell.solutionValue) ||
        cell.notes.length > 0)
    );
  }, [selectedCell, grid, isPendingSelected]);

  const handlePress = async () => {
    if (!canErase) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPendingSelected) {
      cancelPendingDigit();
    } else {
      clearCell();
    }
  };

  return (
    <Pressable
      style={[styles.button, !canErase && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={!canErase}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.eraserIcon,
            { backgroundColor: theme.accent + '60' },
            !canErase && { backgroundColor: theme.surfaceAlt },
          ]}
        >
          <Text style={styles.eraserEmoji}>🧽</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    padding: 8,
    minWidth: 64,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  iconContainer: {
    marginBottom: 4,
  },
  eraserIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eraserEmoji: {
    fontSize: 20,
  },
});
