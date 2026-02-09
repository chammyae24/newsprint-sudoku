import { cloneGrid } from '../utils/gridUtils'; // Using cloneGrid from utils
import { SudokuSolver } from './SudokuSolver';
import { SudokuCell, TechniqueResult } from './types';

export class HintGenerator {
  /**
   * Generates a hint for the current grid state.
   * Returns a TechniqueResult if a logical move is found.
   */
  public static generateHint(grid: SudokuCell[][]): TechniqueResult | null {
    // We must work on a clone to not affect the actual game state validation
    // But findNextTechnique implementation we made calculates notes in-place.
    // So we should clone.
    const gridClone = cloneGrid(grid);
    return SudokuSolver.findNextTechnique(gridClone);
  }
}
