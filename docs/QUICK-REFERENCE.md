# Quick Reference - Newsprint Sudoku Implementation

## Phase Summaries

### Phase 1: Logic Core (34 hours)
**What:** Pure TypeScript Sudoku generator and solver
**Key Files:**
- `src/core/generator/SudokuGenerator.ts`
- `src/core/solver/SudokuSolver.ts`
- `src/core/types/index.ts`
**Output:** Valid puzzles with difficulty grades + 13-technique solver

### Phase 2: Native Bridge & Input (50 hours)
**What:** iOS Vision OCR + Skia drawing canvas
**Key Files:**
- `ios/VisionOCRModule.swift`
- `plugins/withVisionOCR.ts`
- `src/ui/components/DrawingCanvas.tsx`
- `src/native/VisionOCR.ts`
**Output:** Handwriting recognition with Ink Chooser UI

### Phase 3: Game Loop & Cell Logic (44 hours)
**What:** Zustand store, MMKV persistence, cell rendering
**Key Files:**
- `src/store/gameStore.ts`
- `src/storage/gameStorage.ts`
- `src/ui/components/Cell.tsx`
- `src/ui/components/NotesGrid.tsx`
**Output:** Full game state with undo/redo and save/resume

### Phase 4: Polish (54 hours)
**What:** Visual effects, animations, audio, haptics
**Key Files:**
- `src/ui/shaders/PaperTexture.ts`
- `src/ui/animations/*.tsx`
- `src/ui/layouts/*.tsx`
- `src/audio/SoundManager.ts`
**Output:** 60fps gaming experience with immersion

---

## Direct File Structure

```
newsprint-sudoku/
├── src/
│   ├── core/
│   │   ├── generator/
│   │   │   └── SudokuGenerator.ts
│   │   ├── solver/
│   │   │   └── SudokuSolver.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   ├── native/
│   │   ├── types.ts
│   │   └── VisionOCR.ts
│   ├── store/
│   │   └── gameStore.ts
│   ├── storage/
│   │   └── gameStorage.ts
│   ├── ui/
│   │   ├── components/
│   │   │   ├── Cell.tsx
│   │   │   ├── NotesGrid.tsx
│   │   │   ├── DrawingCanvas.tsx
│   │   │   ├── InputModeSwitcher.tsx
│   │   │   ├── Keypad.tsx
│   │   │   └── Eraser.tsx
│   │   ├── animations/
│   │   │   ├── CellAnimations.tsx
│   │   │   ├── MistakeAnimation.tsx
│   │   │   └── CompletionAnimation.tsx
│   │   ├── shaders/
│   │   │   ├── PaperTexture.ts
│   │   │   └── InkEffect.ts
│   │   └── layouts/
│   │       ├── PortraitLayout.tsx
│   │       └── LandscapeLayout.tsx
│   ├── audio/
│   │   └── SoundManager.ts
│   ├── haptics/
│   │   └── HapticManager.ts
│   └── utils/
│       ├── gridUtils.ts
│       └── noteUtils.ts
├── plugins/
│   └── withVisionOCR.ts
├── ios/
│   ├── VisionOCRModule.swift
│   └── VisionOCRModule.m
├── tests/
│   ├── core/
│   │   ├── generator.test.ts
│   │   ├── solver.test.ts
│   │   └── integration.test.ts
│   ├── native/
│   │   └── ocr.test.ts
│   ├── store/
│   │   └── gameStore.test.ts
│   └── ui/
│       └── cell.test.ts
├── assets/
│   ├── sounds/
│   │   ├── digitPlace.wav
│   │   ├── error.wav
│   │   ├── victory.wav
│   │   └── pageTurn.wav
│   └── fonts/
└── docs/
    ├── PRD.md
    ├── MASTER-PLAN.md
    ├── PHASE1-LOGIC-CORE-PLAN.md
    ├── PHASE2-NATIVE-BRIDGE-PLAN.md
    ├── PHASE3-GAME-LOOP-PLAN.md
    ├── PHASE4-POLISH-PLAN.md
    └── QUICK-REFERENCE.md
```

