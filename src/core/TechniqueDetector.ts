import { cloneGrid } from '../utils/gridUtils';
import { SudokuSolver } from './SudokuSolver';
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
import {
  CellPosition,
  SudokuCell,
  TechniqueResult,
  TechniqueType,
} from './types';
import { isSafeInGrid } from './utils';

/**
 * Detects the technique used for a specific move.
 * Currently supports:
 * - Naked Single
 * - Hidden Single (Row, Col, Box)
 * - BUG+1
 * - Advanced Eliminations (Locked Candidates, Subsets, Wings, Fish)
 */
export class TechniqueDetector {
  /**
   * Identifies if a move corresponds to a known technique.
   * @param grid The current state of the grid
   * @param row Row of the move (0-8)
   * @param col Column of the move (0-8)
   * @param value The value being placed (1-9)
   * @returns The TechniqueType detected, or undefined if no technique explains it.
   */
  public static detect(
    grid: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ): TechniqueType | undefined {
    // 1. Calculate candidates for the target cell
    const candidates = this.getCandidates(grid, row, col);

    // If the value isn't even a valid candidate, it's a guess or mistake
    if (!candidates.includes(value)) return undefined;

    // 2. Check for Naked Single
    if (candidates.length === 1 && candidates[0] === value) {
      return TechniqueType.NAKED_SINGLE;
    }

    // 3. Check for Hidden Singles / Cross Hatching
    const hiddenType = this.detectHiddenSingleType(grid, row, col, value);
    if (hiddenType) return hiddenType;

    // 4. Check for BUG+1
    const bugResult = findBUGPlus1(grid);
    if (
      bugResult &&
      bugResult.placement &&
      bugResult.placement.row === row &&
      bugResult.placement.col === col &&
      bugResult.placement.value === value
    ) {
      return TechniqueType.BUG_PLUS_ONE;
    }

    return undefined;
  }

  /**
   * Result type for detectWithDetails method
   */
  public static DetectionResult:
    | {
        technique: TechniqueType;
        explanation: string;
        primaryCells: CellPosition[];
      }
    | undefined;

  /**
   * Enhanced detection that returns rich technique metadata.
   * Also identifies if a placement was enabled by advanced technique eliminations.
   */
  public static detectWithDetails(
    grid: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ):
    | {
        technique: TechniqueType;
        explanation: string;
        primaryCells: CellPosition[];
      }
    | undefined {
    const candidates = this.getCandidates(grid, row, col);
    if (!candidates.includes(value)) return undefined;

    // Clone grid for advanced technique checks
    const gridClone = cloneGrid(grid);
    SudokuSolver.updateCandidates(gridClone);

    // 1. Check if this is a Naked Single enabled by an advanced technique
    if (candidates.length === 1 && candidates[0] === value) {
      const advancedResult = this.findEnablingAdvancedTechnique(
        gridClone,
        row,
        col,
        value
      );
      if (advancedResult) return advancedResult;

      return {
        technique: TechniqueType.NAKED_SINGLE,
        explanation: `Cell R${row + 1}C${col + 1} has only one possible value: ${value}`,
        primaryCells: [{ row, col }],
      };
    }

    // 2. Check for Hidden Singles / Cross Hatching
    const hiddenType = this.detectHiddenSingleType(grid, row, col, value);
    if (hiddenType) {
      return {
        technique: hiddenType,
        explanation: this.getHiddenSingleExplanation(
          hiddenType,
          row,
          col,
          value
        ),
        primaryCells: [{ row, col }],
      };
    }

    // 3. Check for BUG+1
    const bugResult = findBUGPlus1(grid);
    if (
      bugResult &&
      bugResult.placement &&
      bugResult.placement.row === row &&
      bugResult.placement.col === col &&
      bugResult.placement.value === value
    ) {
      return {
        technique: TechniqueType.BUG_PLUS_ONE,
        explanation: bugResult.explanation,
        primaryCells: bugResult.primaryCells,
      };
    }

    return undefined;
  }

