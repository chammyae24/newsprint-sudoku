export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER',
}

export interface SudokuCell {
  value: number | null;
  notes: number[];
  isGiven: boolean;
  solutionValue: number;
}

export type Grid = SudokuCell[][];

export interface PuzzleData {
  grid: SudokuCell[][];
  difficulty: Difficulty;
  generatedDate: number;
}

export enum TechniqueType {
  LAST_FREE_CELL = 'Last Free Cell',
  HIDDEN_SINGLE = 'Hidden Single',
  NAKED_SINGLE = 'Naked Single',
  LOCKED_POINTING = 'Locked Pointing',
  LOCKED_CLAIMING = 'Locked Claiming',
  NAKED_PAIR = 'Naked Pair',
  HIDDEN_PAIR = 'Hidden Pair',
  NAKED_TRIPLE = 'Naked Triple',
  HIDDEN_TRIPLE = 'Hidden Triple',
  NAKED_QUAD = 'Naked Quad',
  HIDDEN_QUAD = 'Hidden Quad',
  X_WING = 'X-Wing',
  XY_WING = 'XY-Wing',
  XYZ_WING = 'XYZ-Wing',
  SWORDFISH = 'Swordfish',
  SKYSCRAPER = 'Skyscraper',
  BUG_PLUS_ONE = 'BUG+1',
  FAST_SOLVE = 'Fast Solve',
  CROSS_HATCHING = 'Cross Hatching',
}

/**
 * Technique difficulty categories for grouping and display
 */
export enum TechniqueCategory {
  BASIC = 'Basic',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

/**
 * Maps each technique to its difficulty category
 */
export const TECHNIQUE_CATEGORIES: Record<TechniqueType, TechniqueCategory> = {
  [TechniqueType.LAST_FREE_CELL]: TechniqueCategory.BASIC,
  [TechniqueType.HIDDEN_SINGLE]: TechniqueCategory.BASIC,
  [TechniqueType.NAKED_SINGLE]: TechniqueCategory.BASIC,
  [TechniqueType.CROSS_HATCHING]: TechniqueCategory.BASIC,
  [TechniqueType.FAST_SOLVE]: TechniqueCategory.BASIC,

  [TechniqueType.LOCKED_POINTING]: TechniqueCategory.INTERMEDIATE,
  [TechniqueType.LOCKED_CLAIMING]: TechniqueCategory.INTERMEDIATE,
  [TechniqueType.NAKED_PAIR]: TechniqueCategory.INTERMEDIATE,
  [TechniqueType.HIDDEN_PAIR]: TechniqueCategory.INTERMEDIATE,
  [TechniqueType.NAKED_TRIPLE]: TechniqueCategory.INTERMEDIATE,
  [TechniqueType.HIDDEN_TRIPLE]: TechniqueCategory.INTERMEDIATE,

  [TechniqueType.NAKED_QUAD]: TechniqueCategory.ADVANCED,
  [TechniqueType.HIDDEN_QUAD]: TechniqueCategory.ADVANCED,
  [TechniqueType.X_WING]: TechniqueCategory.ADVANCED,
  [TechniqueType.XY_WING]: TechniqueCategory.ADVANCED,
  [TechniqueType.XYZ_WING]: TechniqueCategory.ADVANCED,
  [TechniqueType.SWORDFISH]: TechniqueCategory.ADVANCED,
  [TechniqueType.SKYSCRAPER]: TechniqueCategory.ADVANCED,
  [TechniqueType.BUG_PLUS_ONE]: TechniqueCategory.ADVANCED,
};

export interface CellPosition {
  row: number;
  col: number;
}

export interface Candidate {
  row: number;
  col: number;
  value: number;
}

export interface TechniqueResult {
  technique: TechniqueType;
  primaryCells: CellPosition[];
  secondaryCells?: CellPosition[];
  eliminations: Candidate[];
  placement?: Candidate;
  explanation: string;
}

export interface TechniqueFunction {
  (grid: SudokuCell[][]): TechniqueResult | null;
}

export interface Hint {
  technique: TechniqueType;
  primaryCells: { row: number; col: number }[];
  secondaryCells?: { row: number; col: number }[];
  eliminations: { row: number; col: number; value: number }[];
  placement?: { row: number; col: number; value: number };
  description: string;
}

/**
 * Record of a single move for history tracking and analytics.
 */
export interface MoveRecord {
  row: number;
  col: number;
  value: number;
  technique?: TechniqueType;
  techniqueExplanation?: string; // Human-readable explanation of the technique
  techniquePrimaryCells?: CellPosition[]; // Key cells involved in the technique
  timestamp: number;
  wasCorrect: boolean;
  type?: 'placement' | 'elimination';
}
