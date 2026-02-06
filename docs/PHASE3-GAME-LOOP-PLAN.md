# Phase 3: Game Loop & Cell Logic Implementation Plan

## Overview
This Phase focuses on implementing the core game state management, cell data structures, 3x3 subgrid rendering, game loop mechanics (lives, mistakes, timer), and persistence using MMKV and Zustand.

---

## Step 1: State Management Architecture

### 1.1 Setup Zustand Store
**File:** `src/store/gameStore.ts`

**Step 1.1.1: Define Core Types**
```typescript
export type InputMode = 'SOLVE' | 'NOTE';

export interface Cell {
  value: number | null;      // Solution digit (1-9) in Solve Mode
  notes: number[];           // Candidates (1-9 array) in Note Mode
  isGiven: boolean;          // Original puzzle cell (cannot edit)
  isError: boolean;          // Visual error state
  isSelected: boolean;       // Visual selection state
}

export type SudokuGrid = Cell[][];  // 9x9 grid

export interface GameState {
  // Puzzle data
  puzzle: number[][];        // Initial puzzle (0 = empty)
  solution: number[][];      // Pre-calculated solution
  grid: SudokuGrid;          // Current state

  // Game progress
  lives: number;             // 0-3 hearts
  mistakes: number;          // Total mistakes count
  isGameOver: boolean;
  isCompleted: boolean;

  // Input state
  selectedCell: { row: number; col: number } | null;
  inputMode: InputMode;

  // Tools state
  undoStack: GameState[];
  redoStack: GameState[];

  // Timer
  startTime: number | null;
  elapsedTime: number;       // In seconds
  isPaused: boolean;

  // Metadata
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  puzzleId: string;
  date: string;
}
```

### 1.2 Create Zustand Store
**File:** `src/store/gameStore.ts` (continued)

**Step 1.2.1: Initial State**
```typescript
const initialState: GameState = {
  puzzle: createEmptyPuzzle(),
  solution: createEmptyPuzzle(),
  grid: createEmptyGrid(),
  lives: 3,
  mistakes: 0,
  isGameOver: false,
  isCompleted: false,
  selectedCell: null,
  inputMode: 'SOLVE',
  undoStack: [],
  redoStack: [],
  startTime: null,
  elapsedTime: 0,
  isPaused: false,
  difficulty: 'easy',
  puzzleId: '',
  date: new Date().toISOString(),
};
```

### 1.3 Implement Store Actions

**Step 1.3.1: Game Initialization Actions**
```typescript
// Start new game
const startNewGame = (
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
) => {
  // 1. Generate puzzle
  const { puzzle, solution } = generatePuzzle(difficulty);

  // 2. Create grid with given cells
  const grid = initializeGrid(puzzle);

  // 3. Reset state
  set((state) => ({
    ...initialState,
    puzzle,
    solution,
    grid,
    difficulty,
    puzzleId: generatePuzzleId(),
    startTime: Date.now(),
  }));
};

// Resume saved game
const resumeGame = (savedState: Partial<GameState>) => {
  // Restore state from storage
  set(savedState as GameState);
};
```

**Step 1.3.2: Cell Selection Actions**
```typescript
// Select a cell
const selectCell = (row: number, col: number) => {
  set((state) => {
    const newGrid = cloneGrid(state.grid);

    // Deselect previous
    if (state.selectedCell) {
      newGrid[state.selectedCell.row][state.selectedCell.col].isSelected = false;
    }

    // Select new
    newGrid[row][col].isSelected = true;
    state.selectedCell = { row, col };

    return { grid: newGrid, selectedCell: { row, col } };
  });
};

// Deselect cell
const deselectCell = () => {
  set((state) => {
    if (!state.selectedCell) return state;

    const newGrid = cloneGrid(state.grid);
    newGrid[state.selectedCell.row][state.selectedCell.col].isSelected = false;

    return { grid: newGrid, selectedCell: null };
  });
};
```

**Step 1.3.3: Input Mode Actions**
```typescript
// Switch input mode
const setInputMode = (mode: InputMode) => {
  set({ inputMode: mode });
};
```

