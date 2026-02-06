# Phase 1: Logic Core Implementation Plan

## Overview
This Phase focuses on building the pure TypeScript core logic for Sudoku puzzle generation, solving, and grading. No UI or React Native dependencies will be added yet.

---

## Step 1: Project Structure Setup
### 1.1 Create Core Directories
```bash
mkdir -p src/core/generator
mkdir -p src/core/solver
mkdir -p src/core/types
mkdir -p src/core/utils
mkdir -p tests/core
```

### 1.2 Create TypeScript Type Definitions
**File:** `src/core/types/index.ts`

Define Core Types:
- `SudokuGrid`: 9x9 number array (0-9, 0 = empty)
- `Cell`: { row: number, col: number, value: number }
- `Difficulty`: 'easy' | 'medium' | 'hard' | 'expert'
- `Technique`: Union type for 13 solving techniques
- `Hint`: { technique: Technique, cells: Cell[], explanation: string }

---

## Step 2: Sudoku Generator Implementation

### 2.1 Create Base Grid Generator
**File:** `src/core/generator/SudokuGenerator.ts`

**Step 2.1.1: Initialize Empty Grid**
- Create 9x9 array filled with zeros
- Export as function `createEmptyGrid()`

**Step 2.1.2: Implement Backtracking Algorithm**
- Function `generateFullGrid(grid: SudokuGrid): SudokuGrid`
- Fill grid cell by cell using recursive backtracking
- Randomize numbers 1-9 for each attempt
- Validate placement against row, column, and 3x3 box

**Step 2.1.3: Box Validation Utility**
- Function `isValidPlacement(grid, row, col, num): boolean`
- Check row uniqueness
- Check column uniqueness
- Check 3x3 box uniqueness

### 2.2 Implement digging Algorithm
**File:** `src/core/generator/digger.ts`

**Step 2.2.1: Symmetric Cell Removal**
- Function `digHoles(grid: SudokuGrid, holes: number): SudokuGrid`
- Implement 180° rotational symmetry
- For cell (r, c), also remove (8-r, 8-c)
- Store removed cell positions

**Step 2.2.2: Brute-Force Solver**
- Function `hasUniqueSolution(grid: SudokuGrid): boolean`
- Use simple backtracking to count solutions
- Return false if >1 solution found
- Return true if exactly 1 solution

**Step 2.2.3: Iterative Digging**
- Function `generateEmptyCells(grid: SudokuGrid, targetCells: number): SudokuGrid`
- Attempt to remove N cells symmetrically
- After each removal, verify uniqueness
- If multiple solutions, revert and try different cells
- Stop when target holes reached or max attempts exhausted

### 2.3 Difficulty Grading
**File:** `src/core/generator/grader.ts`

**Step 2.3.1: Integrate with Solver**
- Import LogicSolver (from Step 3)
- Function `gradePuzzle(grid: SudokuGrid): Difficulty`
- Run solver to find required techniques
- Map techniques to difficulty levels:
  - Easy: Last Free Cell only
  - Medium: Add Hidden Singles, Cross-Hatching
  - Hard: Add Locked, Naked/Hidden Pairs, Triples
  - Expert: Plus Skyscraper, XY-Wing, BUG+1

**Step 2.3.2: Main Generator Function**
- Function `generatePuzzle(difficulty: Difficulty): { grid: SudokuGrid, solution: SudokuGrid }`
- Chain: Create → Solve → Dig → Verify → Grade
- Regenerate if difficulty doesn't match target

---

## Step 3: Logic Engine / Solver Implementation

### 3.1 Create Solver Core
**File:** `src/core/solver/SudokuSolver.ts`

**Step 3.1.1 Candidate Tracking**
- Initialize `candidates` structure: 9x9 array of bitsets (1-9)
- Function `updateCandidates(grid, row, col): void`
- Remove digit from all peers (row, col, box)

**Step 3.1.2 Technique Enum**
```typescript
enum Technique {
  UNIQUE_SOLUTION = 'unique_solution',
  LAST_FREE_CELL = 'last_free_cell',
  HIDDEN_SINGLE = 'hidden_single',
  CROSS_HATCHING = 'cross_hatching',
  LOCKED_POINTING = 'locked_pointing',
  LOCKED_CLAIMING = 'locked_claiming',
  NAKED_PAIR = 'naked_pair',
  HIDDEN_PAIR = 'hidden_pair',
  NAKED_TRIPLE = 'naked_triple',
  HIDDEN_TRIPLE = 'hidden_triple',
  SKYSCRAPER = 'skyscraper',
  XY_WING = 'xy_wing',
  BUG_PLUS_ONE = 'bug_plus_one'
}
```

### 3.2 Basic Techniques (Tiers 1-3)

**Step 3.2.1: Last Free Cell**
- Function `solveLastFreeCell(grid, candidates): Hint | null`
- Scan all rows, columns, boxes
- Find unit with exactly 8 filled cells
- Return hint with remaining digit

**Step 3.2.2: Hidden Single**
- Function `solveHiddenSingle(grid, candidates): Hint | null`
- For each digit 1-9:
  - In each unit (row/col/box), find cells where digit can go
  - If exactly 1 cell possible, that's a hidden single
- Return hint with cell and digit

**Step 3.2.3: Cross-Hatching**
- Function `solveCrossHatching(grid, candidates): Hint | null`
- Visual helper for hidden singles
- Highlight rows, columns, boxes intersecting
- Return visual hints (not an actual solving technique)

### 3.3 Intersection Techniques (Tiers 4-6)

