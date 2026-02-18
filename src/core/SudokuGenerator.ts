import { SudokuSolver } from './SudokuSolver';
import { Difficulty, SudokuCell } from './types';
import { isSafeInBox, isSafeInGrid, shuffleArray } from './utils';

export class SudokuGenerator {
  private static readonly GRID_SIZE = 9;
  private static readonly BOX_SIZE = 3;

  /**
   * Generates a deterministic daily puzzle based on date and difficulty.
   */
  public static generateDaily(
    date: Date,
    difficulty: Difficulty
  ): {
    grid: SudokuCell[][];
    solution: number[][];
  } {
    // 1. Create a seed from date + difficulty
    const seed =
      date.getFullYear() * 10000 +
      (date.getMonth() + 1) * 100 +
      date.getDate() +
      this.getDifficultyOffset(difficulty);

    // 2. Initialize seeded PRNG
    const rng = this.createSeededRNG(seed);

    // 3. Generate using seeded RNG
    // NOTE: We need to override Math.random temporarily or pass RNG to helper methods.
    // Since existing methods use Math.random(), we'll wrap them or create seeded variants.
    // For simplicity, we'll implement a seeded shuffle and fill here.

    // Create empty grid
    const solutionGrid = this.createEmptyGrid();

    // Fill Diagonal with seeded RNG
    this.fillDiagonalBoxesSeeded(solutionGrid, rng);

    // Solve the rest (deterministic if solver is deterministic)
    if (!this.solveSeeded(solutionGrid, rng)) {
      // Fallback
      return this.generate(difficulty);
    }

    // Cloning for puzzle grid
    const puzzleGrid: SudokuCell[][] = solutionGrid.map((row) =>
      row.map((val) => ({
        value: val,
        solutionValue: val,
        isGiven: true,
        notes: [],
      }))
    );

    // 4. Remove numbers (dig holes) based on difficulty
    this.removeNumbersSeeded(puzzleGrid, difficulty, rng);

    return {
      grid: puzzleGrid,
      solution: solutionGrid,
    };
  }

