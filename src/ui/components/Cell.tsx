import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { SudokuCell as SudokuCellType } from '../../core/types';
import { useGameStore } from '../../store/GameStore';
import { cn } from '../../utils/cn';

interface CellProps {
  row: number;
  col: number;
  cell: SudokuCellType;
}

/**
 * Individual Sudoku cell component.
 * Supports selection, highlighting, and notes display.
 */
export function Cell({ row, col, cell }: CellProps) {
  const selectedCell = useGameStore((state) => state.selectedCell);
  const selectCell = useGameStore((state) => state.selectCell);
  const grid = useGameStore((state) => state.grid);

  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox = selectedCell
    ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
    : false;
  const isPeer = isSameRow || isSameCol || isSameBox;

  // Check if this cell has the same value as selected cell
  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;
  const isSameValue = cell.value !== null && cell.value === selectedValue;

  // Check if this value is incorrect (value doesn't match solution)
  const isError =
    cell.value !== null && !cell.isGiven && cell.value !== cell.solutionValue;

  // Render notes in 3x3 mini-grid
  const renderNotes = () => {
    if (cell.value !== null || cell.notes.length === 0) return null;

    return (
      <View className="flex-1 flex-row flex-wrap items-center justify-center p-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Text
            key={num}
            className={cn(
              'w-1/3 text-center text-[9px] leading-[10px] text-gray-500',
              !cell.notes.includes(num) && 'opacity-0'
            )}
          >
            {num}
          </Text>
        ))}
      </View>
    );
  };

  const handlePress = () => {
    selectCell(row, col);
  };

  return (
    <Pressable
      className={cn(
        'h-[38px] w-[38px] items-center justify-center border-[0.5px] border-gray-300 bg-white',
        isSelected && 'bg-blue-200',
        !isSelected && isSameValue && 'bg-green-100',
        !isSelected && !isSameValue && isPeer && 'bg-blue-50',
        // Box borders
        col % 3 === 2 && col !== 8 && 'border-r-2 border-r-gray-700',
        row % 3 === 2 && row !== 8 && 'border-b-2 border-b-gray-700'
      )}
      onPress={handlePress}
    >
      {cell.value !== null ? (
        <Text
          className={cn(
            'text-2xl font-medium',
            cell.isGiven && 'font-bold text-gray-800',
            !cell.isGiven && 'text-blue-600',
            isError && 'text-red-600'
          )}
        >
          {cell.value}
        </Text>
      ) : (
        renderNotes()
      )}
    </Pressable>
  );
}
