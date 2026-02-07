# Phase 2: Native Bridge & Input Implementation Plan

## Overview

This Phase focuses on setting up the native iOS infrastructure for handwriting recognition using Apple Vision, creating the Skia drawing canvas, and building the input handling pipeline.

---

## Step 1: Expo Configuration & Native Setup

### 1.1 Install Required Dependencies

```bash
npm install @shopify/react-native-skia
npm install react-native-mmkv
npm install zustand
npm install @supabase/supabase-js
```

### 1.2 Create Expo Config Plugin

**File:** `plugins/withVisionOCR.ts`

**Step 1.2.1: Setup Config Plugin Structure**

- Export default function with ExpoConfig type
- Use `withDangerousMod` to modify iOS project
- Target `ios/Podfile` and `ios/PROJECT_NAME/Info.plist`

**Step 1.2.2: Add Native Module Boilerplate**

- Create Swift module bridging to JavaScript
- Add Vision framework dependency
- Configure Expo Config Plugin in `app.json`

**Step 1.2.3: Update app.json**

```json
{
  "plugins": ["./plugins/withVisionOCR"]
}
```

### 1.3 Generate Native iOS Module

**File:** `ios/VisionOCRModule.swift`

**Step 1.3.1: Create Native Module Class**

- Inherit from `NSObject` and `RCTBridgeModule`
- Export with `@objc(VisionOCRModule)`

**Step 1.3.2: Implement Image Processing**

- Function `recognizeTextFromPath(imagePath: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock)`
- Load image from path
- Convert to CGImage

**Step 1.3.3: Setup Vision Framework**

- Initialize `VNRecognizeTextRequest`
- Set recognition languages to ["en-US"]
- Set recognition level: .accurate
- Enable specific character recognition if available

**Step 1.3.4: Process & Filter Results**

- Execute Vision request
- Filter results for digits 1-9 only
- Return confidence scores
- Format: `{ text: string, confidence: number }[]`

### 1.4 Create Bridge File

**File:** `ios/VisionOCRModule.m`

**Step 1.4.1: Expose Module to React Native**

- Import VisionOCRModule
- Use `RCT_EXTERN_MODULE` macro
- Expose methods:
  - `recognizeText:(NSString *)path resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject`

### 1.5 Create TypeScript Types

**File:** `src/native/types.ts`

```typescript
export interface OCRResult {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisionOCR {
  recognizeText(imagePath: string): Promise<OCRResult[]>;
}
```

### 1.6 Create JavaScript Bridge

**File:** `src/native/VisionOCR.ts`

```typescript
import { NativeModules, Platform } from 'react-native';

const { VisionOCRModule } = NativeModules;

export const VisionOCR = {
  async recognizeText(imagePath: string): Promise<OCRResult[]> {
    if (Platform.OS !== 'ios') {
      throw new Error('Vision OCR is only available on iOS');
    }
    return await VisionOCRModule.recognizeText(imagePath);
  },
};
```

### 1.7 Test Native Bridge

**File:** `tests/native/ocr.test.ts`

- Mock native module
- Test promise resolution
- Test error handling
- Test digit filtering

---

## Step 2: Skia Drawing Canvas Component

### 2.1 Setup Skia Foundation

**File:** `src/ui/components/DrawingCanvas.tsx`

**Step 2.1.1: Component Structure**

- Import `Canvas`, `Path`, `Skia`, `useTouchHandler` from `@shopify/react-native-skia`
- Create functional component with typing

**Step 2.1.2: State Management**

- Maintain `paths` array: `{ path: SkPath, color: string, strokeWidth: number }[]`
- Track `currentPath`: SkPath | null
- Setup refs for performance

### 2.2 Implement Touch Handling

**Step 2.2.1: Setup useTouchHandler**

```typescript
const touchHandler = useTouchHandler({
  onStart: (event) => {
    // Start new path at touch position
  },
  onActive: (event) => {
    // Continue path to new position
  },
  onEnd: () => {
    // Finalize path
  },
});
```

**Step 2.2.2: Path Smoothing**

- Implement quadratic curve interpolation
- Reduce jitter from stylus input
- Store smooth version of path

### 2.3 Rendering Logic

**Step 2.3.1: Render Paths**

```jsx
<Canvas style={styles.canvas}>
  {currentPath && (
    <Path
      path={currentPath}
      color={'blue'}
      style="stroke"
      strokeWidth={3}
      strokeCap="round"
      strokeJoin="round"
    />
  )}
  {paths.map((p, index) => (
    <Path
      key={index}
      path={p.path}
      color={p.color}
      style="stroke"
      strokeWidth={p.strokeWidth}
      strokeCap="round"
      strokeJoin="round"
    />
  ))}
</Canvas>
```