  private static getDifficultyOffset(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY:
        return 1;
      case Difficulty.MEDIUM:
        return 2;
      case Difficulty.HARD:
        return 3;
      case Difficulty.EXPERT:
        return 4;
      case Difficulty.MASTER:
        return 5;
      default:
        return 0;
    }
  }

  private static createSeededRNG(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  private static shuffleSeeded<T>(array: T[], rng: () => number): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private static fillDiagonalBoxesSeeded(
    grid: number[][],
    rng: () => number
  ): void {
    for (let i = 0; i < this.GRID_SIZE; i += this.BOX_SIZE) {
      this.fillBoxSeeded(grid, i, i, rng);
    }
  }

  private static fillBoxSeeded(
    grid: number[][],
    rowStart: number,
    colStart: number,
    rng: () => number
  ): void {
    const nums = this.shuffleSeeded([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
    let idx = 0;
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        grid[rowStart + i][colStart + j] = nums[idx++];
      }
    }
  }

  private static solveSeeded(grid: number[][], rng: () => number): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          const nums = this.shuffleSeeded([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);

          for (const num of nums) {
            if (isSafeInGrid(grid, row, col, num)) {
              grid[row][col] = num;

              if (this.solveSeeded(grid, rng)) {
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private static removeNumbersSeeded(
    grid: SudokuCell[][],
    difficulty: Difficulty,
    rng: () => number
  ): void {
    const cellsToRemove = this.getCellsToRemove(difficulty);
    let count = 0;

    const positions: { r: number; c: number }[] = [];
    for (let r = 0; r < this.GRID_SIZE; r++) {
      for (let c = 0; c < this.GRID_SIZE; c++) {
        positions.push({ r, c });
      }
    }
    this.shuffleSeeded(positions, rng);

    for (const pos of positions) {
      if (count >= cellsToRemove) break;

      const { r, c } = pos;

      if (grid[r][c].value !== null) {
        const backupValue = grid[r][c].value;
        grid[r][c].value = null;
        grid[r][c].isGiven = false;

        // Use standard countSolutions (logical safety check is same)
        const solutions = SudokuSolver.countSolutions(grid);

        if (solutions !== 1) {
          grid[r][c].value = backupValue;
          grid[r][c].isGiven = true;
        } else {
          count++;
        }
      }
    }
  }

  /**
   * Generates a new Sudoku puzzle with the specified difficulty.
   */
  public static generate(difficulty: Difficulty): {
    grid: SudokuCell[][];
    solution: number[][];
  } {
    // 5. Validate Difficulty (For Hard/Expert/Master)
    // If it's too easy (solvable by basics), try again.
    // Limit retries to avoid infinite loops on slow devices.
    let attempts = 0;
    while (attempts < 10) {
      // 1. Create an empty grid
      const solutionGrid = this.createEmptyGrid();

      // 2. Fill the diagonal 3x3 boxes (independent, so fast and valid)
      this.fillDiagonalBoxes(solutionGrid);

      // 3. Solve the rest (backtracking) to get a full valid grid
      if (!this.solve(solutionGrid)) {
        throw new Error('Failed to generate a valid Sudoku grid');
      }

      // Clone the solution for the final puzzle state
      const puzzleGrid: SudokuCell[][] = solutionGrid.map((row) =>
        row.map((val) => ({
          value: val,
          solutionValue: val,
          isGiven: true,
          notes: [],
        }))
      );

      // 4. Remove numbers (dig holes) based on difficulty
      this.removeNumbers(puzzleGrid, difficulty);

      // 5. Check logical difficulty
      if (
        difficulty === Difficulty.EXPERT ||
        difficulty === Difficulty.MASTER ||
        difficulty === Difficulty.HARD
      ) {
        // Clone to test solving without mutating result
        const testGrid = puzzleGrid.map((row) =>
          row.map((c) => ({ ...c, notes: [] }))
        );

        const solvableByBasics = SudokuSolver.solveBasics(testGrid);

        if (solvableByBasics) {
          // Too easy for this level!
          attempts++;
          continue; // Try again
        }
      }

      return {
        grid: puzzleGrid,
        solution: solutionGrid,
      };
    }

    // Fallback if we exceeded retries (should be rare)
    // Just return the last one generated
    const solutionGrid = this.createEmptyGrid();
    this.fillDiagonalBoxes(solutionGrid);
    this.solve(solutionGrid);
    const fallbackGrid = solutionGrid.map((row) =>
      row.map((val) => ({
        value: val,
        solutionValue: val,
        isGiven: true,
        notes: [],
      }))
    );
    this.removeNumbers(fallbackGrid, difficulty);
    return { grid: fallbackGrid, solution: solutionGrid };
  }

  private static createEmptyGrid(): number[][] {
    return Array.from({ length: this.GRID_SIZE }, () =>
      Array(this.GRID_SIZE).fill(0)
    );
  }

  private static fillDiagonalBoxes(grid: number[][]): void {
    for (let i = 0; i < this.GRID_SIZE; i += this.BOX_SIZE) {
      this.fillBox(grid, i, i);
    }
  }

  private static fillBox(
    grid: number[][],
    rowStart: number,
    colStart: number
  ): void {
    let num: number;
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        do {
          num = Math.floor(Math.random() * this.GRID_SIZE) + 1;
        } while (!isSafeInBox(grid, rowStart, colStart, num));
        grid[rowStart + i][colStart + j] = num;
      }
    }
  }

  private static solve(grid: number[][]): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        if (grid[row][col] === 0) {
          const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (isSafeInGrid(grid, row, col, num)) {
              grid[row][col] = num;

              if (this.solve(grid)) {
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  private static removeNumbers(
    grid: SudokuCell[][],
    difficulty: Difficulty
  ): void {
    const cellsToRemove = this.getCellsToRemove(difficulty);
    let count = 0;

    const positions: { r: number; c: number }[] = [];
    for (let r = 0; r < this.GRID_SIZE; r++) {
      for (let c = 0; c < this.GRID_SIZE; c++) {
        positions.push({ r, c });
      }
    }
    shuffleArray(positions);

    for (const pos of positions) {
      if (count >= cellsToRemove) break;

      const { r, c } = pos;

      if (grid[r][c].value !== null) {
        const backupValue = grid[r][c].value;
        grid[r][c].value = null;
        grid[r][c].isGiven = false;

        const solutions = SudokuSolver.countSolutions(grid);

        if (solutions !== 1) {
          grid[r][c].value = backupValue;
          grid[r][c].isGiven = true;
        } else {
          count++;
        }
      }
    }
  }

  private static getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY:
        return 30;
      case Difficulty.MEDIUM:
        return 40;
      case Difficulty.HARD:
        return 50;
      case Difficulty.EXPERT:
        return 56;
      case Difficulty.MASTER:
        return 64;
      default:
        return 30;
    }
  }
}
