# Phase 3.1: Advanced Features Implementation Plan

## Overview

This phase extends the core game loop with 5 advanced features that enhance gameplay and teaching capabilities.

**Duration Estimate:** 40-50 hours

---

## Implementation Order (Dependency-Resolved)

The features must be implemented in this order to avoid conflicts:

```
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Foundation                                              │
│  ├── 1A. Quick Notes (2h) - UI only, store exists               │
│  └── 1B. Fast Solve Mode (4h) - Independent UI/state            │
├─────────────────────────────────────────────────────────────────┤
│  Step 2: Input Extension                                         │
│  └── 2A. Handwriting Integration (8h) - Independent             │
├─────────────────────────────────────────────────────────────────┤
│  Step 3: Solver Expansion (PREREQUISITE for Steps 4-5)          │
│  └── 3A. Implement 13 Techniques in Solver (16h)                │
├─────────────────────────────────────────────────────────────────┤
│  Step 4: Analysis & Hints                                        │
│  ├── 4A. Technique Detector (6h) - Depends on Step 3            │
│  └── 4B. Interactive Hints (8h) - Depends on Steps 3 & 4A       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1A: Quick Notes (Auto-Fill)

**Goal:** One-tap button to fill all empty cells with all valid candidates.

**Files to Modify:**

- `app/game/index.tsx` - Add button to UI

**Files Already Complete:**

- `src/store/GameStore.ts` - `autoFillNotes()` action exists ✅

**Implementation:**

```tsx
// In game screen actions section
<Pressable onPress={() => autoFillNotes()}>
  <Text>📝 Auto Notes</Text>
</Pressable>
```

**Time:** 2 hours

---

## Step 1B: Fast Solve Mode

**Goal:** Select a digit first, then tap cells to fill that digit.

**State Changes:**

| File           | Property                   | Type             |
| -------------- | -------------------------- | ---------------- |
| `GameStore.ts` | `fastSolveDigit`           | `number \| null` |
| `GameStore.ts` | `setFastSolveDigit(digit)` | action           |

**UI Changes:**

| Component    | Behavior                                                       |
| ------------ | -------------------------------------------------------------- |
| `Keypad.tsx` | Long-press digit = toggle fast solve for that digit            |
| `Keypad.tsx` | Highlight active fast-solve digit                              |
| `Cell.tsx`   | On tap: if fast-solve active, place digit instead of selecting |

**Logic Flow:**

1. User long-presses "5" on keypad → `setFastSolveDigit(5)`
2. "5" key glows/highlights
3. User taps empty cells → each gets value "5" (validated)
4. Tap "5" again to deactivate OR tap different digit to switch

**Time:** 4 hours

---

## Step 2A: Handwriting Integration

**Goal:** Allow drawing directly on selected cell to input digits.

**Prerequisites:**

- ✅ `DrawingCanvas` component exists
- ✅ `recognizeDigit()` function exists

**New Components:**

| File                     | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `CellDrawingOverlay.tsx` | Floating canvas that appears over selected cell |

**State Changes:**

| File           | Property              | Type      |
| -------------- | --------------------- | --------- |
| `GameStore.ts` | `isDrawingMode`       | `boolean` |
| `GameStore.ts` | `toggleDrawingMode()` | action    |

**UI Flow:**

1. User enables drawing mode via toggle
2. When cell is selected, overlay appears
3. User draws digit
4. On stroke complete → OCR → validate → place
5. If low confidence → show InkChooser

**Special Considerations:**

- Overlay must be positioned relative to cell
- Must handle both stylus and finger input
- Respect current input mode (solve vs note)

**Time:** 8 hours

---

## Step 3A: Expand Solver to 13 Techniques

**Goal:** Implement all 13 solving techniques for hint generation and technique tracking.

**Current State:**

- ✅ Tier 2: Last Free Cell (via findNakedSingles)
- ✅ Tier 3: Hidden Single

**To Implement:**

| Tier | Technique                 | Complexity          |
| ---- | ------------------------- | ------------------- |
| 1    | Unique Solution Validator | Low                 |
| 4    | Cross-Hatching            | Low (visual helper) |
| 5    | Locked (Pointing)         | Medium              |
| 6    | Locked (Claiming)         | Medium              |
| 7    | Naked Pair                | Medium              |
| 8    | Hidden Pair               | Medium              |
| 9    | Naked Triple              | High                |
| 10   | Hidden Triple             | High                |
| 11   | Skyscraper                | High                |
| 12   | XY-Wing                   | High                |
| 13   | BUG+1                     | High                |

**New Files:**

| File                                      | Purpose                                   |
| ----------------------------------------- | ----------------------------------------- |
| `src/core/techniques/index.ts`            | Barrel export                             |
| `src/core/techniques/types.ts`            | Technique enum, TechniqueResult interface |
| `src/core/techniques/NakedPair.ts`        | Naked Pair implementation                 |
| `src/core/techniques/HiddenPair.ts`       | Hidden Pair implementation                |
| `src/core/techniques/LockedCandidates.ts` | Pointing/Claiming                         |
| `src/core/techniques/Subsets.ts`          | Triples                                   |
| `src/core/techniques/Wings.ts`            | Skyscraper, XY-Wing                       |
| `src/core/techniques/Uniqueness.ts`       | BUG+1                                     |

**Technique Interface:**

```typescript
interface TechniqueResult {
  technique: Technique;
  affectedCells: { row: number; col: number }[];
  eliminatedCandidates?: { row: number; col: number; values: number[] }[];
  placedValue?: { row: number; col: number; value: number };
  explanation: string;
}

