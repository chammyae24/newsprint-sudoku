import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Eraser tool — styled as newspaper eraser icon.
 */
export function Eraser() {
  const selectedCell = useGameStore((state) => state.selectedCell);
  const grid = useGameStore((state) => state.grid);
  const clearCell = useGameStore((state) => state.clearCell);

  const canErase = React.useMemo(() => {
    if (!selectedCell) return false;
    const cell = grid[selectedCell.row][selectedCell.col];
    return (
      !cell.isGiven &&
      ((cell.value !== null && cell.value !== cell.solutionValue) ||
        cell.notes.length > 0)
    );
  }, [selectedCell, grid]);

  const handlePress = async () => {
    if (!canErase) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearCell();
  };

  return (
    <Pressable
      style={[styles.button, !canErase && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={!canErase}
    >
      <View style={styles.iconContainer}>
        <View
          style={[styles.eraserIcon, !canErase && styles.eraserIconDisabled]}
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
    backgroundColor: '#E8C0A0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eraserIconDisabled: {
    backgroundColor: '#E0D5BF',
  },
  eraserEmoji: {
    fontSize: 20,
  },
  label: {
    fontFamily: 'SpecialElite_400Regular',
    fontSize: 10,
    color: '#2A2118',
    textAlign: 'center',
  },
  labelDisabled: {
    color: '#A89070',
  },
});
