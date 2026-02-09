/**
 * Shared utility functions for Sudoku logic
 */

/**
 * Fisher-Yates shuffle algorithm. Mutates the array in place.
 */
export function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Checks if placing `num` at (row, col) is valid in a simple number grid.
 */
export function isSafeInGrid(
  grid: number[][],
  row: number,
  col: number,
  num: number
): boolean {
  // Check row and column
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num || grid[x][col] === num) {
      return false;
    }
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[startRow + i][startCol + j] === num) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Helper to check if num is safe within a specific 3x3 box only.
 */
export function isSafeInBox(
  grid: number[][],
  rowStart: number,
  colStart: number,
  num: number
): boolean {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[rowStart + i][colStart + j] === num) {
        return false;
      }
    }
  }
  return true;
}