**Step 3.3.1: Locked Pointing**
- Function `solveLockedPointing(grid, candidates): Hint | null`
- For each box and digit:
  - Find all cells in box with this candidate
  - If all are in same row or column → locked
  - Remove digit from rest of that row/column
- Return hint with cells to eliminate

**Step 3.3.2: Locked Claiming**
- Function `solveLockedClaiming(grid, candidates): Hint | null`
- For each row/col and digit:
  - Find all cells in row/col with this candidate
  - If all are in same box → locked
  - Remove digit from rest of box
- Return hint with cells to eliminate

### 3.4 Subset Techniques (Tiers 7-10)

**Step 3.4.1: Naked Pair**
- Function `solveNakedPair(grid, candidates): Hint | null`
- In each unit, find 2 cells with exactly same 2 candidates
- These digits cannot be elsewhere in unit
- Remove from other cells
- Return hint with elimination cells

**Step 3.4.2: Hidden Pair**
- Function `solveHiddenPair(grid, candidates): Hint | null`
- In each unit, find 2 digits appearing in only 2 cells
- Those cells can only have these 2 digits
- Remove other candidates from these cells
- Return hint

**Step 3.4.3: Naked Triple**
- Function `solveNakedTriple(grid, candidates): Hint | null`
- In each unit, find 3 cells with exactly 3 candidates combined
- Remove these digits from other cells
- Return hint

**Step 3.4.4: Hidden Triple**
- Function `solveHiddenTriple(grid, candidates): Hint | null`
- In each unit, find 3 digits appearing in only 3 cells
- Remove other candidates from these cells
- Return hint

### 3.5 Advanced Techniques (Tiers 11-12)

**Step 3.5.1: Skyscraper**
- Function `solveSkyscraper(grid, candidates): Hint | null`
- Find two rows with same digit in exactly 2 columns
- Find columns' intersections
- If elimination possible in base columns → skyscraper
- Return hint with eliminated cells

**Step 3.5.2: XY-Wing**
- Function `solveXYWing(grid, candidates): Hint | null`
- Find pivot cell with exactly 2 candidates (A, B)
- Find wing cells sharing A and B respectively
- If wings intersect at cells with both candidates
- Eliminate common candidate from intersection
- Return hint

### 3.6 Uniqueness Technique (Tier 13)

**Step 3.6.1: BUG + 1**
- Function `solveBUGPlusOne(grid, candidates): Hint | null`
- Bi-Value Universal Grave detection
- Find grid where all cells have ≤2 candidates except one
- The over-filled cell must resolve
- Return hint with tri-value cell solution

### 3.7 Main Solver Function

**Step 3.7.1: Auto-Solver**
- Function `solve(grid: SudokuGrid): { solution: SudokuGrid, techniques: Technique[] }`
- Run techniques in order (Tiers 1-13)
- Apply found moves
- Continue until solved or stuck
- Return solution and technique history

**Step 3.7.2: Smart Hint Generator**
- Function `getNextHint(grid: SudokuGrid, cell?: Cell): Hint | null`
- Run techniques in order
- Return first applicable hint
- If cell specified, prioritize moves affecting that cell

---

## Step 4: Testing Strategy

### 4.1 Test File Structure
```
tests/
├── core/
│   ├── generator.test.ts
│   ├── solver.test.ts
│   └── integration.test.ts
```

### 4.2 Write Unit Tests

**File:** `tests/core/generator.test.ts`

Test Cases:
- `generateFullGrid()` creates valid Sudoku
- `isValidPlacement()` correctly validates cells
- `digHoles()` maintains symmetry
- `hasUniqueSolution()` detects multiple solutions
- `gradePuzzle()` correctly classifies difficulties
- `generatePuzzle()` produces puzzles matching requested difficulty

**File:** `tests/core/solver.test.ts`

Test Cases:
- Each technique finds correct hints in known puzzles
- Solver solves easy puzzles using only basic techniques
- XY-Wing detection on crafted XY-Wing puzzle
- BUG+1 detection on BUG pattern puzzle

### 4.3 Write Integration Tests

**File:** `tests/core/integration.test.ts`

Test Cases:
- Full pipeline: generate → solve → verify solution
- Expert puzzle requires ≥1 advanced technique
- 100 generated puzzles all have unique solutions

---

## Step 5: Verification Checklist

### 5.1 Code Quality
- [ ] All files have TypeScript strict mode enabled
- [ ] No `any` types used
- [ ] Clear JSDoc comments on all public functions
- [ ] Error handling with descriptive messages

### 5.2 Testing
- [ ] Unit tests pass (npm test)
- [ ] Code coverage ≥80%
- [ ] Performance: Generate puzzle <100ms
- [ ] Performance: Solve puzzle <500ms

### 5.3 Documentation
- [ ] README in `src/core/` explaining architecture
- [ ] Technique reference guide in `docs/`
- [ ] API documentation generated (TypeDoc)

---

## Deliverables for Phase 1

1. **Core Logic Module**
   - Sudoku generator with difficulty grading
   - Logic solver with 13 techniques
   - Type definitions

2. **Test Suite**
   - Unit tests for all modules
   - Integration tests for full pipeline
   - 100+ test cases

3. **Documentation**
   - Architecture diagrams
   - Technique reference
   - API documentation

---

## Estimated Timeline
- Step 1 (Setup): 2 hours
- Step 2 (Generator): 6 hours
- Step 3 (Solver): 16 hours
- Step 4 (Testing): 8 hours
- Step 5 (Verification): 2 hours

**Total: ~34 hours (4-5 days)**

---

## Next Phase
After completing Phase 1:
1. All game logic is testable in isolation
2. UI can use these modules directly
3. Ready for Phase 2: Native Bridge & Input