**Step 1.3.4: Solve Mode Action (Validated Input)**
```typescript
// Place digit in Solve Mode
const placeDigit = (row: number, col: number, digit: number) => {
  set((state) => {
    // Cannot edit given cells
    if (state.grid[row][col].isGiven) return state;

    const correctDigit = state.solution[row][col];

    if (digit === correctDigit) {
      // Correct!
      const newGrid = cloneGrid(state.grid);
      newGrid[row][col].value = digit;
      newGrid[row][col].isError = false;

      // Auto-clear peers
      clearNotesFromPeers(newGrid, row, col, digit);

      // Check completion
      const isComplete = checkCompletion(newGrid, state.solution);

      return {
        grid: newGrid,
        isCompleted: isComplete,
      };
    } else {
      // Incorrect!
      const newLives = state.lives - 1;
      const isGameOver = newLives === 0;

      const newGrid = cloneGrid(state.grid);
      newGrid[row][col].isError = true;

      return {
        grid: newGrid,
        lives: newLives,
        mistakes: state.mistakes + 1,
        isGameOver,
      };
    }
  });
};
```

**Step 1.3.5: Note Mode Action (Unvalidated Input)**
```typescript
// Toggle candidate in Note Mode
const toggleCandidate = (row: number, col: number, digit: number) => {
  set((state) => {
    // Cannot edit given cells
    if (state.grid[row][col].isGiven) return state;

    const newGrid = cloneGrid(state.grid);

    // Toggle digit in notes array
    const notes = newGrid[row][col].notes;
    const index = notes.indexOf(digit);

    if (index >= 0) {
      notes.splice(index, 1); // Remove if present
    } else {
      notes.push(digit);      // Add if not present
      notes.sort();           // Keep sorted
    }

    return { grid: newGrid };
  });
};

// Set specific candidates (for auto-note feature)
const setCandidates = (row: number, col: number, digits: number[]) => {
  set((state) => {
    if (state.grid[row][col].isGiven) return state;

    const newGrid = cloneGrid(state.grid);
    newGrid[row][col].notes = [...digits].sort();

    return { grid: newGrid };
  });
};

// Clear all candidates for a cell
const clearCandidates = (row: number, col: number) => {
  set((state) => {
    if (state.grid[row][col].isGiven) return state;

    const newGrid = cloneGrid(state.grid);
    newGrid[row][col].notes = [];

    return { grid: newGrid };
  });
};
```

**Step 1.3.6: Eraser Action**
```typescript
// Clear cell (both solve value and notes)
const clearCell = (row: number, col: number) => {
  set((state) => {
    if (state.grid[row][col].isGiven) return state;

    const newGrid = cloneGrid(state.grid);
    newGrid[row][col].value = null;
    newGrid[row][col].notes = [];
    newGrid[row][col].isError = false;

    return { grid: newGrid };
  });
};
```

**Step 1.3.7: Undo/Redo Actions**
```typescript
// Save state for undo
const saveUndoPoint = () => {
  set((state) => ({
    undoStack: [...state.undoStack, state],
    redoStack: [],
  }));
};

// Undo
const undo = () => {
  set((state) => {
    if (state.undoStack.length === 0) return state;

    const previousState = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);

    return {
      ...previousState,
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, state],
    };
  });
};

// Redo
const redo = () => {
  set((state) => {
    if (state.redoStack.length === 0) return state;

    const nextState = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);

    return {
      ...nextState,
      undoStack: [...state.undoStack, state],
      redoStack: newRedoStack,
    };
  });
};
```

**Step 1.3.8: Timer Actions**
```typescript
// Start/pause timer
const togglePause = () => {
  set((state) => ({
    isPaused: !state.isPaused,
  }));
};

// Update elapsed time (called every second)
const updateTimer = () => {
  set((state) => {
    if (!state.startTime || state.isPaused) return state;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);

    return { elapsedTime: elapsed };
  });
};
```

### 1.4 Combine Store
**File:** `src/store/gameStore.ts` (final)

```typescript
export const useGameStore = create<GameState & Actions>((set, get) => ({
  ...initialState,
  startNewGame,
  resumeGame,
  selectCell,
  deselectCell,
  setInputMode,
  placeDigit,
  toggleCandidate,
  setCandidates,
  clearCandidates,
  clearCell,
  saveUndoPoint,
  undo,
  redo,
  togglePause,
  updateTimer,
}));
```

---

## Step 2: Persistence with MMKV

### 2.1 Setup MMKV Storage
**File:** `src/storage/gameStorage.ts`

**Step 2.1.1: Initialize MMKV**
```typescript
import { MMKV } from 'react-native-mmkv';

const gameStorage = new MMKV({
  id: 'newsprint-sudoku-game',
  encryptionKey: 'encryption-key', // Optional: for secure storage
});
```

**Step 2.1.2: Save Game State**
```typescript
export const saveGameState = (state: GameState) => {
  try {
    gameStorage.set('currentGame', JSON.stringify(state));
    console.log('Game state saved successfully');
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
};
```

