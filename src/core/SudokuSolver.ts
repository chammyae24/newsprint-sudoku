import {
  findBUGPlus1,
  findLockedCandidates,
  findSkyscraper,
  findSubsets,
  findSwordfish,
  findXWing,
  findXYWing,
  findXYZWing,
} from './techniques';
import { SudokuCell, TechniqueResult, TechniqueType } from './types';
import { isSafeInGrid } from './utils';

export class SudokuSolver {
  /**
   * Solves the given grid logically, filling in values where there is only one possibility.
   * Returns true if fully solved.
   */
  /**
   * Solves the given grid logically, filling in values where there is only one possibility.
   * Returns true if fully solved.
   */
  public static solve(grid: SudokuCell[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;

      const result = this.findNextTechnique(grid);
      if (result) {
        if (result.placement) {
          const { row, col, value } = result.placement;
          if (grid[row][col].value === null) {
            grid[row][col].value = value;
            changed = true;
          }
        } else if (result.eliminations.length > 0) {
          this.applyEliminations(grid, result.eliminations);
          changed = true;
        }
      }
    }
    return this.isSolved(grid);
  }

  public static findNextTechnique(
    grid: SudokuCell[][]
  ): TechniqueResult | null {
    this.updateCandidates(grid);

    const nakedSingle = this.findNakedSingle(grid);
    if (nakedSingle) return nakedSingle;

    const hiddenSingle = this.findHiddenSingle(grid);
    if (hiddenSingle) return hiddenSingle;

    const locked = findLockedCandidates(grid);
    if (locked) return locked;

    const subset = findSubsets(grid);
    if (subset) return subset;

    const xwing = findXWing(grid);
    if (xwing) return xwing;

    const skyscraper = findSkyscraper(grid);
    if (skyscraper) return skyscraper;

    const swordfish = findSwordfish(grid);
    if (swordfish) return swordfish;

    const xyWing = findXYWing(grid);
    if (xyWing) return xyWing;

    const xyzWing = findXYZWing(grid);
    if (xyzWing) return xyzWing;

    const bug = findBUGPlus1(grid);
    if (bug) return bug;

    return null;
  }

