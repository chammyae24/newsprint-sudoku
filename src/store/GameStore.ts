import { create } from 'zustand';
import { SudokuGenerator } from '../core/SudokuGenerator';
import type { Difficulty, SudokuCell } from '../core/types';
import type { SavedGameState } from '../storage/gameStorage';
import { cloneGrid } from '../utils/gridUtils';
import { autoGenerateNotes } from '../utils/noteUtils';

export type InputMode = 'solve' | 'note';

export interface SelectedCell {
  row: number;
  col: number;
}

interface UndoableState {
  grid: SudokuCell[][];
  mistakes: number;
  isGameOver: boolean;
  isGameWon: boolean;
}

interface GameState {
  // Puzzle data
  grid: SudokuCell[][];
  difficulty: Difficulty;

  // Game progress
  selectedCell: SelectedCell | null;
  inputMode: InputMode;
  mistakes: number;
  maxMistakes: number;
  isGameOver: boolean;
  isGameWon: boolean;

  // Timer
  elapsedSeconds: number;
  isPaused: boolean;

  // Handwriting mode (premium)
  isHandwritingEnabled: boolean;
  isPencilDetected: boolean;

  // Undo/Redo stacks
  undoStack: UndoableState[];
  redoStack: UndoableState[];
}

interface GameActions {
  // Game lifecycle
  newGame: (difficulty: Difficulty) => void;
  resumeGame: (savedState: SavedGameState) => void;
  resetGame: () => void;

  // Cell selection
  selectCell: (row: number, col: number) => void;
  clearSelection: () => void;

  // Input handling
  setInputMode: (mode: InputMode) => void;
  toggleInputMode: () => void;

  // Cell value manipulation
  setCellValue: (value: number) => boolean; // returns true if correct
  toggleNote: (value: number) => void;
  clearCell: () => void;

  // Timer
  tick: () => void;
  pause: () => void;
  resume: () => void;

  // Handwriting mode
  setHandwritingEnabled: (enabled: boolean) => void;
  setPencilDetected: (detected: boolean) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;

  // Auto-notes
  autoFillNotes: () => void;

  // Utility
  isValueInSelectedPeers: (value: number) => boolean;
  getHint: () => { row: number; col: number; value: number } | null;
}