---

## Key Data Structures

### Cell Interface
```typescript
interface Cell {
  value: number | null;      // Solve digit (1-9) or null
  notes: number[];           // Note candidates [1, 5, 9]
  isGiven: boolean;          // Original puzzle cell
  isError: boolean;          // Visual error state
  isSelected: boolean;       // Cell is selected
}
```

### Game Store State
```typescript
interface GameState {
  puzzle: number[][];        // Initial puzzle
  solution: number[][];      // Pre-calculated solution
  grid: Cell[][];            // Current state (9x9)
  lives: number;             // 0-3
  mistakes: number;          // Total mistakes
  isGameOver: boolean;
  isCompleted: boolean;
  selectedCell: { row, col } | null;
  inputMode: 'SOLVE' | 'NOTE';
  undoStack: GameState[];
  redoStack: GameState[];
  startTime: number | null;
  elapsedTime: number;
  isPaused: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}
```

---

## 13 Logic Techniques (Solver Tiers)

| Tier | Technique | Description |
|------|-----------|-------------|
| 1 | Unique Solution | Core validator |
| 2 | Last Free Cell | Row/col/box with 8 filled |
| 3 | Hidden Single | Digit fits in only 1 cell of unit |
| 4 | Cross-Hatching | Visual helper for hidden singles |
| 5 | Locked (Pointing) | Candidate restricted to row/col in box |
| 6 | Locked (Claiming) | Candidate restricted to box in row/col |
| 7 | Naked Pair | 2 cells with same 2 candidates |
| 8 | Hidden Pair | 2 candidates in only 2 cells |
| 9 | Naked Triple | 3 cells with 3 candidates combined |
| 10 | Hidden Triple | 3 candidates in only 3 cells |
| 11 | Skyscraper | Turbot fish on rows/cols |
| 12 | XY-Wing | Pivot + 2 wings eliminates common digit |
| 13 | BUG+1 | Avoid deadly pattern, resolve tri-value |

---

## Input Modes

### Solve Mode (🖊️ Pen)
- Enters **Final Solution** digit
- Large digit (60% of cell height)
- **Immediate validation**
- Correct: Auto-clear peer notes
- Incorrect: -1 Heart, red shake

### Note Mode (✏️ Pencil)
- Enters **Candidates** (up to 9)
- 3x3 subgrid layout
- Small digits (20% of cell height)
- **No validation** (no hearts lost)
- Toggle on/off

---

## Visual Specifications

### Colors
- Background: `#F3EBDD` (off-white paper)
- Grid Dark: `#2A2A2A`
- Grid Light: `#8D8A83`
- Selection: `#CFE1FF` (soft blue wash)
- Error: `#FF0000` (red ink)
- Notes: `#666666` (grey pencil)

### Typography
- Solve Digit: Serif/handwriting, ~60% cell height
- Note Digit: Sans-serif/pencil stroke, ~20% cell height

---

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Puzzle Generation | <100ms | ⏳ |
| Puzzle Solving | <500ms | ⏳ |
| OCR Recognition | <500ms | ⏳ |
| Rendering | 60fps | ⏳ |
| App Launch | <2s | ⏳ |
| Test Coverage | ≥80% | ⏳ |
| OCR Accuracy | >90% | ⏳ |

---

## Key Components Reference

### DrawingCanvas
- Library: `@shopify/react-native-skia`
- Props: `width`, `height`, `onPathComplete`
- Returns: `SkPath[]`

### VisionOCR
- Platform: iOS only
- Framework: Apple Vision (`VNRecognizeTextRequest`)
- Filter: Digits 1-9 only
- Returns: `OCRResult[] { text, confidence, boundingBox }`

### gameStore (Zustand)
- Actions:
  - `startNewGame(difficulty)`
  - `resumeGame(state)`
  - `selectCell(row, col)`
  - `deselectCell()`
  - `setInputMode(mode)`
  - `placeDigit(row, col, digit)`
  - `toggleCandidate(row, col, digit)`
  - `clearCell(row, col)`
  - `undo()`
  - `redo()`
  - `togglePause()`
  - `updateTimer()`

