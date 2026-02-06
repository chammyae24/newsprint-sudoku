import { SudokuSolver } from './SudokuSolver';
import { Difficulty, SudokuCell } from './types';

export class SudokuGenerator {
  private static readonly GRID_SIZE = 9;
  private static readonly BOX_SIZE = 3;

  /**
   * Generates a new Sudoku puzzle with the specified difficulty.
   */
  public static generate(difficulty: Difficulty): { grid: SudokuCell[][], solution: number[][] } {
    // 1. Create an empty grid
    const solutionGrid = this.createEmptyGrid();

    // 2. Fill the diagonal 3x3 boxes (independent, so fast and valid)
    this.fillDiagonalBoxes(solutionGrid);

    // 3. Solve the rest (backtracking) to get a full valid grid
    if (!this.solve(solutionGrid)) {
      throw new Error("Failed to generate a valid Sudoku grid");
    }

    // Clone the solution for the final puzzle state
    const puzzleGrid: SudokuCell[][] = solutionGrid.map((row, rIndex) =>
      row.map((val, cIndex) => ({
        row: rIndex,
        col: cIndex,
        value: val, // Initially all filled
        solutionValue: val,
        isGiven: true,
        notes: []
      }))
    );

    // 4. Remove numbers (dig holes) based on difficulty
    this.removeNumbers(puzzleGrid, difficulty);

    return {
      grid: puzzleGrid,
      solution: solutionGrid
    };
  }

  private static createEmptyGrid(): number[][] {
    return Array.from({ length: this.GRID_SIZE }, () => Array(this.GRID_SIZE).fill(0));
  }

  private static fillDiagonalBoxes(grid: number[][]): void {
    for (let i = 0; i < this.GRID_SIZE; i += this.BOX_SIZE) {
      this.fillBox(grid, i, i);
    }
  }

  private static fillBox(grid: number[][], rowStart: number, colStart: number): void {
    let num: number;
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        do {
          num = Math.floor(Math.random() * this.GRID_SIZE) + 1;
        } while (!this.isSafeInBox(grid, rowStart, colStart, num));
        grid[rowStart + i][colStart + j] = num;
      }
    }
  }

  private static isSafeInBox(grid: number[][], rowStart: number, colStart: number, num: number): boolean {
    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        if (grid[rowStart + i][colStart + j] === num) {
          return false;
        }
      }
    }
    return true;
  }

  private static isSafe(grid: number[][], row: number, col: number, num: number): boolean {
    // Check row and column
    for (let x = 0; x < this.GRID_SIZE; x++) {
      if (grid[row][x] === num || grid[x][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const startRow = row - (row % this.BOX_SIZE);
    const startCol = col - (col % this.BOX_SIZE);
    return this.isSafeInBox(grid, startRow, startCol, num);
  }

  private static solve(grid: number[][]): boolean {
    for (let row = 0; row < this.GRID_SIZE; row++) {
      for (let col = 0; col < this.GRID_SIZE; col++) {
        // If cell is empty
        if (grid[row][col] === 0) {
          // Try numbers 1-9
          const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of nums) {
            if (this.isSafe(grid, row, col, num)) {
              grid[row][col] = num;

              if (this.solve(grid)) {
                return true;
              }

              grid[row][col] = 0; // Backtrack
            }
          }
          return false; // No number works here
        }
      }
    }
    return true; // All cells filled
  }

  private static shuffleArray(array: number[]): number[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }



  private static removeNumbers(grid: SudokuCell[][], difficulty: Difficulty): void {
    const cellsToRemove = this.getCellsToRemove(difficulty);
    let count = 0;
    
    // Optimization: Create a list of all positions and shuffle them
    const positions: {r: number, c: number}[] = [];
    for(let r=0; r<this.GRID_SIZE; r++) {
        for(let c=0; c<this.GRID_SIZE; c++) {
            positions.push({r, c});
        }
    }
    this.shuffleArray(positions as any); // Type cast quick fix for my shuffle signature

    for (const pos of positions) {
        if (count >= cellsToRemove) break;
        
        const {r, c} = pos;
        
        if (grid[r][c].value !== null) {
            // Backup
            const backupValue = grid[r][c].value;
            grid[r][c].value = null;
            grid[r][c].isGiven = false;
            
            // CHECK UNIQUENESS
            // faster to check if there are multiple solutions (limit=2)
            const solutions = SudokuSolver.countSolutions(grid);
            
            if (solutions !== 1) { 
                // Not unique! Put it back.
                grid[r][c].value = backupValue; 
                grid[r][c].isGiven = true; 
            } else { 
                count++; 
            }
        }
    }
  }
  
  private static getAttemptsForDifficulty(difficulty: Difficulty): number {
      // Not used yet if we just do straight count
      return 10;
  }

  private static getCellsToRemove(difficulty: Difficulty): number {
    // Total cells = 81
    switch (difficulty) {
      case Difficulty.EASY: return 30; // ~51 clues
      case Difficulty.MEDIUM: return 40; // ~41 clues
      case Difficulty.HARD: return 50; // ~31 clues
      case Difficulty.EXPERT: return 56; // ~25 clues
      case Difficulty.MASTER: return 64; // ~17 clues (minimum for unique solution is 17)
      default: return 30;
    }
  }
}
