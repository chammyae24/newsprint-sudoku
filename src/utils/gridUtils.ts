import type { SudokuCell } from '../core/types';

/**
 * Creates an empty 9x9 Sudoku grid with default cell values.
 */
export const createEmptyGrid = (): SudokuCell[][] =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      value: null,
      notes: [],
      isGiven: false,
      solutionValue: 0,
    }))
  );

/**
 * Deep clones a SudokuGrid for immutable updates.
 */
export const cloneGrid = (grid: SudokuCell[][]): SudokuCell[][] =>
  grid.map((row) => row.map((cell) => ({ ...cell, notes: [...cell.notes] })));

/**
 * Initializes a grid from a puzzle number array.
 * @param puzzle 9x9 array where 0 = empty cell
 * @param solution 9x9 array with correct values
 */
export const initializeGrid = (
  puzzle: number[][],
  solution: number[][]
): SudokuCell[][] => {
  const grid = createEmptyGrid();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const val = puzzle[row][col];
      grid[row][col] = {
        value: val !== 0 ? val : null,
        notes: [],
        isGiven: val !== 0,
        solutionValue: solution[row][col],
      };
    }
  }

  return grid;
};

/**
 * Checks if the grid is completely and correctly filled.
 */
export const checkCompletion = (grid: SudokuCell[][]): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value !== grid[row][col].solutionValue) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Clears a specific digit from notes in all peer cells (row, col, box).
 */
export const clearNotesFromPeers = (
  grid: SudokuCell[][],
  row: number,
  col: number,
  digit: number
): SudokuCell[][] => {
  const newGrid = cloneGrid(grid);

  // Clear from row
  for (let c = 0; c < 9; c++) {
    const idx = newGrid[row][c].notes.indexOf(digit);
    if (idx >= 0) newGrid[row][c].notes.splice(idx, 1);
  }

  // Clear from column
  for (let r = 0; r < 9; r++) {
    const idx = newGrid[r][col].notes.indexOf(digit);
    if (idx >= 0) newGrid[r][col].notes.splice(idx, 1);
  }

  // Clear from 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const idx = newGrid[r][c].notes.indexOf(digit);
      if (idx >= 0) newGrid[r][c].notes.splice(idx, 1);
    }
  }

  return newGrid;
};
