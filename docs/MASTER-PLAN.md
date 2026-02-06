# Master Implementation Plan - Newsprint Sudoku

## Project Overview

**Newsprint Sudoku** is a premium iPad-first puzzle game featuring:
- Hyper-realistic "Sunday Newspaper" aesthetic
- Apple Pencil handwriting recognition via Vision Framework
- 13-technique Logic Engine for smart hints
- Dual input modes (Solve vs. Note)
- 3-lives game system

**Tech Stack:**
- React Native (Expo Managed)
- TypeScript
- @shopify/react-native-skia
- react-native-mmkv
- Zustand
- Apple Vision Framework

---

## Implementation Phases

The project is divided into **4 sequential phases**, each building upon the previous:

| Phase | Focus | Duration | Status |
|-------|-------|----------|--------|
| **Phase 1** | Logic Core (Pure TypeScript) | 34 hours (4-5 days) | ⏳ Pending |
| **Phase 2** | Native Bridge & Input | 50 hours (6-7 days) | ⏳ Pending |
| **Phase 3** | Game Loop & Cell Logic | 44 hours (5-6 days) | ⏳ Pending |
| **Phase 4** | Polish (Visuals, Animations) | 54 hours (6-7 days) | ⏳ Pending |
| **Total** | | **182 hours (22-25 days)** | |

---

## Phase 1: Logic Core Implementation

**Goal:** Build the pure TypeScript game logic, puzzle generator, and logic solver.

### Key Components:
1. **SudokuGenerator.ts** - Puzzle generation algorithm
   - Backtracking for full grid
   - Symmetric digging
   - Unique solution verification
   - Difficulty grading

2. **SudokuSolver.ts** - 13-technique logic engine
   - Basic: Last Free Cell, Hidden Single, Cross-Hatching
   - Intersections: Locked Pointing, Locked Claiming
   - Subsets: Naked/Hidden Pairs & Triples
   - Advanced: Skyscraper, XY-Wing
   - Uniqueness: BUG+1

3. **Type Definitions** - TypeScript interfaces
   - Sudoku grid, cells, difficulty enum
   - Technique types, hint structure

### Deliverables:
- ✓ Fully functional puzzle generator
- ✓ Logic solver with 13 techniques
- ✓ Comprehensive test suite (100+ tests)
- ✓ Architecture documentation

### Success Criteria:
- Generate valid puzzles <100ms
- Solve puzzles <500ms
- 100% technique detection accuracy
- Test coverage ≥80%

---

## Phase 2: Native Bridge & Input

**Goal:** Setup iOS native modules for handwriting recognition and create the Skia drawing canvas.

### Key Components:
1. **Native iOS Module**
   - Swift VisionOCR module
   - Apple Vision Framework integration
   - Digit recognition (1-9 only)
   - Confidence scoring

2. **Expo Config Plugin**
   - Native code injection
   - Framework dependencies
   - Build configuration

3. **Skia Drawing Canvas**
   - High-performance path rendering (60fps)
   - Touch handling (draw, tap, long press)
   - Path smoothing
   - Path-to-image conversion

4. **Input System**
   - DrawingCanvas component
   - Handwriting recognition pipeline
   - Ink Chooser UI for low confidence
   - Virtual keypad for touch users

5. **Input Modes**
   - Solve Mode (pen icon)
   - Note Mode (pencil icon)
   - Mode switching logic

### Deliverables:
- ✓ Vision OCR native module
- ✓ Skia drawing canvas
- ✓ Handwriting recognition (90%+ accuracy)
- ✓ Dual input mode system
- ✓ Virtual keypad

### Success Criteria:
- OCR recognition accuracy >90%
- Recognition response <500ms
- Drawing maintains 60fps
- Both input modes functional

---

## Phase 3: Game Loop & Cell Logic

**Goal:** Implement the game state management, persistence, 3x3 notes rendering, and core game loop.

### Key Components:
1. **Zustand Store** (`gameStore.ts`)
   - Complete game state
   - 15+ actions (placeDigit, toggleCandidate, undo, etc.)
   - Game initialization and resume

2. **Cell Data Structure**
   ```typescript
   interface Cell {
     value: number | null;      // Solve digit
     notes: number[];           // Note candidates
     isGiven: boolean;          // Locked cell
     isError: boolean;          // Visual error
     isSelected: boolean;       // Selection highlight
   }
   ```

3. **MMKV Persistence**
   - Auto-save on every move
   - Resume game functionality
   - Settings storage

4. **Cell Rendering**
   - Cell component with background
   - Solve digit (60% height)
   - 3x3 notes subgrid (20% height)
   - Selection and error states