### MMKV Storage
- Key: `'newsprint-sudoku-game'`
- Methods:
  - `saveGameState(state)`
  - `loadGameState(): GameState | null`
  - `hasSavedGame(): boolean`
  - `clearSavedGame()`

---

## Animation Specs

### Cell Selection
- Effect: Scale up 5% + fade in selection
- Duration: 200ms
- Easing: Spring (damped)

### Mistake (Error)
- Effect: Horizontal shake (left-right-left-right-center)
- Duration: 250ms total
- Distance: ±10px

### Completion
- Effect: Flash overlay with scale (1 → 1.5 → 1)
- Duration: 500ms total
- Content: "🎉 PUZZLE COMPLETE! 🎉"

### Mode Switch
- Effect: Scale up 10% + color transition
- Duration: 200ms
- Active: Dark (#2A2A2A)
- Inactive: Light (#E8E8E8)

---

## Audio & Haptics

### Sound Effects (expo-av)
| Sound | Duration | Timing |
|-------|----------|--------|
| digitPlace | ~100ms | On correct digit entry |
| error | ~200ms | On incorrect digit |
| victory | ~2s | On puzzle completion |
| pageTurn | ~300ms | On page/menu change |

### Haptic Types (expo-haptics)
| Action | Type |
|--------|------|
| Digit place | `Light` impact |
| Mode switch | `Medium` impact |
| Error | `Error` notification |
| Victory | `Success` notification |
| Cell selection | `Selection` |

---

## Development Commands

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android (future)
npm run android

# Run tests
npm test

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Watch mode
npm test --watch

# Coverage report
npm test --coverage

# Specific test file
npm test tests/core/generator.test.ts

# Run tests for one phase
npm test tests/core/
npm test tests/native/
npm test tests/store/
npm test tests/ui/
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b phase1-logic-core

# Commit changes
git add .
git commit -m "feat: implement SudokuGenerator"

# Push to remote
git push origin phase1-logic-core

# Create PR (when ready)
gh pr create --title "Phase 1: Logic Core" --body "..."
```

### Commit Message Format
```
feat: new feature
fix: bug fix
docs: documentation
refactor: code changes
test: adding/updating tests
chore: maintenance
```

---

## Common Patterns

### Immutable State Updates
```typescript
// Correct
set((state) => ({
  grid: cloneGrid(state.grid),
}));

// Incorrect - mutation!
set((state) => {
  state.grid[0][0].value = 1; // Don't do this
  return state;
});
```

### Memoized Components
```typescript
const Cell = React.memo(({ data }: Props) => {
  // Component logic
}, (prev, next) => {
  return prev.data === next.data;
});
```

### Use Shared Values (Reanimated)
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scaleValue }],
  opacity: opacityValue,
}));
```

---

## Troubleshooting

### Vision OCR Not Working
- Check iOS version (requires iOS 13+)
- Verify Vision framework is linked
- Test on real device (not simulator)
- Check permissions (if accessing photos)

### Skia Performance Issues
- Reduce path complexity
- Use `React.memo` on cell components
- Limit number of rendered paths
- Check for memory leaks

### MMKV Persistence Issues
- Verify storage ID matches
- Check encryption key (if used)
- Test save/load cycle
- Clear storage if corrupted

### State Sync Problems
- Use single source of truth (Zustand store)
- Avoid dual state in React components
- Test undo/redo thoroughly
- Check for async race conditions

---

## External Links

- **React Native:** https://reactnative.dev/
- **Expo:** https://docs.expo.dev/
- **Skia:** https://shopify.github.io/react-native-skia/
- **Zustand:** https://zustand-demo.pmnd.rs/
- **Apple Vision:** https://developer.apple.com/documentation/vision
- **Sudoku Techniques:** http://www.sudokuwiki.org/sudoku_guide.htm
- **React Native Reanimated:** https://docs.swmansion.com/react-native-reanimated/

---

**Last Updated:** 2025-02-06
**For detailed plans, see individual phase documents.**