**Step 2.1.3: Load Game State**
```typescript
export const loadGameState = (): GameState | null => {
  try {
    const saved = gameStorage.getString('currentGame');
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
    return null;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
};
```

**Step 2.1.4: Check for Saved Game**
```typescript
export const hasSavedGame = (): boolean => {
  return gameStorage.contains('currentGame');
};
```

**Step 2.1.5: Clear Saved Game**
```typescript
export const clearSavedGame = () => {
  gameStorage.delete('currentGame');
};
```

### 2.2 Auto-Save Integration
**File:** `src/store/gameStore.ts` (add to actions)

```typescript
import { saveGameState } from '../storage/gameStorage';

// Modify actions to auto-save
const placeDigit = (row: number, col: number, digit: number) => {
  set((state) => {
    // ... existing logic ...

    saveGameState(get());
    return result;
  });
};
```

---

## Step 3: Utility Functions

### 3.1 Grid Utilities
**File:** `src/utils/gridUtils.ts`

**Step 3.1.1: Create Empty Grid**
```typescript
export const createEmptyGrid = (): Cell[][] => {
  const grid: Cell[][] = [];
  for (let row = 0; row < 9; row++) {
    grid[row] = [];
    for (let col = 0; col < 9; col++) {
      grid[row][col] = {
        value: null,
        notes: [],
        isGiven: false,
        isError: false,
        isSelected: false,
      };
    }
  }
  return grid;
};
```

**Step 3.1.2: Initialize Grid from Puzzle**
```typescript
export const initializeGrid = (puzzle: number[][]): Cell[][] => {
  const grid = createEmptyGrid();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (puzzle[row][col] !== 0) {
        grid[row][col].value = puzzle[row][col];
        grid[row][col].isGiven = true;
      }
    }
  }

  return grid;
};
```

**Step 3.1.3: Clone Grid**
```typescript
export const cloneGrid = (grid: Cell[][]): Cell[][] => {
  return grid.map(row => row.map(cell => ({ ...cell })));
};
```

**Step 3.1.4: Clear Notes from Peers**
```typescript
export const clearNotesFromPeers = (
  grid: Cell[][],
  row: number,
  col: number,
  digit: number
): Cell[][] => {
  // Clear from row
  for (let c = 0; c < 9; c++) {
    const idx = grid[row][c].notes.indexOf(digit);
    if (idx >= 0) grid[row][c].notes.splice(idx, 1);
  }

  // Clear from column
  for (let r = 0; r < 9; r++) {
    const idx = grid[r][col].notes.indexOf(digit);
    if (idx >= 0) grid[r][col].notes.splice(idx, 1);
  }

  // Clear from box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const idx = grid[r][c].notes.indexOf(digit);
      if (idx >= 0) grid[r][c].notes.splice(idx, 1);
    }
  }

  return grid;
};
```

**Step 3.1.5: Check Completion**
```typescript
export const checkCompletion = (
  grid: Cell[][],
  solution: number[][]
): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value !== solution[row][col]) {
        return false;
      }
    }
  }
  return true;
};
```

### 3.2 Note Management
**File:** `src/utils/noteUtils.ts`

**Step 3.2.1: Auto-Generate Notes**
```typescript
export const autoGenerateNotes = (
  grid: Cell[][][],
  puzzle: number[][],
  solution: number[][]
): Cell[][] => {
  const newGrid = cloneGrid(grid);

  const validDigits = (row: number, col: number): number[] => {
    const digits = [];

    for (let d = 1; d <= 9; d++) {
      if (isValidPlacement(puzzle, row, col, d)) {
        digits.push(d);
      }
    }

    return digits;
  };

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (newGrid[row][col].value === null && !newGrid[row][col].isGiven) {
        newGrid[row][col].notes = validDigits(row, col);
      }
    }
  }

  return newGrid;
};
```

---

## Step 4: Cell Rendering Component

### 4.1 Create Cell Component
**File:** `src/ui/components/Cell.tsx`

**Step 4.1.1: Component Structure**
```typescript
import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { Canvas, Path, Text, Skia } from '@shopify/react-native-skia';

interface CellProps {
  row: number;
  col: number;
  width: number;
  height: number;
}

export const Cell: React.FC<CellProps> = ({ row, col, width, height }) => {
  const { grid, selectCell } = useGameStore();
  const cellData = grid[row][col];

  const handlePress = () => {
    selectCell(row, col);
  };

  return (
    <Canvas style={{ width, height }} onTouch={handlePress}>
      <CellBackground cell={cellData} width={width} height={height} />
      <CellContent cell={cellData} width={width} height={height} />
    </Canvas>
  );
};
```