5. **Game Loop**
   - 3-lives system
   - Timer (MM:SS format)
   - Game over detection
   - Completion detection
   - Auto-clear peers

6. **Tools**
   - Undo/Redo with history stack
   - Eraser (clear cell or specific note)
   - Auto-Note (generate candidates)

### Deliverables:
- ✓ Zustand game store
- ✓ MMKV persistence
- ✓ Cell rendering for both modes
- ✓ Complete game loop
- ✓ Undo/Redo system

### Success Criteria:
- State persists correctly
- Lives decrement accurately
- Timer updates smoothly
- 3x3 notes layout is correct

---

## Phase 4: Polish - Visual Effects

**Goal:** Add the visual polish that makes Newsprint Sudoku stand out.

### Key Components:
1. **Skia Shaders**
   - Paper texture (noise + vignette)
   - Ink bleed effect
   - Runtime shader compilation

2. **React Native Reanimated Animations**
   - Cell selection animation
   - Mistake shake effect
   - Victory flash
   - Mode switch transition

3. **Responsive Layout**
   - Portrait layout (bottom controls)
   - Landscape layout (sidebar controls)
   - Adaptive layout router
   - Grid scaling

4. **Audio Feedback**
   - Digit place sound
   - Error sound
   - Victory fanfare
   - Page turn sound

5. **Haptic Feedback**
   - Light tap for digit entry
   - Medium for mode switch
   - Heavy for error
   - Success for victory

6. **UI Polish**
   - Main menu (newspaper header style)
   - Victory modal (headline style)
   - Styled button components
   - Difficulty selector

7. **Performance Optimization**
   - Memoized cell components
   - Worklet-based calculations
   - Selective state subscriptions
   - 60fps target

### Deliverables:
- ✓ Paper texture shader
- ✓ 4 animation types
- ✓ Responsive layouts
- ✓ 4 sound effects
- ✓ Haptic feedback
- ✓ Main menu & victory screens

### Success Criteria:
- Stable 60fps
- No memory leaks
- Smooth transitions
- Audio synced with actions

---

## Implementation Order

### Week 1: Phase 1 (Logic Core)
- Days 1-2: Setup, types, generator
- Days 3-4: Logic solver with 13 techniques
- Day 5: Testing and verification

### Week 2: Phase 2 (Native Bridge)
- Days 1-2: Expo config, native module
- Days 3-4: Skia drawing canvas
- Days 5-6: Recognition integration and testing
- Day 7: Buffer and verification

### Week 3: Phase 3 (Game Loop)
- Days 1-2: Zustand store and actions
- Days 3-4: Persistence and cell rendering
- Days 5-6: Game loop and tools
- Day 7: Testing and verification

### Week 4: Phase 4 (Polish)
- Days 1-2: Shaders and effects
- Days 3-4: Animations and feedback
- Days 5-6: Responsive layout and UI
- Day 7: Performance optimization

### Week 5: Final Polish & Launch
- Days 1-2: End-to-end testing
- Days 3-4: Bug fixes and refinements
- Days 5: App Store preparation
- Day 6: TestFlight beta
- Day 7: Final review

---

## Dependencies & Prerequisites

### Development Environment
- [ ] Node.js 18+
- [ ] Bun or NPM
- [ ] Expo CLI
- [ ] Xcode 15+
- [ ] iOS Simulator or iPad
- [ ] Apple Pencil (for testing)

### Required Packages
```json
{
  "core": {
    "typescript": "~5.9.2",
    "react": "19.1.0",
    "react-native": "0.81.5",
    "expo": "~54.0"
  },
  "rendering": {
    "@shopify/react-native-skia": "latest"
  },
  "state": {
    "zustand": "latest",
    "react-native-mmkv": "latest"
  },
  "input": {
    "react-native-gesture-handler": "~2.28.0",
    "react-native-reanimated": "4.1.1"
  },
  "feedback": {
    "expo-haptics": "~15.0.8",
    "expo-av": "latest"
  }
}
```

### External Services
- **Supabase** - Auth, leaderboards, daily puzzles (optional, Phase 1 can use local)

---

## Testing Strategy

### Test Coverage
| Component | Test Type | Coverage Goal | Status |
|-----------|-----------|---------------|--------|
| Logic Core | Unit Tests | 90% | ⏳ Pending |
| Generatior | Integration Tests | 85% | ⏳ Pending |
| Native Bridge | Unit Tests | 70% | ⏳ Pending |
| Drawing | Manual Testing | N/A | ⏳ Pending |
| Game Store | Unit Tests | 85% | ⏳ Pending |
| Persistence | Integration Tests | 90% | ⏳ Pending |
| Animations | Visual Tests | N/A | ⏳ Pending |
| Overall | | ≥80% | ⏳ Pending |

