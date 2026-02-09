# Newsprint Sudoku - Master Game Design Document (vFinal)

## 1. Executive Summary

**Newsprint Sudoku** is a premium, iPad-first puzzle game built with **React Native**. It differentiates itself through a hyper-realistic "Sunday Newspaper" aesthetic, high-performance stylus input using **Skia**, and a sophisticated **Logic Engine** that teaches players advanced Sudoku techniques.

**Core Loop:** Solve 9x9 puzzles using Apple Pencil handwriting or touch inputs.
**Win Condition:** Complete the grid correctly.
**Lose Condition:** Exhaust **3 Lives** (Mistakes).
**Key Feature:** Native AI Handwriting Recognition (via Apple Vision), a "Smart Hint" system, and a dual-mode input system (Solve vs. Note).

---

## 2. Technical Stack & Architecture

### 2.1 Core Framework

- **Platform:** iOS (iPadOS target).
- **Framework:** **React Native** (Expo Managed Workflow recommended, with Config Plugins for native code).
- **Language:** TypeScript.

### 2.2 Rendering Engine

- **Library:** **@shopify/react-native-skia**.
- **Usage:**
- **Grid & UI:** Vector-based rendering for crisp lines on Retina screens.
- **Ink:** High-performance path rendering (60fps) for handwriting.
- **Effects:** Custom Runtime Shaders (Perlin Noise) for the "Paper" texture and vignette.

### 2.3 Input & Recognition

- **Touch/Gestures:** `react-native-gesture-handler` (Tap, Long Press) + Skia `useTouchHandler` (Drawing).
- **Handwriting Recognition (OCR):**
- **Pipeline:** Skia Path Bitmap **Native Module** (Swift) **Apple Vision Framework** (`VNRecognizeTextRequest`) String ("1"-"9").
- **Constraint:** Must recognize digits 1-9.
- **Fallback:** If confidence is low, show "Ink Chooser" UI (popover with top 2 candidates).

### 2.4 Data & Storage

- **Local:** `react-native-mmkv` (Synchronous, instant storage for game state).
- **Remote:** **Supabase** (Auth, Leaderboards, Daily Puzzle fetching).
- **Offline Capability:** Fully playable offline; syncs when online.

---

## 3. Game Mechanics & Logic Engine

### 3.1 Puzzle Generation

The app must generate puzzles on-demand (or pre-generate packs) using this algorithm:

1. **Seed:** Generate a full valid 9x9 grid (Backtracking algorithm).
2. **Dig:** Remove numbers symmetrically (maintaining 180° rotational symmetry).
3. **Verify:** Run a Brute-Force Solver after every "dig." If >1 solution exists, the puzzle is invalid (backtrack and try a different hole).
4. **Grade:** Run the **Logical Solver** (see 3.3) to assign difficulty based on the hardest technique required.

### 3.2 Rules & Mistakes (The "3 Lives" System)

- **Standard Sudoku:** Rows, Columns, and 3x3 Boxes must contain digits 1-9 unique.
- **Lives:** Players start with **3 Hearts**.
- **Mistake Definition:** Entering a number in **Solve Mode** that differs from the _pre-calculated solution_.
- **Penalty:** -1 Heart, visual shake, red ink mark.
- **Game Over:** 0 Hearts = "Puzzle Spoiled."

### 3.3 The Logic Engine (Hints & Solver)

The engine must implement these **13 Techniques**. This engine powers the "Smart Hint" system (explaining the next logical move) and "Auto Notes."

| Tier              | Technique                | Logic Requirement                                                         |
| ----------------- | ------------------------ | ------------------------------------------------------------------------- |
| **Basic**         | 1. **Unique Solution**   | Core validator.                                                           |
|                   | 2. **Last Free Cell**    | Identify row/col/box with 8 filled cells.                                 |
|                   | 3. **Hidden Single**     | A number fits in only one cell of a unit.                                 |
| **Intersections** | 4. **Cross-Hatching**    | Visual scan helper for Hidden Singles.                                    |
|                   | 5. **Locked (Pointing)** | Candidate restricted to row/col within a box Remove from rest of row/col. |
|                   | 6. **Locked (Claiming)** | Candidate restricted to a box within a row/col Remove from rest of box.   |
| **Subsets**       | 7. **Naked Pair**        | 2 cells in a unit contain only the same 2 candidates.                     |
|                   | 8. **Hidden Pair**       | 2 candidates appear _only_ in 2 cells of a unit.                          |
|                   | 9. **Naked Triple**      | 3 cells contain subset of 3 candidates.                                   |
|                   | 10. **Hidden Triple**    | 3 candidates appear _only_ in 3 cells.                                    |
| **Advanced**      | 11. **Skyscraper**       | Turbot fish variation on two rows/cols.                                   |
|                   | 12. **XY-Wing**          | Pivot [AB] + Wings [AC]/[BC] eliminates C.                                |
| **Uniqueness**    | 13. **BUG +1**           | Avoid "deadly pattern" (2 solutions) by resolving the tri-value cell.     |