### 4.2 Cell Background Rendering
**File:** `src/ui/components/CellBackground.tsx`

**Step 4.2.1: Background Colors**
```typescript
const CellBackground: React.FC<CellBackgroundProps> = ({ cell, width, height }) => {
  const fillColor = React.useMemo(() => {
    if (cell.isSelected) return '#CFE1FF'; // Selection highlight
    if (cell.isGiven) return '#E8E8E8';     // Given cell
    return '#F3EBDD';                        // Default paper color
  }, [cell]);

  return (
    <Rect x={0} y={0} width={width} height={height} color={fillColor} />
  );
};
```

### 4.3 Solve Digit Rendering
**File:** `src/ui/components/SolveDigit.tsx`

**Step 4.3.1: Large Digit Display**
```typescript
const SolveDigit: React.FC<SolveDigitProps> = ({ digit, width, height, isError }) => {
  if (!digit) return null;

  const color = isError ? '#FF0000' : '#2A2A2A'; // Red for error, dark grey for normal
  const fontSize = height * 0.6;                   // 60% of cell height

  return (
    <Text
      text={digit.toString()}
      x={width / 2}
      y={height / 2}
      font={Skia.Font.MakeDefault(fontSize)}
      color={color}
      anchor={{ x: 0.5, y: 0.5 }}
    />
  );
};
```

---

## Step 5: 3x3 Notes Subgrid Rendering

### 5.1 Create Notes Grid Component
**File:** `src/ui/components/NotesGrid.tsx`

**Step 5.1.1: Notes Subgrid Layout**
```typescript
const NotesGrid: React.FC<NotesGridProps> = ({ notes, width, height }) => {
  if (notes.length === 0) return null;

  // 3x3 grid coordinates for digits 1-9
  const notePositions: Record<number, { x: number; y: number }> = {
    1: { x: width * 0.166, y: height * 0.166 },   // Top-Left
    2: { x: width * 0.5, y: height * 0.166 },     // Top-Center
    3: { x: width * 0.833, y: height * 0.166 },   // Top-Right
    4: { x: width * 0.166, y: height * 0.5 },     // Middle-Left
    5: { x: width * 0.5, y: height * 0.5 },       // Center
    6: { x: width * 0.833, y: height * 0.5 },     // Middle-Right
    7: { x: width * 0.166, y: height * 0.833 },   // Bottom-Left
    8: { x: width * 0.5, y: height * 0.833 },     // Bottom-Center
    9: { x: width * 0.833, y: height * 0.833 },   // Bottom-Right
  };

  const fontSize = height * 0.2;  // 20% of cell height

  return notes.map((digit) => (
    <Text
      key={digit}
      text={digit.toString()}
      x={notePositions[digit].x}
      y={notePositions[digit].y}
      font={Skia.Font.MakeDefault(fontSize)}
      color='#666666'  // Grey for notes
      anchor={{ x: 0.5, y: 0.5 }}
    />
  ));
};
```

**Step 5.1.2: Cell Content Orchestrator**
```typescript
const CellContent: React.FC<CellContentProps> = ({ cell, width, height }) => {
  // Render Solve Mode digit if present
  if (cell.value !== null) {
    return (
      <SolveDigit
        digit={cell.value}
        width={width}
        height={height}
        isError={cell.isError}
      />
    );
  }

  // Otherwise render Note Mode candidates
  return <NotesGrid notes={cell.notes} width={width} height={height} />;
};
```

---

## Step 6: Game Loop Implementation

### 6.1 Timer Component
**File:** `src/ui/components/Timer.tsx`

**Step 6.1.1: Time Display**
```typescript
export const Timer: React.FC = () => {
  const { elapsedTime, isPaused, togglePause } = useGameStore();

  // Format time as MM:SS
  const formattedTime = React.useMemo(() => {
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [elapsedTime]);

  // Auto-update timer
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        useGameStore.getState().updateTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <TouchableOpacity onPress={togglePause}>
      <Text>{isPaused ? '⏸' : '⏱'} {formattedTime}</Text>
    </TouchableOpacity>
  );
};
```

### 6.2 Lives Display Component
**File:** `src/ui/components/LivesDisplay.tsx`

