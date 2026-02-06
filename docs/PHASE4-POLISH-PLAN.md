# Phase 4: Polish - Visual Effects & Animations Implementation Plan

## Overview
This Phase focuses on adding the visual polish that makes Newsprint Sudoku stand out: Skia shaders for paper texture, smooth animations using React Native Reanimated, responsive layouts for landscape/portrait, audio feedback, and final UX refinements.

---

## Step 1: Skia Shaders for "Newsprint" Effect

### 1.1 Create Paper Texture Shader
**File:** `src/ui/shaders/PaperTexture.ts`

**Step 1.1.1: Shader Implementation**
```typescript
import { Skia, Shader, RuntimeEffect } from '@shopify/react-native-skia';

const shaderSource = `
uniform vec3 u_resolution;
uniform float u_time;

// Simple Noise Function
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);

  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Paper Grain Effect
float paperGrain(vec2 uv) {
  float grain = noise(uv * 500.0);
  return grain * 0.03; // Subtle grain
}

// Main Shader
vec4 main(vec2 uv) {
  // Base off-white paper color
  vec3 baseColor = vec3(0.95, 0.92, 0.87); // #F3EBDD

  // Add grain
  float grain = paperGrain(uv);

  // Vignette effect
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(uv, center);
  float vignette = 1.0 - smoothstep(0.3, 0.8, dist);

  // Final color
  vec3 finalColor = baseColor + grain;
  finalColor = mix(finalColor * 0.8, finalColor, vignette);

  return vec4(finalColor, 1.0);
}
`;

export const paperTextureEffect = RuntimeEffect.Make(shaderSource);
```

**Step 1.1.2: Shader Component**
```typescript
import { Rect, Shader } from '@shopify/react-native-skia';

interface PaperTextureProps {
  width: number;
  height: number;
}

export const PaperTexture: React.FC<PaperTextureProps> = ({ width, height }) => {
  const uniforms = React.useMemo(() => ({
    u_resolution: [width, height, 1],
    u_time: Date.now() / 1000,
  }), [width, height]);

  return (
    <Shader
      source={paperTextureEffect}
      uniforms={uniforms}
    >
      <Rect x={0} y={0} width={width} height={height} />
    </Shader>
  );
};
```

### 1.2 Create Ink Effect Shader
**File:** `src/ui/shaders/InkEffect.ts`

**Step 1.2.1: Slight Bleed Effect**
```typescript
const inkShaderSource = `
uniform vec3 u_resolution;
uniform sampler2D u_image;

vec4 main(vec2 uv) {
  vec4 color = texture(u_image, uv);

  // Slight spread for ink bleed effect
  vec2 spread = vec2(0.002, 0.002);
  vec4 colorN = texture(u_image, uv + vec2(0.0, -spread.y));
  vec4 colorS = texture(u_image, uv + vec2(0.0, spread.y));
  vec4 colorE = texture(u_image, uv + vec2(spread.x, 0.0));
  vec4 colorW = texture(u_image, uv + vec2(-spread.x, 0.0));

  // Average neighbors for bleed
  vec4 bleed = (colorN + colorS + colorE + colorW) * 0.25;

  // Blend original with bleed
  float bleedAmount = 0.15;
  vec4 finalColor = mix(color, bleed, bleedAmount);

  // Desaturate slightly for ink look
  float luminance = dot(finalColor.rgb, vec3(0.299, 0.587, 0.114));
  finalColor.rgb = mix(finalColor.rgb, vec3(luminance), 0.1);

  return finalColor;
}
`;
```

---

## Step 2: Animations with React Native Reanimated

### 2.1 Cell Selection Animation
**File:** `src/ui/animations/CellAnimations.ts`

**Step 2.1.1: Selection Fade In**
```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface SelectionAnimationProps {
  isSelected: boolean;
  children: React.ReactNode;
}

export const SelectionAnimation: React.FC<SelectionAnimationProps> = ({
  isSelected,
  children,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(isSelected ? 1 : 0);

  // Animate when selection changes
  React.useEffect(() => {
    if (isSelected) {
      scale.value = withSpring(1.05); // Slight scale up
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      scale.value = withSpring(1); // Return to normal
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
```