### Key Test Cases
- ✓ 100 random puzzles have unique solutions
- ✓ XY-Wing puzzle requires XY-Wing technique
- ✓ OCR recognizes digits 1-9 with >90% accuracy
- ✓ Lives decrement correctly on mistakes
- ✓ Game over triggers at 0 lives
- ✓ State persists after app restart
- ✓ Undo/Redo maintains correct history
- ✓ 3x3 notes layout matches specification
- ✓ Animations run at 60fps
- ✓ Audio plays at correct moments

---

## Milestones & Sign-Off

### Phase 1 Sign-Off Criteria
- [ ] Generator creates valid puzzles
- [ ] Solver implements all 13 techniques
- [ ] Difficulty grading is accurate
- [ ] Test suite passes (100+ tests)
- [ ] Performance meets targets

### Phase 2 Sign-Off Criteria
- [ ] Native module compiles
- [ ] OCR recognizes digits correctly
- [ ] Drawing is smooth (60fps)
- [ ] Ink Chooser appears when confidence low
- [ ] Both input modes work

### Phase 3 Sign-Off Criteria
- [ ] Game state persists
- [ ] Lives system works
- [ ] Timer updates correctly
- [ ] Cell rendering matches spec
- [ ] 3x3 notes layout is correct
- [ ] Undo/Redo works

### Phase 4 Sign-Off Criteria
- [ ] Paper texture renders
- [ ] All animations are smooth
- [ ] Both layouts work (portrait/landscape)
- [ ] Audio and haptics work
- [ ] Performance is optimized (60fps)

---

## Risk Mitigation

### High-Risk Areas
1. **Vision OCR Accuracy**
   - **Risk**: Low recognition accuracy
   - **Mitigation**: Implement Ink Chooser fallback, extensive testing with different handwriting styles

2. **Skia Performance**
   - **Risk**: Dropping below 60fps
   - **Mitigation**: Use memoization, worklets, optimize path rendering

3. **Sync Complexity**
   - **Risk**: State sync issues between store, storage, and UI
   - **Mitigation**: Single source of truth, immutable patterns, comprehensive testing

4. **Native Module Build**
   - **Risk**: Build failures after iOS updates
   - **Mitigation**: Use Expo Config Plugins, version pinning, CI/CD testing

### Contingency Plans
- If Vision OCR doesn't meet accuracy: Add on-screen number picker
- If Skia performance degrades: Reduce path complexity, use bitmap caching
- If Supabase sync fails: Use full offline-first approach

---

## Success Metrics

### Technical Metrics
- [ ] 60fps rendering (no drops)
- [ ] <500ms OCR recognition
- [ ] <100ms puzzle generation
- [ ] <500ms puzzle solving
- [ ] 90%+ OCR accuracy
- [ ] 0 crashes in testing
- [ ] <5mb app size (excluding assets)

### User Experience Metrics (Post-Launch)
- [ ] >3 minutes average session
- [ ] <2 second app startup
- [ ] >4/5 star rating
- [ ] <10% crash rate
- [ ] >70% puzzle completion rate

---

## Resources & References

### Documentation
- Phase 1 Details: `docs/PHASE1-LOGIC-CORE-PLAN.md`
- Phase 2 Details: `docs/PHASE2-NATIVE-BRIDGE-PLAN.md`
- Phase 3 Details: `docs/PHASE3-GAME-LOOP-PLAN.md`
- Phase 4 Details: `docs/PHASE4-POLISH-PLAN.md`
- Product Requirements: `docs/PRD.md`

### External References
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- Skia: https://shopify.github.io/react-native-skia/
- Apple Vision: https://developer.apple.com/documentation/vision
- Sudoku Techniques: http://www.sudokuwiki.org/sudoku_guide.htm

---

## Next Steps

1. **Setup Development Environment**
   ```bash
   # Verify tools
   node --version  # Should be 18+
   xcodebuild -version  # Should be 15+
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # Or
   bun install
   ```

3. **Start Phase 1**
   - Create directory structure
   - Implement type definitions
   - Build SudokuGenerator
   - Implement SudokuSolver
   - Write tests

4. **Track Progress**
   - Update this document with completed items
   - Mark milestones as complete
   - Log blockers and resolutions

---

## Contact & Support

For questions or blockers during implementation:
1. Review detailed phase plans
2. Check PRD for specifications
3. Consult external documentation links
4. Log issue with detailed reproduction steps

---

**Version:** 1.0
**Last Updated:** 2025-02-06
**Status:** Planning Complete - Ready to Start Phase 1