interface TechniqueFunction {
  (grid: SudokuCell[][]): TechniqueResult | null;
}
```

**Time:** 16 hours

---

## Step 4A: Technique Detector

**Goal:** When player places a correct digit, detect which technique they used.

**Dependencies:** Step 3A (full technique implementations)

**New Files:**

| File                            | Purpose                          |
| ------------------------------- | -------------------------------- |
| `src/core/TechniqueDetector.ts` | Analyze move to detect technique |

**State Changes:**

| File           | Property      | Type                                    |
| -------------- | ------------- | --------------------------------------- |
| `GameStore.ts` | `moveHistory` | `MoveRecord[]`                          |
| `types.ts`     | `MoveRecord`  | `{ cell, value, technique, timestamp }` |

**Detection Algorithm:**

1. On correct `setCellValue`:
2. Create snapshot of grid BEFORE move
3. Run all techniques on snapshot
4. Find which technique(s) would solve this cell
5. Record the simplest technique that applies

**Time:** 6 hours

---

## Step 4B: Interactive Hints

**Goal:** Show step-by-step visual guidance instead of just revealing answer.

**Dependencies:** Steps 3A + 4A

**New Types:**

```typescript
interface HintStep {
  type: 'highlight' | 'showNote' | 'removeNote' | 'message' | 'solution';
  cells: { row: number; col: number }[];
  values?: number[];
  message?: string;
}

interface Hint {
  technique: Technique;
  steps: HintStep[];
  solution?: { row: number; col: number; value: number };
}
```

**New Files:**

| File                                | Purpose                    |
| ----------------------------------- | -------------------------- |
| `src/core/HintGenerator.ts`         | Creates step-by-step hints |
| `src/ui/components/HintOverlay.tsx` | Visual overlay for hints   |
| `src/ui/components/HintStepper.tsx` | Step navigation UI         |

**UI Flow:**

1. User taps "💡 Hint" button
2. `HintGenerator.generate(grid)` → returns `Hint`
3. Hint stepper appears at bottom
4. Each step shows:
   - Highlighted cells
   - Explanation text
   - "Next" / "Apply" buttons
5. User learns technique AND can apply solution

**Example: Hidden Single Hint**

```
Step 1: "Look at column 5"
        → Highlight column 5

Step 2: "The digit 7 can only go in one cell"
        → Highlight cells where 7 is a candidate
        → Flash the only valid cell

Step 3: "Place 7 here"
        → Offer "Apply" button
```

**Time:** 8 hours

---

## File Summary

### Modified Files

| File              | Changes                                                     |
| ----------------- | ----------------------------------------------------------- |
| `GameStore.ts`    | New state: `fastSolveDigit`, `isDrawingMode`, `moveHistory` |
| `Keypad.tsx`      | Fast solve digit selection (long press)                     |
| `Cell.tsx`        | Fast solve tap handler                                      |
| `game/index.tsx`  | All new UI buttons                                          |
| `SudokuSolver.ts` | Refactor to use technique modules                           |

### New Files

| File                                       | Purpose                      |
| ------------------------------------------ | ---------------------------- |
| `src/core/techniques/*.ts`                 | 11 technique implementations |
| `src/core/TechniqueDetector.ts`            | Move analysis                |
| `src/core/HintGenerator.ts`                | Hint creation                |
| `src/ui/components/CellDrawingOverlay.tsx` | Draw on cell                 |
| `src/ui/components/HintOverlay.tsx`        | Visual hint display          |
| `src/ui/components/HintStepper.tsx`        | Hint navigation              |
| `src/ui/components/FastSolveIndicator.tsx` | Show active digit            |

---

## Testing Strategy

### Unit Tests

| Feature    | Tests                            |
| ---------- | -------------------------------- |
| Fast Solve | Toggle state, cell tap behavior  |
| Techniques | Known puzzles for each technique |
| Detector   | Correct technique identification |
| Hints      | Step generation accuracy         |

### Integration Tests

| Scenario                               | Validation                   |
| -------------------------------------- | ---------------------------- |
| Draw digit → recognized → placed       | End-to-end handwriting       |
| Hint requested → steps shown → applied | Full hint flow               |
| Technique tracking accuracy            | Record vs expected technique |

### Manual Testing

- Apple Pencil drawing on cells
- Step through hints for each technique type
- Verify technique detection matches human intuition

---

## Risks & Mitigations

| Risk                                      | Mitigation                                          |
| ----------------------------------------- | --------------------------------------------------- |
| 13 techniques complex to implement        | Start with common ones (Naked/Hidden Pairs)         |
| Technique detection may be ambiguous      | Record most difficult technique when multiple apply |
| Hint UI could be confusing                | User test with 3+ people before finalizing          |
| Handwriting conflicts with cell selection | Require explicit mode toggle                        |

---

## Success Criteria

- [ ] Quick Notes fills all valid candidates in <100ms
- [ ] Fast Solve mode allows rapid digit entry
- [ ] Drawing on cells recognizes digits >90% accuracy
- [ ] Technique detection is correct >95% of the time
- [ ] Hints correctly teach each of the 13 techniques
- [ ] All features work together without conflicts