### 3.4 Tools & Input Modes (CRITICAL UPDATE)

The app must support **Two Distinct Input Modes** which determine how data is stored and visualized in the cell.

#### **Mode A: Solve Mode (The "Pen")**

- **Action:** Enters the **Final Solution** for that cell.
- **Visual:** A large, single digit centered in the cell (Ink Color: Blue/Black).
- **Logic:**
- **Immediate Validation:** The moment a digit is recognized/entered, it is checked against the solution.
- **Correct:** The number settles in. Notes in peer Row/Col/Box are automatically cleared.
- **Incorrect:** **-1 Heart**. The number turns Red and shakes. It does _not_ persist (or persists as a "mistake mark" based on settings).

#### **Mode B: Note Mode (The "Pencil")**

- **Action:** Enters **Candidates** (possible answers).
- **Visual:**
- **3x3 Subgrid Layout:** The cell is visually divided into 9 mini-zones.
- **Mapping:** 1=TopLeft, 2=TopCenter, 3=TopRight ... 5=Center ... 9=BottomRight.
- **Style:** Small, grey, handwritten-style digits.
- **Capacity:** A single cell can hold all 9 digits simultaneously.

- **Logic:**
- **No Validation:** User can write anything. No Hearts are lost for wrong notes.
- **Toggle Logic:** If a user writes "5" in Note Mode and "5" already exists as a note, it removes the "5" (toggle on/off).

---

## 4. Visual & Audio Design

### 4.1 "Newsprint" Aesthetic

- **Background:** Procedural noise shader (#F3EBDD base). No static repeating images.
- **Grid:** Dark Grey (#2A2A2A) and Light Grey (#8D8A83) lines.
- **Typography:**
- **Solve Digit:** Large Serif or handwritten ink font (~60% of cell height).
- **Note Digit:** Small Sans-serif or simple pencil stroke (~20% of cell height), positioned strictly in the 3x3 matrix.

- **Animations:**
- **Cell Select:** Soft wash (#CFE1FF).
- **Paper Shake:** On error.
- **Completion:** "Flash" effect and "Newspaper Headline" modal.

---

## 5. UI/UX Flow

### 5.1 Main Menu

- "Daily Puzzle" Stamp.
- Difficulty Selector (Easy / Medium / Hard / Expert).
- "New Game" / "Resume" buttons.

### 5.2 Game Screen

- **Header:** Date, Difficulty, Timer, Hearts (Lives).
- **Center:** The 9x9 Grid (Scales to fit safe area).
- **Footer/Sidebar (Adaptive):**
- **Mode Switcher (Big Buttons):** [ **Solve** (Pen Icon) ] vs [ **Note** (Pencil Icon) ].
- **Input Tools:** Eraser / Undo / Redo.
- **Solvers:** Auto-Note (One-time), Smart Hint.
- **Virtual Keypad:** Numbers 1-9 (for touch users).

---

## 6. Implementation Strategy (For AI Agent)

### Phase 1: Logic Core (Pure TypeScript)

1. Create `SudokuGenerator.ts`: Implement backtracking and digging.
2. Create `SudokuSolver.ts`: Implement the 13 strategies.
3. **Test:** Write Jest tests to verify an XY-Wing puzzle is correctly solved and graded.

### Phase 2: Native Bridge & Input

1. Setup Expo Config Plugin for native iOS code.
2. Create Swift Module: `VisionOCR`.
3. Build the Skia `DrawingCanvas` component.
4. Connect: Draw Swift Console Log ("Recognized: 7").

### Phase 3: The Game Loop & Cell Logic

1. Build the Game Store (Zustand) with MMKV persistence.
2. **Implement Cell Data Structure:**

```typescript
interface Cell {
  value: number | null; // The "Solve" value (1-9)
  notes: number[]; // The "Note" values (e.g. [1, 5, 9])
  isGiven: boolean; // Was this part of the puzzle seed?
  isError: boolean; // For visual feedback
}
```

3. Implement the **3x3 Subgrid Rendering** logic in Skia for the `notes` array.

### Phase 4: Polish

1. Add Skia Shaders (Paper texture).
2. Add Reanimated layouts for Landscape/Portrait handling.
