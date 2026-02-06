import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useGameStore } from '../../store/GameStore';

/**
 * Eraser tool to clear the selected cell's value and notes.
 */
export function Eraser() {
  const selectedCell = useGameStore(state => state.selectedCell);
  const grid = useGameStore(state => state.grid);
  const clearCell = useGameStore(state => state.clearCell);
  
  const canErase = React.useMemo(() => {
    if (!selectedCell) return false;
    const cell = grid[selectedCell.row][selectedCell.col];
    return !cell.isGiven && (cell.value !== null || cell.notes.length > 0);
  }, [selectedCell, grid]);
  
  const handlePress = async () => {
    if (!canErase) return;
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearCell();
  };
  
  return (
    <Pressable
      style={[
        styles.button,
        !canErase && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={!canErase}
    >
      <Text style={styles.icon}>🗑️</Text>
      <Text style={[styles.text, !canErase && styles.disabledText]}>
        Erase
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    gap: 6,
  },
  disabled: {
    backgroundColor: '#f3f4f6',
    opacity: 0.5,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
  disabledText: {
    color: '#9ca3af',
  },
});
