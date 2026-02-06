import { SudokuCell } from './types';
import { isSafeInGrid } from './utils';

export class SudokuSolver {
  
  /**
   * Solves the given grid logically, filling in values where there is only one possibility.
   * Returns true if fully solved.
   */
  public static solve(grid: SudokuCell[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;
      
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
      
      // 3. If no Naked Singles, try Hidden Singles
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
   */
  public static solveBruteForce(grid: SudokuCell[][]): boolean {
    const simpleGrid = grid.map(row => row.map(c => c.value !== null ? c.value : 0));
    if (this.solveBacktrack(simpleGrid, 1, 0) > 0) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          grid[r][c].value = simpleGrid[r][c];
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Counts the number of solutions for a given grid.
   */
  public static countSolutions(grid: SudokuCell[][], limit: number = 2): number {
    const simpleGrid = grid.map(row => row.map(c => c.value !== null ? c.value : 0));
    return this.solveBacktrack(simpleGrid, limit, 0);
  }

  private static solveBacktrack(grid: number[][], limit: number, count: number): number {
    if (count >= limit) return count;

    let row = -1;
    let col = -1;
    let isEmpty = false;
    
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

    if (!isEmpty) {
      return count + 1;
    }

    for (let num = 1; num <= 9; num++) {
      if (isSafeInGrid(grid, row, col, num)) {
        grid[row][col] = num;
        count = this.solveBacktrack(grid, limit, count);
        if (count >= limit) return count;
        grid[row][col] = 0;
      }
    }
    return count;
  }

  private static updateCandidates(grid: SudokuCell[][]): void {
    // Cache the simple grid once for performance
    const simpleGrid = grid.map(row => row.map(cell => cell.value || 0));
    
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes = [];
          for (let n = 1; n <= 9; n++) {
            if (isSafeInGrid(simpleGrid, r, c, n)) {
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
    const results: {row: number, col: number, value: number}[] = [];
    const seen = new Set<string>();
    
    const addResult = (r: number, c: number, v: number) => {
      const key = `${r},${c},${v}`;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({row: r, col: c, value: v});
      }
    };
    
    // Check rows
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
          addResult(r, pos[n], n);
        }
      }
    }
    
    // Check columns
    for (let c = 0; c < 9; c++) {
      const counts = new Array(10).fill(0);
      const pos = new Array(10).fill(-1);
      for (let r = 0; r < 9; r++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes.forEach(n => {
            counts[n]++;
            pos[n] = r;
          });
        }
      }
      for (let n = 1; n <= 9; n++) {
        if (counts[n] === 1) {
          addResult(pos[n], c, n);
        }
      }
    }
    
    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 9; boxRow += 3) {
      for (let boxCol = 0; boxCol < 9; boxCol += 3) {
        const counts = new Array(10).fill(0);
        const posR = new Array(10).fill(-1);
        const posC = new Array(10).fill(-1);
        
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const r = boxRow + i;
            const c = boxCol + j;
            if (grid[r][c].value === null) {
              grid[r][c].notes.forEach(n => {
                counts[n]++;
                posR[n] = r;
                posC[n] = c;
              });
            }
          }
        }
        
        for (let n = 1; n <= 9; n++) {
          if (counts[n] === 1) {
            addResult(posR[n], posC[n], n);
          }
        }
      }
    }
    
    return results;
  }

  private static isSolved(grid: SudokuCell[][]): boolean {
    return grid.every(row => row.every(cell => cell.value !== null));
  }
}