**Step 2.3.2: Performance Optimization**

- Use `useSharedValue` for path array
- Batch path updates
- Limit max paths (last N strokes)

---

## Step 3: Path to Image Conversion

### 3.1 Create Path Renderer

**File:** `src/ui/utils/PathToImage.ts`

**Step 3.1.1: Export Skia Canvas to Image**

- Use `makeImageFromView` or snapshot
- Define bounds for cell area
- Convert to PNG/JPEG
- Return file path

**Step 3.1.2: Crop & Optimize**

- Crop to bounding box of digit
- Resize to square (e.g., 64x64 or 128x128)
- Enhance contrast if needed
- Apply thresholding for better OCR

### 3.2 Integrate with OCR

**File:** `src/ui/hooks/useHandwritingRecognition.ts`

```typescript
export const useHandwritingRecognition = () => {
  const recognizeDigit = async (
    paths: SkPath[],
    bounds: Rect
  ): Promise<string | null> => {
    // 1. Convert paths to image
    const imagePath = await pathToImage(paths, bounds);

    // 2. Send to Vision OCR
    const results = await VisionOCR.recognizeText(imagePath);

    // 3. Filter for digits only
    const digits = results.filter((r) => /[1-9]/.test(r.text));

    // 4. Return highest confidence digit
    return digits.sort((a, b) => b.confidence - a.confidence)[0]?.text || null;
  };

  return { recognizeDigit };
};
```

---

## Step 4: Input Modes & Cell Interaction

### 4.1 Create Game Context

**File:** `src/store/GameContext.tsx`

**Step 4.1.1: Define Game State**

```typescript
interface GameState {
  grid: SudokuGrid;
  cells: Cell[][];
  selectedCell: { row: number; col: number } | null;
  inputMode: InputMode.SOLVE | InputMode.NOTE;
  lives: number;
  mistakes: number[];
}

interface Cell {
  value: number | null;
  notes: number[];
  isGiven: boolean;
  isError: boolean;
}
```

**Step 4.1.2: Create Context Provider**

- Use React Context API
- Provider wraps game screen
- Expose state and actions

### 4.2 Implement Cell Selection

**File:** `src/ui/components/Cell.tsx`

**Step 4.2.1: Component Structure**

- Receive cell props (row, col, data)
- Handle tap/long press gestures
- Update selected cell in context

**Step 4.2.2: Visual Feedback**

- Highlight selected cell
- Highlight peers (same row, col, box)
- Animate selection transition

### 4.3 Implement Input Mode Switcher

**File:** `src/ui/components/InputModeSwitcher.tsx`

**Step 4.3.1: Solve Mode Button**

- Icon: Pen/fountain pen
- Color: Blue/Black
- Active state: Darker with glow
- Description: "Enter your answer"

**Step 4.3.2: Note Mode Button**

- Icon: Pencil
- Color: Grey
- Active state: Darker grey
- Description: "Mark candidates"

**Step 4.3.3: Mode Switching Logic**

- Toggle between modes on tap
- Update global input mode in context
- Provide haptic feedback (expo-haptics)

---

## Step 5: Drawing & Recognition Integration

### 5.1 Complete Drawing Flow

**File:** `src/ui/components/InputCanvas.tsx`

**Step 5.1.1: Input Lifecycle**

```typescript
// 1. User starts drawing in cell
// 2. Capture paths within cell bounds
// 3. On stroke end:
//    a. Convert paths to image
//    b. Run OCR recognition
//    c. Get digit result
//    d. Based on input mode:
//       - Solve Mode: Validate & place digit
//       - Note Mode: Toggle/add to candidates
//    e. Clear canvas
```

**Step 5.1.2: Confidence Thresholding**

- If confidence < 70%, show "Ink Chooser" UI
- Display top 2-3 candidates
- Allow user to manually select

**Step 5.1.3: Undo/Redo for Drawing**

- Store drawing history stack
- Undo last stroke while drawing
- Redo capability
- Clear all option

### 5.2 Ink Chooser UI

**File:** `src/ui/components/InkChooser.tsx`

**Step 5.2.1: Popover Display**

- Position near cell
- Show candidate numbers as large buttons
- Dimmed/faded colors for low confidence
- Bright colors for high confidence

**Step 5.2.2: Selection Handler**

- On tap: Apply selected digit
- Trigger solve/note logic
- Dismiss popover

---

## Step 6: Touch Input (Virtual) Support