const createEmptyGrid = (): SudokuCell[][] =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({
      value: null,
      notes: [],
      isGiven: false,
      solutionValue: 0,
    }))
  );

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // Initial state
  grid: createEmptyGrid(),
  difficulty: 'EASY' as Difficulty,
  selectedCell: null,
  inputMode: 'solve',
  mistakes: 0,
  maxMistakes: 3,
  isGameOver: false,
  isGameWon: false,
  elapsedSeconds: 0,
  isPaused: false,
  isHandwritingEnabled: false,
  isPencilDetected: false,
  undoStack: [],
  redoStack: [],

  // Actions
  newGame: (difficulty: Difficulty) => {
    const { grid, solution } = SudokuGenerator.generate(difficulty);

    // Map solution values to cells
    const mappedGrid = grid.map((row, r) =>
      row.map((cell, c) => ({
        ...cell,
        solutionValue: solution[r][c],
      }))
    );

    set({
      grid: mappedGrid,
      difficulty,
      selectedCell: null,
      inputMode: 'solve',
      mistakes: 0,
      isGameOver: false,
      isGameWon: false,
      elapsedSeconds: 0,
      isPaused: false,
      undoStack: [],
      redoStack: [],
    });
  },

  resetGame: () => {
    const { grid } = get();
    const resetGrid = grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        value: cell.isGiven ? cell.value : null,
        notes: [],
      }))
    );

    set({
      grid: resetGrid,
      selectedCell: null,
      mistakes: 0,
      isGameOver: false,
      isGameWon: false,
      elapsedSeconds: 0,
      isPaused: false,
      undoStack: [],
      redoStack: [],
    });
  },

  resumeGame: (savedState: SavedGameState) => {
    set({
      grid: savedState.grid as SudokuCell[][],
      difficulty: savedState.difficulty as Difficulty,
      selectedCell: savedState.selectedCell,
      inputMode: savedState.inputMode as InputMode,
      mistakes: savedState.mistakes,
      isGameOver: savedState.isGameOver,
      isGameWon: savedState.isGameWon,
      elapsedSeconds: savedState.elapsedSeconds,
      isPaused: false,
      undoStack: [],
      redoStack: [],
    });
  },

  selectCell: (row: number, col: number) => {
    set({ selectedCell: { row, col } });
  },

  clearSelection: () => {
    set({ selectedCell: null });
  },

  setInputMode: (mode: InputMode) => {
    set({ inputMode: mode });
  },

  toggleInputMode: () => {
    set((state) => ({
      inputMode: state.inputMode === 'solve' ? 'note' : 'solve',
    }));
  },

  setCellValue: (value: number) => {
    const { selectedCell, grid, maxMistakes, isGameOver } = get();

    if (!selectedCell || isGameOver) return false;

    const { row, col } = selectedCell;
    const cell = grid[row][col];

    // Can't modify given cells
    if (cell.isGiven) return false;

    const isCorrect = cell.solutionValue === value;

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return {
              ...c,
              value: value, // Always set the value (show wrong answers in red)
              notes: [], // Clear notes when setting value
            };
          }
          return c;
        })
      );

      const newMistakes = isCorrect ? state.mistakes : state.mistakes + 1;
      const newIsGameOver = newMistakes >= maxMistakes;

      // Check for win
      const isWon = newGrid.every((row) =>
        row.every((cell) => cell.value === cell.solutionValue)
      );

      return {
        grid: newGrid,
        mistakes: newMistakes,
        isGameOver: newIsGameOver,
        isGameWon: isWon,
      };
    });

    return isCorrect;
  },

  toggleNote: (value: number) => {
    const { selectedCell, grid, isGameOver } = get();

    if (!selectedCell || isGameOver) return;

    const { row, col } = selectedCell;
    const cell = grid[row][col];

    // Can't add notes to given cells or cells with values
    if (cell.isGiven || cell.value !== null) return;

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            const hasNote = c.notes.includes(value);
            return {
              ...c,
              notes: hasNote
                ? c.notes.filter((n) => n !== value)
                : [...c.notes, value].sort(),
            };
          }
          return c;
        })
      );

      return { grid: newGrid };
    });
  },

  clearCell: () => {
    const { selectedCell, grid, isGameOver } = get();

    if (!selectedCell || isGameOver) return;

    const { row, col } = selectedCell;
    const cell = grid[row][col];

    if (cell.isGiven) return;

    set((state) => {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === row && ci === col) {
            return { ...c, value: null, notes: [] };
          }
          return c;
        })
      );

      return { grid: newGrid };
    });
  },

  tick: () => {
    const { isPaused, isGameOver, isGameWon } = get();
    if (isPaused || isGameOver || isGameWon) return;

    set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),

  setHandwritingEnabled: (enabled: boolean) => {
    set({ isHandwritingEnabled: enabled });
  },

  setPencilDetected: (detected: boolean) => {
    set({ isPencilDetected: detected });
  },

  isValueInSelectedPeers: (value: number) => {
    const { selectedCell, grid } = get();
    if (!selectedCell) return false;

    const { row, col } = selectedCell;
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;

    // Check row
    for (let c = 0; c < 9; c++) {
      if (c !== col && grid[row][c].value === value) return true;
    }

    // Check column
    for (let r = 0; r < 9; r++) {
      if (r !== row && grid[r][col].value === value) return true;
    }

    // Check box
    for (let r = boxStartRow; r < boxStartRow + 3; r++) {
      for (let c = boxStartCol; c < boxStartCol + 3; c++) {
        if ((r !== row || c !== col) && grid[r][c].value === value) return true;
      }
    }

    return false;
  },

  undo: () => {
    set((state) => {
      if (state.undoStack.length === 0) return state;

      const previousState = state.undoStack[state.undoStack.length - 1];
      const newUndoStack = state.undoStack.slice(0, -1);

      return {
        ...previousState,
        undoStack: newUndoStack,
        redoStack: [
          ...state.redoStack,
          {
            grid: state.grid,
            mistakes: state.mistakes,
            isGameOver: state.isGameOver,
            isGameWon: state.isGameWon,
          },
        ],
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.redoStack.length === 0) return state;

      const nextState = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);

      return {
        ...nextState,
        undoStack: [
          ...state.undoStack,
          {
            grid: state.grid,
            mistakes: state.mistakes,
            isGameOver: state.isGameOver,
            isGameWon: state.isGameWon,
          },
        ],
        redoStack: newRedoStack,
      };
    });
  },

  autoFillNotes: () => {
    set((state) => {
      // Save undo point
      const undoPoint = {
        grid: cloneGrid(state.grid),
        mistakes: state.mistakes,
        isGameOver: state.isGameOver,
        isGameWon: state.isGameWon,
      };

      const newGrid = autoGenerateNotes(state.grid);

      return {
        grid: newGrid,
        undoStack: [...state.undoStack, undoPoint],
        redoStack: [],
      };
    });
  },

  getHint: () => {
    const { grid, isGameOver, isGameWon } = get();
    if (isGameOver || isGameWon) return null;

    // Find first empty cell and return its solution
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = grid[r][c];
        if (cell.value === null && !cell.isGiven) {
          return { row: r, col: c, value: cell.solutionValue };
        }
      }
    }

    return null;
  },
}));
