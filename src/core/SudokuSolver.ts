import { SudokuCell } from './types';

export class SudokuSolver {
  
  /**
   * Solves the given grid logically, filling in values where there is only one possibility.
   * Returns true if fully solved.
   */
  public static solve(grid: SudokuCell[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;
      // Simple loop: if we find any technique that places a digit, we restart the loop (propagation)
      // This is a basic Constraint Propagation solver. 
      // For Phase 1, we just need to verify it *can* solve.
      // Full 13-technique implementation comes later or iteratively.
      
      // 1. Update candidates (notes) based on current values
      this.updateCandidates(grid);
      
      // 2. Look for Naked Singles (cells with only 1 candidate)
      const singles = this.findNakedSingles(grid);
      if (singles.length > 0) {
        singles.forEach(({row, col, value}) => {
          if (grid[row][col].value === null) {
              grid[row][col].value = value;
              changed = true;
          }
        });
      }
      
      // If we didn't find singles, try Hidden Singles
      if (!changed) {
          const hiddenSingles = this.findHiddenSingles(grid);
          if (hiddenSingles.length > 0) {
              hiddenSingles.forEach(({row, col, value}) => {
                  if (grid[row][col].value === null) {
                    grid[row][col].value = value;
                    changed = true;
                  }
              });
          }
      }
    }
    
    return this.isSolved(grid);
  }

  /**
   * Solves the grid using brute-force backtracking. 
   * Useful for verifying validity when logical solver fails.
   */
  public static solveBruteForce(grid: SudokuCell[][]): boolean {
      const simpleGrid = grid.map(row => row.map(c => c.value !== null ? c.value : 0));
      if (this.solveBacktrack(simpleGrid, 1, 0) > 0) {
          // Fill back the grid
          for(let r=0; r<9; r++){
              for(let c=0; c<9; c++){
                  grid[r][c].value = simpleGrid[r][c];
              }
          }
          return true;
      }
      return false;
  }

  /**
   * Counts the number of solutions for a given grid. Used for uniqueness checking.
   * Uses backtracking to find all solutions.
   * @param grid 
   * @param limit Stop searching if we find more than this many solutions (optimization)
   */
  public static countSolutions(grid: SudokuCell[][], limit: number = 2): number {
      // Create simple number grid for performance
      const simpleGrid = grid.map(row => row.map(c => c.value !== null ? c.value : 0));
      return this.solveBacktrack(simpleGrid, limit, 0);
  }

  private static solveBacktrack(grid: number[][], limit: number, count: number): number {
    if (count >= limit) return count;

    let row = -1;
    let col = -1;
    let isEmpty = false;
    
    // Find empty cell
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (grid[i][j] === 0) {
                row = i;
                col = j;
                isEmpty = true;
                break;
            }
        }
        if (isEmpty) break;
    }

    // If no empty cell, we found a solution
    if (!isEmpty) {
        return count + 1;
    }

    for (let num = 1; num <= 9; num++) {
        if (this.isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            count = this.solveBacktrack(grid, limit, count);
            if (count >= limit) return count;
            grid[row][col] = 0;
        }
    }
    return count;
  }

  // Helper duplication from Generator (should probably share a util or inherit, but keeping separate for now)
  private static isSafe(grid: number[][], row: number, col: number, num: number): boolean {
    // Row/Col
    for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num || grid[x][col] === num) return false;
    }
    // Box
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (grid[startRow + i][startCol + j] === num) return false;
        }
    }
    return true;
  }

  private static updateCandidates(grid: SudokuCell[][]): void {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null) {
           grid[r][c].notes = [];
           for (let n = 1; n <= 9; n++) {
               if (this.isSafe(grid.map(row => row.map(cell => cell.value || 0)), r, c, n)) {
                   grid[r][c].notes.push(n);
               }
           }
        } else {
            grid[r][c].notes = [];
        }
      }
    }
  }

  private static findNakedSingles(grid: SudokuCell[][]): {row: number, col: number, value: number}[] {
      const results: {row: number, col: number, value: number}[] = [];
      grid.forEach((row, r) => {
          row.forEach((cell, c) => {
              if (cell.value === null && cell.notes.length === 1) {
                  results.push({row: r, col: c, value: cell.notes[0]});
              }
          });
      });
      return results;
  }

  private static findHiddenSingles(grid: SudokuCell[][]): {row: number, col: number, value: number}[] {
      // Check rows, cols, boxes for a candidate that appears only once
      const results: {row: number, col: number, value: number}[] = [];
      
      // Simple implementation for rows only for brevity in this step, need to expand to cols/boxes
      for (let r = 0; r < 9; r++) {
          const counts = new Array(10).fill(0);
          const pos = new Array(10).fill(-1);
          for (let c = 0; c < 9; c++) {
              if (grid[r][c].value === null) {
                  grid[r][c].notes.forEach(n => {
                      counts[n]++;
                      pos[n] = c;
                  });
              }
          }
          for (let n = 1; n <= 9; n++) {
              if (counts[n] === 1) {
                   // Ensure not already added? 
                   results.push({row: r, col: pos[n], value: n});
              }
          }
      }
      return results;
  }

  private static isSolved(grid: SudokuCell[][]): boolean {
      return grid.every(row => row.every(cell => cell.value !== null));
  }
}