### 6.1 Create Virtual Keypad

**File:** `src/ui/components/Keypad.tsx`

**Step 6.1.1: 1-9 Number Grid**

- 3x3 grid layout
- Large touch targets
- Clear, legible numbers
- Active state feedback

**Step 6.1.2: Apply Digit Logic**

```typescript
const handleNumberPress = (digit: number) => {
  const { selectedCell, inputMode } = gameState;

  if (!selectedCell) return;

  if (inputMode === InputMode.SOLVE) {
    // Validate and place
    validateAndPlace(selectedCell.row, selectedCell.col, digit);
  } else {
    // Toggle candidate
    toggleCandidate(selectedCell.row, selectedCell.col, digit);
  }
};
```

### 6.2 Create Eraser Tool

**File:** `src/ui/components/Eraser.tsx`

**Step 6.2.1: Erase Cell Content**

- Clear solve value
- Clear all candidates
- Trigger animation

**Step 6.2.2: Partial Erase (Note Mode)**

- Remove specific candidate
- Leave others intact

---

## Step 7: Gesture Handling

### 7.1 Setup Gesture Handler

**File:** `src/ui/gestures/GameGestures.tsx`

**Step 7.1.1: Tap Handling**

- On cell tap: Select cell
- On outside tap: Deselect
- On keypad tap: Apply digit

**Step 7.1.2: Long Press Handling**

- On cell long press: Show context menu
  - Highlight all instances of selected digit
  - Option to clear cell
  - Option to auto-fill candidates

**Step 7.1.3: Swipe Handling (Optional)**

- Swipe to next/previous puzzle
- Swipe to undo/redo

---

## Step 8: Testing Strategy

### 8.1 Unit Tests

**File:** `tests/native/ocr.test.ts`

- Test digit recognition accuracy
- Test confidence filtering
- Test error handling

**File:** `tests/ui/drawing.test.ts`

- Test path capture
- Test path smoothing
- Test image generation

### 8.2 Integration Tests

**File:** `tests/native/integration.test.ts`

- Test full drawing → OCR → digit pipeline
- Test with both modes
- Test edge cases (no digit detected, multiple digits)

### 8.3 Manual Testing Checklist

- [ ] Handwriting recognition works with Apple Pencil
- [ ] Finger drawing also recognized
- [ ] Low-confidence digits show Ink Chooser
- [ ] Switching input mode changes cell behavior
- [ ] Virtual keypad works
- [ ] Erase clears correct data

---

## Step 9: Verification Checklist

### 9.1 Native Bridge

- [ ] Vision OCR module compiles without errors
- [ ] Objective-C to Swift bridging works
- [ ] TypeScript types match native API

### 9.2 Drawing & Recognition

- [ ] Drawing is smooth at 60fps
- [ ] Paths render correctly on Skia canvas
- [ ] Paths convert to clean images
- [ ] OCR recognition accuracy >90% for digits 1-9
- [ ] Recognition completes <500ms

### 9.3 Input Handling

- [ ] Both input modes work as specified
- [ ] Solve mode validates correctly
- [ ] Note mode toggles candidates
- [ ] Ink Chooser displays candidates correctly

---

## Deliverables for Phase 2

1. **Native Infrastructure**
   - Expo Config Plugin for iOS
   - Swift Vision OCR module
   - TypeScript bridge

2. **UI Components**
   - DrawingCanvas with Skia
   - InputModeSwitcher
   - InkChooser
   - Virtual Keypad
   - Eraser tool

3. **Game State Management**
   - GameContext with Zustand
   - Cell selection logic
   - Input mode state

4. **Test Suite**
   - OCR tests
   - Drawing tests
   - Integration tests

---

## Estimated Timeline

- Step 1 (Native Setup): 8 hours
- Step 2 (Drawing Canvas): 6 hours
- Step 3 (Path Conversion): 4 hours
- Step 4 (Input Modes): 6 hours
- Step 5 (Recognition Integration): 8 hours
- Step 6 (Virtual Input): 4 hours
- Step 7 (Gestures): 4 hours
- Step 8 (Testing): 8 hours
- Step 9 (Verification): 2 hours

**Total: ~50 hours (6-7 days)**

---

## Dependencies & Prerequisites

- Xcode 15+
- iOS Simulator or physical iPad
- Apple Pencil (for testing)
- Expo CLI installed
- CocoaPods installed

---

## Next Phase

After completing Phase 2:

1. Input pipeline is fully functional
2. Handwriting recognition is integrated
3. Ready for Phase 3: Game Loop & Cell Logic