  /**
   * Finds if an advanced technique's eliminations enabled this placement.
   */
  private static findEnablingAdvancedTechnique(
    gridClone: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ):
    | {
        technique: TechniqueType;
        explanation: string;
        primaryCells: CellPosition[];
      }
    | undefined {
    // Check all advanced techniques to see if any eliminates candidates
    // that would have blocked this cell from being a Naked Single
    const advancedTechniques: TechniqueResult[] = [];

    const locked = findLockedCandidates(gridClone);
    if (locked) advancedTechniques.push(locked);

    const subsets = findSubsets(gridClone);
    if (subsets) advancedTechniques.push(subsets);

    const xwing = findXWing(gridClone);
    if (xwing) advancedTechniques.push(xwing);

    const skyscraper = findSkyscraper(gridClone);
    if (skyscraper) advancedTechniques.push(skyscraper);

    const swordfish = findSwordfish(gridClone);
    if (swordfish) advancedTechniques.push(swordfish);

    const xyWing = findXYWing(gridClone);
    if (xyWing) advancedTechniques.push(xyWing);

    const xyzWing = findXYZWing(gridClone);
    if (xyzWing) advancedTechniques.push(xyzWing);

    // Check if any technique's eliminations affect this cell
    for (const result of advancedTechniques) {
      const affectsCell = result.eliminations.some(
        (e) => e.row === row && e.col === col && e.value !== value
      );

      if (affectsCell) {
        return {
          technique: result.technique,
          explanation: `${result.explanation} This enables placing ${value} at R${row + 1}C${col + 1}.`,
          primaryCells: result.primaryCells,
        };
      }
    }

    return undefined;
  }

  /**
   * Generates explanation for Hidden Single/Cross Hatching
   */
  private static getHiddenSingleExplanation(
    technique: TechniqueType,
    row: number,
    col: number,
    value: number
  ): string {
    if (technique === TechniqueType.CROSS_HATCHING) {
      return `${value} can only go in R${row + 1}C${col + 1} within its box (Cross Hatching)`;
    }
    return `${value} can only go in R${row + 1}C${col + 1} within its row/column (Hidden Single)`;
  }

  /**
   * Detects if removing a candidate is supported by a technique.
   * Iterates through techniques to find a justification for the removal.
   */
  public static detectElimination(
    grid: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ): TechniqueType | undefined {
    // Clone grid to avoid side effects
    const gridClone = cloneGrid(grid);

    // Ensure candidates are up-to-date based on current values
    SudokuSolver.updateCandidates(gridClone);

    // 1. Check Singles (Implied Eliminations)
    const nakedSingles = SudokuSolver.findNakedSingles(gridClone);
    for (const single of nakedSingles) {
      if (this.isImpliedElimination(single, row, col, value)) {
        return TechniqueType.NAKED_SINGLE;
      }
    }

    const hiddenSingles = SudokuSolver.findHiddenSingles(gridClone);
    for (const single of hiddenSingles) {
      if (this.isImpliedElimination(single, row, col, value)) {
        return TechniqueType.HIDDEN_SINGLE;
      }
    }

    // 2. Check Advanced Techniques (Explicit Eliminations)
    // Locked Candidates
    const locked = findLockedCandidates(gridClone);
    if (locked && this.isEliminationMatch(locked, row, col, value))
      return locked.technique;

    // Subsets
    const subsets = findSubsets(gridClone);
    if (subsets && this.isEliminationMatch(subsets, row, col, value))
      return subsets.technique;

    // Wings & Fish
    const xwing = findXWing(gridClone);
    if (xwing && this.isEliminationMatch(xwing, row, col, value))
      return xwing.technique;

    const skyscraper = findSkyscraper(gridClone);
    if (skyscraper && this.isEliminationMatch(skyscraper, row, col, value))
      return skyscraper.technique;

    const swordfish = findSwordfish(gridClone);
    if (swordfish && this.isEliminationMatch(swordfish, row, col, value))
      return swordfish.technique;

    const xyWing = findXYWing(gridClone);
    if (xyWing && this.isEliminationMatch(xyWing, row, col, value))
      return xyWing.technique;

    const xyzWing = findXYZWing(gridClone);
    if (xyzWing && this.isEliminationMatch(xyzWing, row, col, value))
      return xyzWing.technique;

    const bug = findBUGPlus1(gridClone);
    if (bug && this.isEliminationMatch(bug, row, col, value))
      return bug.technique;

    return undefined;
  }

