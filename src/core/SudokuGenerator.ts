import { SudokuSolver } from './SudokuSolver';
import { Difficulty, SudokuCell } from './types';
import { isSafeInBox, isSafeInGrid, shuffleArray } from './utils';

export class SudokuGenerator {
  private static readonly GRID_SIZE = 9;
  private static readonly BOX_SIZE = 3;

  /**
   * Generates a new Sudoku puzzle with the specified difficulty.
   */
  public static generate(difficulty: Difficulty): {
    grid: SudokuCell[][];
    solution: number[][];
  } {
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

    return {
      grid: puzzleGrid,
      solution: solutionGrid,
    };
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
