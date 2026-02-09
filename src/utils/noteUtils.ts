import type { SudokuCell } from '../core/types';
import { cloneGrid } from './gridUtils';

/**
 * Checks if a digit can legally be placed at (row, col) based on current grid values.
 * Only considers filled cells, not solution values.
 */
export const isValidPlacement = (
  grid: SudokuCell[][],
  row: number,
  col: number,
  digit: number
): boolean => {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (grid[row][c].value === digit) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (grid[r][col].value === digit) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (grid[r][c].value === digit) return false;
    }
  }

  return true;
};

/**
 * Gets all valid candidate digits for a specific cell.
 */
export const getValidCandidates = (
  grid: SudokuCell[][],
  row: number,
  col: number
): number[] => {
  const candidates: number[] = [];
  for (let d = 1; d <= 9; d++) {
    if (isValidPlacement(grid, row, col, d)) {
      candidates.push(d);
    }
  }
  return candidates;
};

/**
 * Auto-generates notes for all empty cells based on current grid state.
 * Only sets notes for cells without a value.
 */
export const autoGenerateNotes = (grid: SudokuCell[][]): SudokuCell[][] => {
  const newGrid = cloneGrid(grid);

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = newGrid[row][col];
      if (cell.value === null && !cell.isGiven) {
        cell.notes = getValidCandidates(newGrid, row, col);
      }
    }
  }

  return newGrid;
};