### 2.2 Mistake Shake Animation
**File:** `src/ui/animations/MistakeAnimation.ts`

**Step 2.2.1: Shake Effect**
```typescript
interface MistakeAnimationProps {
  isError: boolean;
  children: React.ReactNode;
}

export const MistakeAnimation: React.FC<MistakeAnimationProps> = ({
  isError,
  children,
}) => {
  const translateX = useSharedValue(0);

  React.useEffect(() => {
    if (isError) {
      // Shake sequence: left-right-left-center
      translateX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [isError]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
```

### 2.3 Completion Flash Animation
**File:** `src/ui/animations/CompletionAnimation.ts`

**Step 2.3.1: Victory Flash**
```typescript
interface CompletionAnimationProps {
  isCompleted: boolean;
}

export const CompletionAnimation: React.FC<CompletionAnimationProps> = ({
  isCompleted,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  React.useEffect(() => {
    if (isCompleted) {
      opacity.value = withTiming(1, { duration: 100 });
      scale.value = withSequence(
        withTiming(1.5, { duration: 300 }),
        withTiming(1, { duration: 200 })
      );
    } else {
      opacity.value = 0;
      scale.value = 0;
    }
  }, [isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    isCompleted && (
      <Animated.View
        style={[
          styles.flashOverlay,
          animatedStyle,
        ]}
      >
        <Text style={styles.flashText}>🎉 PUZZLE COMPLETE! 🎉</Text>
      </Animated.View>
    )
  );
};
```

### 2.4 Mode Switch Animation
**File:** `src/ui/animations/ModeSwitchAnimation.ts`

**Step 2.4.1: Button Transition**
```typescript
interface ModeButtonProps {
  mode: 'SOLVE' | 'NOTE';
  currentMode: 'SOLVE' | 'NOTE';
  onPress: () => void;
}

export const ModeButton: React.FC<ModeButtonProps> = ({
  mode,
  currentMode,
  onPress,
}) => {
  const isActive = mode === currentMode;
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue(isActive ? '#2A2A2A' : '#E8E8E8');

  React.useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.1);
      backgroundColor.value = withTiming('#2A2A2A', { duration: 200 });
    } else {
      scale.value = withSpring(1);
      backgroundColor.value = withTiming('#E8E8E8', { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  return (
    <AnimatedTouchableOpacity
      style={[styles.button, animatedStyle]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.Text style={styles.buttonText}>
        {mode === 'SOLVE' ? '🖊️ Solve' : '✏️ Note'}
      </Animated.Text>
    </AnimatedTouchableOpacity>
  );
};
```

---

## Step 3: Responsive Layout (Landscape/Portrait)

### 3.1 Create Responsive Grid Component
**File:** `src/ui/components/ResponsiveGrid.tsx`

**Step 3.1.1: Use Screen Dimensions**
```typescript
import { useWindowDimensions } from 'react-native';

export const ResponsiveGrid: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Calculate cell size based on available space
  const headerHeight = 80;
  const footerHeight = isLandscape ? 0 : 200; // Sidebar in landscape
  const padding = 20;

  const availableWidth = width - (padding * 2);
  const availableHeight = height - headerHeight - footerHeight - (padding * 2);

  // Grid is square, use smaller dimension
  const gridSize = Math.min(availableWidth, availableHeight);
  const cellSize = gridSize / 9;

  // Layout based on orientation
  const containerStyle = {
    flexDirection: isLandscape ? 'row' : 'column' as 'row' | 'column',
  };

  //... render grid and controls
};
```

### 3.2 Landscape Layout
**File:** `src/ui/layouts/LandscapeLayout.tsx`

**Step 3.2.1: Sidebar Controls**
```typescript
export const LandscapeLayout: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.gridContainer}>
        <SudokuGrid />
      </View>
      <View style={styles.sidebar}>
        <Timer />
        <LivesDisplay />
        <InputModeSwitcher />
        <Keypad />
        <Tools />
      </View>
    </View>
  );
};
```

