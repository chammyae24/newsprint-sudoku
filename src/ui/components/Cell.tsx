import * as Haptics from 'expo-haptics';
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
 * Supports selection, highlighting, notes display, and Fast Solve Mode.
 */
export function Cell({ row, col, cell }: CellProps) {
  const activeHint = useGameStore((state) => state.activeHint);
  const selectedCell = useGameStore((state) => state.selectedCell);
  const selectCell = useGameStore((state) => state.selectCell);
  const grid = useGameStore((state) => state.grid);
  const fastSolveDigit = useGameStore((state) => state.fastSolveDigit);
  const placeFastSolveDigit = useGameStore(
    (state) => state.placeFastSolveDigit
  );
  const isDrawingMode = useGameStore((state) => state.isDrawingMode);
  const highlightDigit = useGameStore((state) => state.highlightDigit);

  const isSelected = selectedCell?.row === row && selectedCell?.col === col;
  const isSameRow = selectedCell?.row === row;
  const isSameCol = selectedCell?.col === col;
  const isSameBox = selectedCell
    ? Math.floor(selectedCell.row / 3) === Math.floor(row / 3) &&
      Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
    : false;
  const isPeer = isSameRow || isSameCol || isSameBox;

  // Hint Logic
  const isHintPrimary = activeHint?.primaryCells.some(
    (c) => c.row === row && c.col === col
  );
  const isHintSecondary = activeHint?.secondaryCells?.some(
    (c) => c.row === row && c.col === col
  );

  // Placement/Elimination Visualization
  const hintPlacement =
    activeHint?.placement?.row === row && activeHint?.placement?.col === col
      ? activeHint?.placement?.value
      : null;

  const hintEliminations = activeHint?.eliminations
    .filter((e) => e.row === row && e.col === col)
    .map((e) => e.value);

  // Check if this cell has the same value as selected cell OR fast solve digit
  const selectedValue = selectedCell
    ? grid[selectedCell.row][selectedCell.col].value
    : null;
  const highlightValue =
    fastSolveDigit !== null
      ? fastSolveDigit
      : isDrawingMode && highlightDigit !== null
        ? highlightDigit
        : selectedValue;
  const isSameValue = cell.value !== null && cell.value === highlightValue;

  // Check if this value is incorrect (value doesn't match solution)
  const isError =
    cell.value !== null && !cell.isGiven && cell.value !== cell.solutionValue;

  // Check if cell is a valid target for fast solve (empty and not given)
  const isFastSolveTarget =
    fastSolveDigit !== null && cell.value === null && !cell.isGiven;

  // Render notes in 3x3 mini-grid
  const renderNotes = () => {
    // Specific logic for Single placement hint: Show the value being placed if it's a placement hint?
    // Or just highlight the cell?
    // If placement, we might want to emphasize that note.

    if (cell.value !== null) return null;
    if (cell.notes.length === 0 && !hintPlacement) return null;

    return (
      <View className="flex-1 flex-row flex-wrap items-center justify-center p-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isEliminated = hintEliminations?.includes(num);
          const isPlacement = hintPlacement === num;
          const isNotePresent = cell.notes.includes(num);

          if (!isNotePresent && !isPlacement)
            return (
              <Text
                key={num}
                className="w-1/3 text-center text-[9px] leading-[10px] text-transparent"
              >
                {num}
              </Text>
            );

          return (
            <Text
              key={num}
              className={cn(
                'w-1/3 text-center text-[9px] leading-[10px]',
                // Normal note
                !isEliminated && !isPlacement && 'text-gray-500',
                // To be eliminated
                isEliminated && 'font-bold text-red-500 line-through',
                // To be placed (if showing as note)
                isPlacement && 'scale-125 font-bold text-green-600'
              )}
            >
              {num}
            </Text>
          );
        })}
      </View>
    );
  };

  const clearCell = useGameStore((state) => state.clearCell);
  const selectCellAction = useGameStore((state) => state.selectCell);

  const handlePress = async () => {
    // Fast Solve Mode
    if (fastSolveDigit !== null) {
      // If tapping a cell that already has the fast solve digit (and isn't given), erase it
      if (
        cell.value === fastSolveDigit &&
        !cell.isGiven &&
        cell.value !== cell.solutionValue
      ) {
        // We need to select the cell first to clear it using the existing action
        selectCellAction(row, col);
        clearCell();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }

      // If tapping an empty cell, place the digit
      if (cell.value === null && !cell.isGiven) {
        const isCorrect = placeFastSolveDigit(row, col);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!isCorrect) {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
        }
        return;
      }

      // If tapping anything else, just select it (or ignore? User said "show highlight... in fast solve mode")
      // Let's allow selection still, so they can see peers etc.
    }

    // Normal behavior: select the cell
    selectCellAction(row, col);
  };

  return (
    <Pressable
      className={cn(
        'h-[38px] w-[38px] items-center justify-center border-[0.5px] border-gray-300 bg-white',
        // Selection State
        isSelected && 'bg-blue-200',
        !isSelected && isSameValue && 'bg-green-200',
        !isSelected && !isSameValue && isPeer && 'bg-blue-100',

        // Fast solve target highlight
        isFastSolveTarget && 'bg-blue-50/70',

        // Hint Highlights (Override others)
        isHintPrimary && 'bg-amber-200', // Primary cells (e.g. pivot)
        isHintSecondary && 'bg-amber-100', // Secondary cells (e.g. pincers)
        hintPlacement !== null && 'bg-green-200', // Placement target

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
            isError && 'text-red-600',
            // Highlight value if part of hint placement (though usually it's empty if placement)
            hintPlacement === cell.value && 'font-bold text-green-700'
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
