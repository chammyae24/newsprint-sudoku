import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useGameStore } from '../../store/GameStore';
import { cn } from '../../utils/cn';

/**
 * Eraser tool to clear the selected cell's value and notes.
 */
export function Eraser() {
  const selectedCell = useGameStore((state) => state.selectedCell);
  const grid = useGameStore((state) => state.grid);
  const clearCell = useGameStore((state) => state.clearCell);

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
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-4 py-2.5',
        canErase ? 'bg-red-50' : 'bg-gray-100 opacity-50'
      )}
      onPress={handlePress}
      disabled={!canErase}
    >
      <Text className="text-base">🗑️</Text>
      <Text
        className={cn(
          'text-sm font-medium',
          canErase ? 'text-red-600' : 'text-gray-400'
        )}
      >
        Erase
      </Text>
    </Pressable>
  );
}