### 3.3 Portrait Layout
**File:** `src/ui/layouts/PortraitLayout.tsx`

**Step 3.3.1: Bottom Controls**
```typescript
export const PortraitLayout: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header>
        <Timer />
        <LivesDisplay />
      </Header>
      <SudokuGrid />
      <Footer>
        <InputModeSwitcher />
        <Keypad />
        <Tools />
      </Footer>
    </View>
  );
};
```

### 3.4 Adaptive Layout Router
**File:** `src/ui/layouts/AdaptiveLayout.tsx`

```typescript
export const AdaptiveLayout: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return isLandscape ? <LandscapeLayout /> : <PortraitLayout />;
};
```

---

## Step 4: Audio Feedback

### 4.1 Sound Manager
**File:** `src/audio/SoundManager.ts`

**Step 4.1.1: Setup Expo Audio**
```bash
npm install expo-av
```

```typescript
import { Audio } from 'expo-av';

export class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: Audio.Sound } = {};

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async loadSounds() {
    // Load sound effects
    await this.loadSound('digitPlace', require('../../assets/sounds/digitPlace.wav'));
    await this.loadSound('error', require('../../assets/sounds/error.wav'));
    await this.loadSound('victory', require('../../assets/sounds/victory.wav'));
    await this.loadSound('pageTurn', require('../../assets/sounds/pageTurn.wav'));
  }

  private async loadSound(key: string, source: any) {
    const { sound } = await Audio.Sound.createAsync(source);
    this.sounds[key] = sound;
  }

  async play(key: string) {
    const sound = this.sounds[key];
    if (sound) {
      await sound.replayAsync();
    }
  }

  async stopAll() {
    await Promise.all(
      Object.values(this.sounds).map(sound => sound.stopAsync())
    );
  }
}
```

### 4.2 Audio Triggers
**File:** `src/store/gameStore.ts` (extend actions)

```typescript
import { SoundManager } from '../audio/SoundManager';

// Modify placeDigit to include sound
const placeDigit = (row: number, col: number, digit: number) => {
  set((state) => {
    const correctDigit = state.solution[row][col];

    if (digit === correctDigit) {
      // Correct
      SoundManager.getInstance().play('digitPlace');
      // ... existing logic ...
    } else {
      // Error
      SoundManager.getInstance().play('error');
      // ... existing logic ...
    }
  });
};

// Add completion sound
const checkCompletion = (grid: Cell[][], solution: number[][]): boolean => {
  const isComplete = // ... existing logic ...

  if (isComplete) {
    SoundManager.getInstance().play('victory');
  }

  return isComplete;
};
```

---

## Step 5: Haptic Feedback

### 5.1 Haptic Manager
**File:** `src/haptics/HapticManager.ts`

**Step 5.1.1: Setup Expo Haptics**
```typescript
import * as Haptics from 'expo-haptics';

export const HapticManager = {
  // Light tap for digit entry
  digitPlace: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium for mode switch
  modeSwitch: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy for error
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Success for victory
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Selection vibration
  selection: () => {
    Haptics.selectionAsync();
  },
};
```

### 5.2 Integrate with Actions
**File:** `src/store/gameStore.ts` (extend)

```typescript
import { HapticManager } from '../haptics/HapticManager';

// Add haptics to placeDigit
const placeDigit = (row: number, col: number, digit: number) => {
  // ... existing logic ...

  if (digit === correctDigit) {
    HapticManager.digitPlace();
  } else {
    HapticManager.error();
  }
};

// Add haptics to selectCell
const selectCell = (row: number, col: number) => {
  HapticManager.selection();
  // ... existing logic ...
};

// Add haptics to setInputMode
const setInputMode = (mode: InputMode) => {
  HapticManager.modeSwitch();
  // ... existing logic ...
};
```

---

## Step 6: UI Polish

### 6.1 Main Menu Design
**File:** `src/ui/screens/MainMenu.tsx`