  /**
   * Finds all Naked Singles on the grid.
   * Returns an array of placements (row, col, value).
   */
  public static findNakedSingles(
    grid: SudokuCell[][]
  ): { row: number; col: number; value: number }[] {
    this.updateCandidates(grid);
    const results: { row: number; col: number; value: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null && grid[r][c].notes.length === 1) {
          results.push({ row: r, col: c, value: grid[r][c].notes[0] });
        }
      }
    }
    return results;
  }

  /**
   * Finds all Hidden Singles on the grid.
   * Returns an array of placements (row, col, value).
   */
  public static findHiddenSingles(
    grid: SudokuCell[][]
  ): { row: number; col: number; value: number }[] {
    this.updateCandidates(grid);
    const results: { row: number; col: number; value: number }[] = [];
    const seen = new Set<string>();

    // Rows
    for (let r = 0; r < 9; r++) {
      const counts = new Array(10).fill(0);
      const pos = new Array(10).fill(-1);
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes.forEach((n) => {
            counts[n]++;
            pos[n] = c;
          });
        }
      }
      for (let n = 1; n <= 9; n++) {
        if (counts[n] === 1) {
          const key = `${r},${pos[n]}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ row: r, col: pos[n], value: n });
          }
        }
      }
    }

    // Cols
    for (let c = 0; c < 9; c++) {
      const counts = new Array(10).fill(0);
      const pos = new Array(10).fill(-1);
      for (let r = 0; r < 9; r++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes.forEach((n) => {
            counts[n]++;
            pos[n] = r;
          });
        }
      }
      for (let n = 1; n <= 9; n++) {
        if (counts[n] === 1) {
          const key = `${pos[n]},${c}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ row: pos[n], col: c, value: n });
          }
        }
      }
    }

    // Boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const counts = new Array(10).fill(0);
        const posR = new Array(10).fill(-1);
        const posC = new Array(10).fill(-1);
        for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
          for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
            if (grid[r][c].value === null) {
              grid[r][c].notes.forEach((n) => {
                counts[n]++;
                posR[n] = r;
                posC[n] = c;
              });
            }
          }
        }
        for (let n = 1; n <= 9; n++) {
          if (counts[n] === 1) {
            const key = `${posR[n]},${posC[n]}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({ row: posR[n], col: posC[n], value: n });
            }
          }
        }
      }
    }

    return results;
  }

  private static findNakedSingle(grid: SudokuCell[][]): TechniqueResult | null {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null && grid[r][c].notes.length === 1) {
          const val = grid[r][c].notes[0];
          return {
            technique: TechniqueType.NAKED_SINGLE,
            primaryCells: [{ row: r, col: c }],
            eliminations: [],
            placement: { row: r, col: c, value: val },
            explanation: `Naked Single at (${r + 1},${c + 1}). Only one candidate: ${val}.`,
          };
        }
      }
    }
    return null;
  }

  private static findHiddenSingle(
    grid: SudokuCell[][]
  ): TechniqueResult | null {
    // Rows
    for (let r = 0; r < 9; r++) {
      const counts = new Array(10).fill(0);
      const pos = new Array(10).fill(-1);
      for (let c = 0; c < 9; c++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes.forEach((n) => {
            counts[n]++;
            pos[n] = c;
          });
        }
      }
      for (let n = 1; n <= 9; n++) {
        if (counts[n] === 1) {
          return {
            technique: TechniqueType.HIDDEN_SINGLE,
            primaryCells: [{ row: r, col: pos[n] }],
            eliminations: [],
            placement: { row: r, col: pos[n], value: n },
            explanation: `Hidden Single in Row ${r + 1}. Digit ${n} only fits at (${r + 1},${pos[n] + 1}).`,
          };
        }
      }
    }

    // Cols
    for (let c = 0; c < 9; c++) {
      const counts = new Array(10).fill(0);
      const pos = new Array(10).fill(-1);
      for (let r = 0; r < 9; r++) {
        if (grid[r][c].value === null) {
          grid[r][c].notes.forEach((n) => {
            counts[n]++;
            pos[n] = r;
          });
        }
      }
      for (let n = 1; n <= 9; n++) {
        if (counts[n] === 1) {
          return {
            technique: TechniqueType.HIDDEN_SINGLE,
            primaryCells: [{ row: pos[n], col: c }],
            eliminations: [],
            placement: { row: pos[n], col: c, value: n },
            explanation: `Hidden Single in Col ${c + 1}. Digit ${n} only fits at (${pos[n] + 1},${c + 1}).`,
          };
        }
      }
    }

    // Boxes
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
              grid[r][c].notes.forEach((n) => {
                counts[n]++;
                posR[n] = r;
                posC[n] = c;
              });
            }
          }
        }

        for (let n = 1; n <= 9; n++) {
          if (counts[n] === 1) {
            return {
              technique: TechniqueType.HIDDEN_SINGLE,
              primaryCells: [{ row: posR[n], col: posC[n] }],
              eliminations: [],
              placement: { row: posR[n], col: posC[n], value: n },
              explanation: `Hidden Single in Box. Digit ${n} only fits at (${posR[n] + 1},${posC[n] + 1}).`,
            };
          }
        }
      }
    }
    return null;
  }

  private static applyEliminations(
    grid: SudokuCell[][],
    eliminations: { row: number; col: number; value: number }[]
  ) {
    eliminations.forEach((e) => {
      const idx = grid[e.row][e.col].notes.indexOf(e.value);
      if (idx !== -1) {
        grid[e.row][e.col].notes.splice(idx, 1);
      }
    });
  }

  /**
   * Solves the grid using brute-force backtracking.
   */
  public static solveBruteForce(grid: SudokuCell[][]): boolean {
    const simpleGrid = grid.map((row) =>
      row.map((c) => (c.value !== null ? c.value : 0))
    );
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
   * Attempts to solve the grid using ONLY basic techniques (Singles).
   * Returns true if fully solved, false if stuck.
   * used for difficulty grading.
   */
  public static solveBasics(grid: SudokuCell[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;
      this.updateCandidates(grid);

      const singles = this.findNakedSingles(grid);
      if (singles.length > 0) {
        singles.forEach(({ row, col, value }) => {
          if (grid[row][col].value === null) {
            grid[row][col].value = value;
            changed = true;
          }
        });
        if (changed) continue;
      }

      const hiddenSingles = this.findHiddenSingles(grid);
      if (hiddenSingles.length > 0) {
        hiddenSingles.forEach(({ row, col, value }) => {
          if (grid[row][col].value === null) {
            grid[row][col].value = value;
            changed = true;
          }
        });
        if (changed) continue;
      }

      // We explicitly DO NOT run Locked Candidates or Subsets here.
      // If it requires those, it's at least "Medium+" or "Hard".
    }
    return this.isSolved(grid);
  }

  /**
   * Counts the number of solutions for a given grid.
   */
  public static countSolutions(
    grid: SudokuCell[][],
    limit: number = 2
  ): number {
    const simpleGrid = grid.map((row) =>
      row.map((c) => (c.value !== null ? c.value : 0))
    );
    return this.solveBacktrack(simpleGrid, limit, 0);
  }

  private static solveBacktrack(
    grid: number[][],
    limit: number,
    count: number
  ): number {
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

  public static updateCandidates(grid: SudokuCell[][]): void {
    // Cache the simple grid once for performance
    const simpleGrid = grid.map((row) => row.map((cell) => cell.value || 0));

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

  private static isSolved(grid: SudokuCell[][]): boolean {
    return grid.every((row) => row.every((cell) => cell.value !== null));
  }
}