**Step 6.2.1: Hearts Display**
```typescript
export const LivesDisplay: React.FC = () => {
  const { lives } = useGameStore();

  return (
    <View style={styles.container}>
      {[1, 2, 3].map((heart) => (
        <Text
          key={heart}
          style={[
            styles.heart,
            { color: heart <= lives ? '#FF0000' : '#CCCCCC' },
          ]}
        >
          ❤️
        </Text>
      ))}
    </View>
  );
};
```

### 6.3 Game Over Screen
**File:** `src/ui/components/GameOverScreen.tsx`

**Step 6.3.1: Game Over Logic**
```typescript
export const GameOverScreen: React.FC = () => {
  const { isGameOver, isCompleted, mistakes } = useGameStore();

  if (!isGameOver) return null;

  return (
    <Modal visible={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>
            {isCompleted ? '🎉 Puzzled Solved!' : '💔 Puzzle Spoiled!'}
          </Text>
          <Text style={styles.message}>
            {isCompleted
              ? `Completed with ${mistakes} mistake${mistakes === 1 ? '' : 's'}`
              : 'You ran out of lives!'}
          </Text>
          <Button title="Try Again" onPress={startNewGame} />
          <Button title="Back to Menu" onPress={goToMainMenu} />
        </View>
      </View>
    </Modal>
  );
};
```

---

## Step 7: Testing Strategy

### 7.1 Unit Tests
**File:** `tests/store/gameStore.test.ts`

Test Cases:
- [ ] `startNewGame()` creates valid game state
- [ ] `selectCell()` updates selection correctly
- [ ] `placeDigit()` validates correctly in Solve Mode
- [ ] `placeDigit()` decrements lives on wrong digit
- [ ] `toggleCandidate()` adds/removes notes correctly
- [ ] `undo()` restores previous state
- [ ] `redo()` restores undone state

### 7.2 Integration Tests
**File:** `tests/store/integration.test.ts`

Test Cases:
- [ ] Full game loop: start → play → win
- [ ] Loss scenario: 3 mistakes → game over
- [ ] Persistence: save → reload → resume
- [ ] Auto-save triggers correctly
- [ ] Timer works correctly

### 7.3 Rendering Tests
**File:** `tests/ui/cell.test.ts`

Test Cases:
- [ ] Given cells display correctly
- [ ] Solve digits render at correct size
- [ ] Notes render in 3x3 grid
- [ ] Selected cell highlights correctly
- [ ] Error cells show in red

---

## Step 8: Verification Checklist

### 8.1 State Management
- [ ] Zustand store compiles without errors
- [ ] All actions mutate state correctly
- [ ] State persists with MMKV
- [ ] Undo/redo maintains correct stack

### 8.2 Cell Logic
- [ ] Cell data structure matches PRD
- [ ] Solve Mode validation works
- [ ] Note Mode toggling works
- [ ] Auto-clear peers works
- [ ] Eraser clears both value and notes

### 8.3 Rendering
- [ ] 3x3 notes subgrid has correct layout
- [ ] Digit sizes are correct (60% vs 20%)
- [ ] Colors match specification
- [ ] Selection feedback is visible

### 8.4 Game Loop
- [ ] Lives decrement correctly
- [ ] Timer updates every second
- [ ] Game Over triggers at 0 lives
- [ ] Win condition detects completion
- [ ] Pause toggles timer

---

## Deliverables for Phase 3

1. **State Management**
   - Zustand store with full game state
   - All game actions implemented
   - Type-safe interfaces

2. **Persistence**
   - MMKV storage layer
   - Auto-save on every move
   - Resume game functionality

3. **Cell Rendering**
   - Cell component with background
   - Solve digit rendering
   - 3x3 notes subgrid rendering
   - Selection and error states

4. **Game Loop Components**
   - Timer component
   - Lives display
   - Game Over screen

5. **Test Suite**
   - Store tests (50+ test cases)
   - Integration tests
   - Rendering tests

---

## Estimated Timeline
- Step 1 (State Management): 10 hours
- Step 2 (Persistence): 4 hours
- Step 3 (Utilities): 4 hours
- Step 4 (Cell Component): 4 hours
- Step 5 (Notes Rendering): 6 hours
- Step 6 (Game Loop): 6 hours
- Step 7 (Testing): 8 hours
- Step 8 (Verification): 2 hours

**Total: ~44 hours (5-6 days)**

---

## Next Phase
After completing Phase 3:
1. Game logic is fully interactive
2. Cell rendering works for both modes
3. Ready for Phase 4: Polish (Visual Effects, Animations, Shaders)