**Step 6.1.1: Newspaper-Style Header**
```typescript
export const MainMenu: React.FC = () => {
  const { navigation } = useNavigation();

  return (
    <View style={styles.container}>
      {/* Newspaper Header */}
      <View style={styles.newspaperHeader}>
        <PaperTexture width={width} height={150} />
        <Text style={styles.title}>NEWSPRINT</Text>
        <Text style={styles.subtitle}>SUDOKU DAILY</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Daily Puzzle Stamp */}
      <View style={styles.dailyStamp}>
        <Text style={styles.stampText}>DAILY PUZZLE</Text>
      </View>

      {/* Difficulty Selector */}
      <ScrollView horizontal style={styles.difficultySelector}>
        {['Easy', 'Medium', 'Hard', 'Expert'].map((difficulty) => (
          <DifficultyButton key={difficulty} difficulty={difficulty} />
        ))}
      </ScrollView>

      {/* Start Buttons */}
      {hasSavedGame() ? (
        <Button
          title="Resume Game"
          onPress={() => navigation.navigate('Game')}
          style={styles.resumeButton}
        />
      ) : null}

      <Button
        title="New Game"
        onPress={() => navigation.navigate('Game')}
        style={styles.newGameButton}
      />
    </View>
  );
};
```

### 6.2 Custom Button Styles
**File:** `src/ui/components/StyledButton.tsx`

```typescript
interface StyledButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
}) => {
  const colors = {
    primary: { bg: '#2A2A2A', text: '#FFFFFF' },
    secondary: { bg: '#E8E8E8', text: '#2A2A2A' },
    danger: { bg: '#FF0000', text: '#FFFFFF' },
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors[variant].bg },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { color: colors[variant].text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
```

### 6.3 Victory Modal
**File:** `src/ui/modals/VictoryModal.tsx`

**Step 6.3.1: Newspaper Headline Style**
```typescript
export const VictoryModal: React.FC<VictoryModalProps> = ({
  visible,
  time,
  mistakes,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <CompletionAnimation isCompleted={visible} />

        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>
            PUZZLE SOLVED!
          </Text>
          <View style={styles.divider} />

          <Text style={styles.stats}>
            Time: <Text style={styles.statValue}>{formatTime(time)}</Text>
          </Text>
          <Text style={styles.stats}>
            Mistakes: <Text style={styles.statValue}>{mistakes}</Text>
          </Text>
        </View>

        <Button
          title="Another Puzzle"
          onPress={onClose}
          style={styles.anotherButton}
        />
      </View>
    </Modal>
  );
};
```

---

## Step 7: Performance Optimization

### 7.1 Optimize Skia Rendering
**File:** `src/ui/components/Grid.tsx`

**Step 7.1.1: Memoize Cell Components**
```typescript
const Cell = React.memo(({ row, col, width, height }: CellProps) => {
  // ... cell rendering ...
}, (prevProps, nextProps) => {
  // Only re-render if cell data changed
  return (
    prevProps.row === nextProps.row &&
    prevProps.col === nextProps.col &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height
  );
});
```

**Step 7.1.2: Use Worklets for Heavy Calculations**
```typescript
import { runOnJS } from 'react-native-worklets-core';

const processCellData = (data: CellData) => {
  'worklet';
  // Run on UI thread for better performance
  return processData(data);
};
```

### 7.2 Optimize Animations
**File:** `src/ui/animations/OptimizedAnimations.ts`

**Step 7.2.1: Use Shared Values Wisely**
```typescript
// Avoid creating new shared values on every render
const cachedScales = React.useRef(new Map<string, SharedValue<number>>());

const getScale = (key: string) => {
  if (!cachedScales.current.has(key)) {
    cachedScales.current.set(key, useSharedValue(1));
  }
  return cachedScales.current.get(key)!;
};
```

### 7.3 Reduce Re-renders
**File:** `src/store/gameStore.ts`

**Step 7.3.1: Selective State Subscription**
```typescript
// Subscribe only to needed state
export const useLives = () => useGameStore((state) => state.lives);
export const useSelectedCell = () => useGameStore((state) => state.selectedCell);
export const useInputMode = () => useGameStore((state) => state.inputMode);
```

