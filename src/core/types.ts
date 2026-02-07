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
  X_WING = 'X-Wing',
  Y_WING = 'Y-Wing',
  SWORDFISH = 'Swordfish',
  BUG_PLUS_ONE = 'BUG+1',
}

export interface Hint {
  technique: TechniqueType;
  primaryCells: { row: number; col: number }[];
  secondaryCells?: { row: number; col: number }[];
  eliminations: { row: number; col: number; value: number }[];
  description: string;
}
