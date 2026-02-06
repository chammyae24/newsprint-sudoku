export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  MASTER = 'MASTER' // For the 13-technique crazy ones
}

export type Grid = Cell[][];

export interface Cell {
  row: number;
  col: number;
  value: number | null; // The solved value (1-9), or null if empty
  solution: number;     // The correct value (used for generation/hints, hidden from user)
  isGiven: boolean;     // True if this was part of the initial puzzle
  notes: number[];      // User's pencil marks
  isSelected: boolean;  // For UI state (keeping logic and UI types close for now, or separating?)
  // Actually, let's keep strictly logic fields here. UI state like selection should be in the store/UI layer.
}

// But wait, the plan said:
// interface Cell {
//   value: number | null;      // Solve digit
//   notes: number[];           // Note candidates
//   isGiven: boolean;          // Locked cell
//   isError: boolean;          // Visual error
//   isSelected: boolean;       // Selection highlight
// }
// Phase 1 is Logic Core (Pure TS). So I should probably define the minimal data structure needed for the logic engine,
// and extend it for the UI/Store later.
// However, to avoid types mismatch hell later, having a shared interface is good.
// Let's stick to the core data needed for solving/generating.

export interface SudokuCell {
  value: number | null;
  notes: number[];
  isGiven: boolean;
  solutionValue: number; // Storing the solution makes checking easier
}

export interface PuzzleData {
  grid: SudokuCell[][]; // 9x9
  difficulty: Difficulty;
  generatedDate: number; // Timestamp
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
  Y_WING = 'Y-Wing', // XY-Wing
  SWORDFISH = 'Swordfish',
  BUG_PLUS_ONE = 'BUG+1'
}

export interface Hint {
  technique: TechniqueType;
  primaryCells: { row: number; col: number }[]; // The cells that define the logic (e.g., the pair)
  secondaryCells?: { row: number; col: number }[]; // Affected cells (e.g., where candidates are removed)
  eliminations: { row: number; col: number; value: number }[]; // Candidates to remove
  description: string;
}