---

## Step 8: Testing & Verification

### 8.1 Test Animations
**File:** `tests/ui/animations.test.ts`

- [ ] Selection animation triggers correctly
- [ ] Shake animation plays on error
- [ ] Completion animation shows on win
- [ ] Mode switch animation is smooth

### 8.2 Test Shaders
**File:** `tests/ui/shaders.test.ts`

- [ ] Paper texture renders without errors
- [ ] Vignette effect is visible
- [ ] Ink bleed effect is subtle

### 8.3 Test Responsive Layout
**File:** `tests/ui/layout.test.ts`

- [ ] Portrait mode renders correctly
- [ ] Landscape mode renders correctly
- [ ] Orientation changes smoothly
- [ ] Grid scales correctly on both orientations

### 8.4 Performance Testing
**File:** `tests/performance/rendering.test.ts`

- [ ] Grid renders at 60fps
- [ ] Drawing doesn't drop below 50fps
- [ ] Animations are smooth
- [ ] Memory usage is stable

---

## Step 9: Verification Checklist

### 9.1 Visual Polish
- [ ] Paper texture shader works
- [ ] Vignette effect is visible
- [ ] Ink bleed effect is subtle but present
- [ ] Colors match specification (#F3EBDD, #2A2A2A, etc.)

### 9.2 Animations
- [ ] Cell selection is animated
- [ ] Error shake effect plays
- [ ] Victory flash animation works
- [ ] Mode switch is animated
- [ ] All animations run at 60fps

### 9.3 Audio & Haptics
- [ ] Digit place sound plays
- [ ] Error sound plays
- [ ] Victory sound plays
- [ ] Haptic feedback works for all interactions

### 9.4 Responsive Layout
- [ ] Portrait layout works
- [ ] Landscape layout works
- [ ] Orientation changes trigger layout update
- [ ] Grid scales correctly in both modes

### 9.5 Performance
- [ ] No memory leaks
- [ ] Stable 60fps
- [ ] Smooth transitions
- [ ] Fast page loads

---

## Deliverables for Phase 4

1. **Shaders**
   - Paper texture shader with grain and vignette
   - Ink bleed effect shader
   - Shader components

2. **Animations**
   - Cell selection animation
   - Mistake shake animation
   - Completion flash animation
   - Mode switch animation

3. **Responsive Layout**
   - Portrait layout
   - Landscape layout
   - Adaptive layout router

4. **Audio & Haptics**
   - Sound manager with 4 sound effects
   - Haptic feedback for all interactions

5. **UI Polish**
   - Main menu with newspaper style
   - Victory modal with headline
   - Styled button components

6. **Performance Optimizations**
   - Memoized cell components
   - Optimized animations
   - Selective state subscriptions

---

## Estimated Timeline
- Step 1 (Shaders): 8 hours
- Step 2 (Animations): 10 hours
- Step 3 (Responsive Layout): 8 hours
- Step 4 (Audio): 4 hours
- Step 5 (Haptics): 2 hours
- Step 6 (UI Polish): 8 hours
- Step 7 (Performance): 6 hours
- Step 8 (Testing): 6 hours
- Step 9 (Verification): 2 hours

**Total: ~54 hours (6-7 days)**

---

## Sound Assets Required

Create these sound files (approximately):
1. `digitPlace.wav` - Soft pen tap (~100ms)
2. `error.wav` - Low thud/buzzer (~200ms)
3. `victory.wav` - Triumphant fanfare (~2s)
4. `pageTurn.wav` - Paper rustling (~300ms)

---

## Final Notes

After Phase 4, the app should be:
- Visually stunning with unique paper aesthetic
- Smooth and responsive with 60fps animations
- Fully playable in both portrait and landscape
- Engaging with audio and haptic feedback
- Performance-optimized for smooth gameplay

---

## Next: App Store Submission Prep
After all 4 phases are complete:
1. Create build for TestFlight
2. Prepare App Store screenshots
3. Write app description
4. Submit for review