  private static isImpliedElimination(
    placement: { row: number; col: number; value: number },
    targetRow: number,
    targetCol: number,
    targetValue: number
  ): boolean {
    // If placement is at (r,c) with val v:

    // 1. It eliminates all other candidates in (r,c).
    // (If target is the placement cell itself, and value is NOT the placement value)
    if (placement.row === targetRow && placement.col === targetCol) {
      if (targetValue !== placement.value) return true;
    }

    // 2. It eliminates v from peers.
    // (If target is a peer, and value IS the placement value)
    if (targetValue === placement.value) {
      // Row peer
      if (targetRow === placement.row && targetCol !== placement.col)
        return true;
      // Col peer
      if (targetCol === placement.col && targetRow !== placement.row)
        return true;
      // Box peer
      const startRow = Math.floor(placement.row / 3) * 3;
      const startCol = Math.floor(placement.col / 3) * 3;
      if (
        targetRow >= startRow &&
        targetRow < startRow + 3 &&
        targetCol >= startCol &&
        targetCol < startCol + 3 &&
        (targetRow !== placement.row || targetCol !== placement.col)
      ) {
        return true;
      }
    }

    return false;
  }

  private static isEliminationMatch(
    result: TechniqueResult,
    row: number,
    col: number,
    value: number
  ): boolean {
    if (!result.eliminations) return false;
    return result.eliminations.some(
      (e) => e.row === row && e.col === col && e.value === value
    );
  }

  /**
   * Calculates valid candidates for a specific cell based on current grid values.
   */
  private static getCandidates(
    grid: SudokuCell[][],
    row: number,
    col: number
  ): number[] {
    const candidates: number[] = [];
    const simpleGrid = grid.map((r) => r.map((c) => c.value ?? 0));

    // Ensure target is empty for candidate check logic
    simpleGrid[row][col] = 0;

    for (let n = 1; n <= 9; n++) {
      if (isSafeInGrid(simpleGrid, row, col, n)) {
        candidates.push(n);
      }
    }
    return candidates;
  }

  /**
   * Checks if the value is a Hidden Single in Row, Col, or Box.
   * Returns specific type if found.
   */
  private static detectHiddenSingleType(
    grid: SudokuCell[][],
    row: number,
    col: number,
    value: number
  ): TechniqueType | null {
    const simpleGrid = grid.map((r) => r.map((c) => c.value ?? 0));
    simpleGrid[row][col] = 0;

    // Check Row
    let uniqueInRow = true;
    for (let c = 0; c < 9; c++) {
      if (c !== col && simpleGrid[row][c] === 0) {
        if (isSafeInGrid(simpleGrid, row, c, value)) {
          uniqueInRow = false;
          break;
        }
      }
    }
    if (uniqueInRow) return TechniqueType.HIDDEN_SINGLE;

    // Check Col
    let uniqueInCol = true;
    for (let r = 0; r < 9; r++) {
      if (r !== row && simpleGrid[r][col] === 0) {
        if (isSafeInGrid(simpleGrid, r, col, value)) {
          uniqueInCol = false;
          break;
        }
      }
    }
    if (uniqueInCol) return TechniqueType.HIDDEN_SINGLE;

    // Check Box -> Cross Hatching
    let uniqueInBox = true;
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && simpleGrid[r][c] === 0) {
          if (isSafeInGrid(simpleGrid, r, c, value)) {
            uniqueInBox = false;
            break;
          }
        }
      }
    }
    if (uniqueInBox) return TechniqueType.CROSS_HATCHING;

    return null;
  }
}
