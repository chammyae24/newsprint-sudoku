import * as Haptics from 'expo-haptics';
import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { recognizeDigitJS } from '../../recognition';
import { useGameStore } from '../../store/GameStore';
import type { DrawingPath } from './DrawingCanvas';
import { InkChooser } from './InkChooser';

interface BoardDrawingOverlayProps {
  /** Width of the grid (should match the actual board size) */
  gridSize: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
}

/**
 * Transparent overlay that covers the Sudoku grid for direct handwriting input.
 * Detects which cell the user draws in and places the recognized digit.
 */
export function BoardDrawingOverlay({
  gridSize,
  strokeColor = '#1d1df6ff',
  strokeWidth = 4,
}: BoardDrawingOverlayProps) {
  const grid = useGameStore((state) => state.grid);
  const inputMode = useGameStore((state) => state.inputMode);
  const setPendingDigit = useGameStore((state) => state.setPendingDigit);
  const toggleNote = useGameStore((state) => state.toggleNote);
  const selectCell = useGameStore((state) => state.selectCell);
  const clearCell = useGameStore((state) => state.clearCell);
  const setIsWriting = useGameStore((state) => state.setIsWriting);

  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>(
    []
  );
  const [showInkChooser, setShowInkChooser] = useState(false);
  const [inkChooserCandidates, setInkChooserCandidates] = useState<
    { digit: number; confidence: number }[]
  >([]);
  const [pendingCell, setPendingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const pathsRef = useRef<DrawingPath[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);

  pathsRef.current = paths;
  // currentPathRef.current = currentPath; // REMOVED: Manually managed in PanResponder to avoid staleness

  const cellSize = gridSize / 9;

  /**
   * Get the bounding box of all paths
   */
  const getPathBounds = (allPaths: DrawingPath[]) => {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    allPaths.forEach((path) => {
      path.points.forEach((point) => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      });
    });

    return { minX, minY, maxX, maxY };
  };

  /**
   * Detect which cell the drawing is in based on the center of the stroke bounds
   */
  const detectCell = (allPaths: DrawingPath[]) => {
    const bounds = getPathBounds(allPaths);
    if (!isFinite(bounds.minX)) return null;

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const col = Math.floor(centerX / cellSize);
    const row = Math.floor(centerY / cellSize);

    // Ensure within bounds
    if (row < 0 || row > 8 || col < 0 || col > 8) return null;

    return { row, col };
  };

  /**
   * Translate paths to cell-local coordinates for better recognition
   */
  const translatePathsToCell = (
    allPaths: DrawingPath[],
    row: number,
    col: number
  ): DrawingPath[] => {
    const cellX = col * cellSize;
    const cellY = row * cellSize;

    return allPaths.map((path) => ({
      ...path,
      points: path.points.map((point) => ({
        x: point.x - cellX,
        y: point.y - cellY,
      })),
    }));
  };

  // Track the active pointer type to prioritize pen
  const activePointerId = useRef<number | null>(null);

  // ── Palm Rejection Config ──
  const PALM_RADIUS_THRESHOLD = 20; // px – touches with radius above this are likely palms
  const STATIONARY_TIMEOUT_MS = 150; // ms – touches that don't move within this are rejected
  const STATIONARY_MOVE_MIN = 5; // px – minimum movement to count as intentional
  const stationaryTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isPalmRejected = useRef(false);
  // Track all active touches for multi-touch priority
  const activeTouchesRef = useRef<Map<number, { radius: number }>>(new Map());

  /**
   * Check if a touch event looks like a palm based on contact area.
   * Returns true if the touch should be REJECTED.
   */
  const isPalmTouch = (event: GestureResponderEvent): boolean => {
    const ne = event.nativeEvent as any;
    const radiusX = ne.radiusX ?? ne.touchMajor ?? 0;
    const radiusY = ne.radiusY ?? ne.touchMinor ?? 0;
    // If radius info is not available (both 0), don't reject
    if (radiusX === 0 && radiusY === 0) return false;
    const maxRadius = Math.max(radiusX, radiusY);
    return maxRadius > PALM_RADIUS_THRESHOLD;
  };

  /**
   * When multiple touches are active, check if this pointer is the smallest
   * (most likely the intentional fingertip). Returns true if it should be REJECTED.
   */
  const isLargerThanActiveTouch = (
    pointerId: number,
    radius: number
  ): boolean => {
    for (const [id, data] of activeTouchesRef.current.entries()) {
      if (id !== pointerId && data.radius < radius && data.radius > 0) {
        // Another touch has a smaller contact area — this one is probably the palm
        return true;
      }
    }
    return false;
  };

  /** Cancel in-progress drawing caused by a palm */
  const cancelPalmDrawing = () => {
    isPalmRejected.current = true;
    currentPathRef.current = [];
    setCurrentPath([]);
    if (stationaryTimerRef.current) {
      clearTimeout(stationaryTimerRef.current);
      stationaryTimerRef.current = null;
    }
  };

  const getPoint = (event: GestureResponderEvent) => ({
    x: event.nativeEvent.locationX,
    y: event.nativeEvent.locationY,
  });

  const handleDrawingComplete = async (allPaths: DrawingPath[]) => {
    if (allPaths.length === 0 || isProcessing) return;

    setIsProcessing(true);

    try {
      // Get FRESH state inside the callback instead of relying on the closure
      const state = useGameStore.getState();
      const currentGrid = state.grid;
      const currentInputMode = state.inputMode;

      // Detect which cell was drawn in
      const targetCell = detectCell(allPaths);
      if (!targetCell) {
        clearDrawing();
        setIsProcessing(false);
        return;
      }

      const { row, col } = targetCell;
      const cell = currentGrid[row][col];

      // Can't draw on given cells
      if (cell.isGiven) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        clearDrawing();
        setIsProcessing(false);
        return;
      }

      // Select the cell visually
      selectCell(row, col);

      // Translate paths to cell-local coordinates
      const localPaths = translatePathsToCell(allPaths, row, col);

      // Recognize the digit
      const result = await recognizeDigitJS(localPaths, cellSize);

      if (result.confidence > 0.7) {
        // High confidence - place digit directly
        await placeDigit(row, col, result.digit);
      } else if (result.confidence > 0.3) {
        // Medium confidence - show ink chooser
        setPendingCell({ row, col });
        setInkChooserCandidates(
          result.allCandidates || [
            { digit: result.digit, confidence: result.confidence },
          ]
        );
        setShowInkChooser(true);
      } else {
        // Low confidence - show warning
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        clearDrawing();
      }
    } catch (error) {
      console.error('Recognition error:', error);
      clearDrawing();
    }

    setIsProcessing(false);
  };

  const placeDigit = async (row: number, col: number, digit: number) => {
    // Get FRESH state inside the callback
    const state = useGameStore.getState();
    const currentInputMode = state.inputMode;
    const currentGrid = state.grid;

    selectCell(row, col);

    if (currentInputMode === 'solve') {
      const cell = currentGrid[row][col];
      // Redraw to clear in solve mode
      if (cell.value === digit) {
        clearCell();
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        setPendingDigit(row, col, digit);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      // Note mode: toggle note handles addition/removal automatically
      toggleNote(digit);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    clearDrawing();
  };

  const handleInkChooserSelect = async (digit: number) => {
    if (pendingCell) {
      await placeDigit(pendingCell.row, pendingCell.col, digit);
    }
    setShowInkChooser(false);
    setPendingCell(null);
    setInkChooserCandidates([]);
  };

  const handleInkChooserCancel = () => {
    setShowInkChooser(false);
    setPendingCell(null);
    setInkChooserCandidates([]);
    clearDrawing();
  };

  const clearDrawing = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const recognitionTimeoutRef = useRef<any>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event) => {
        // @ts-ignore - pointerType property availability check
        const pointerType = event.nativeEvent.pointerType || 'touch';

        // ── Palm rejection: radius check on initial touch ──
        if (pointerType !== 'pen' && isPalmTouch(event)) {
          return false; // Don't even claim this gesture — it's a palm
        }

        return true;
      },
      onMoveShouldSetPanResponder: (event) => {
        // @ts-ignore
        const pointerType = event.nativeEvent.pointerType || 'touch';
        if (pointerType !== 'pen' && isPalmTouch(event)) {
          return false;
        }
        return true;
      },
      onPanResponderGrant: (event) => {
        // @ts-ignore - pointerType
        const pointerType = event.nativeEvent.pointerType || 'touch';
        // @ts-ignore - pointerId
        const pointerId = event.nativeEvent.pointerId;

        isPalmRejected.current = false;

        // ── Track touch radius for multi-touch priority ──
        const ne = event.nativeEvent as any;
        const radius = Math.max(ne.radiusX ?? 0, ne.radiusY ?? 0);
        activeTouchesRef.current.set(pointerId ?? 0, { radius });

        // ── Multi-touch: if another smaller touch exists, reject this one ──
        if (
          pointerType !== 'pen' &&
          radius > 0 &&
          isLargerThanActiveTouch(pointerId ?? 0, radius)
        ) {
          cancelPalmDrawing();
          return;
        }

        // If we found a PEN, and the currently active pointer was NOT a pen (e.g. palm),
        // we should restart.
        if (pointerType === 'pen' && activePointerId.current !== pointerId) {
          activePointerId.current = pointerId;
        } else if (activePointerId.current === null) {
          activePointerId.current = pointerId;
        }

        // Clear any pending recognition
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
          recognitionTimeoutRef.current = null;
        }

        setIsWriting(true);
        const point = getPoint(event);
        currentPathRef.current = [point];
        setCurrentPath([point]);

        // ── Stationary touch rejection ──
        // Record start position; if the touch doesn't move enough within
        // the timeout, cancel it as an accidental palm rest.
        touchStartPosRef.current = point;
        if (stationaryTimerRef.current)
          clearTimeout(stationaryTimerRef.current);
        if (pointerType !== 'pen') {
          stationaryTimerRef.current = setTimeout(() => {
            const startPos = touchStartPosRef.current;
            const latest = currentPathRef.current;
            if (startPos && latest.length > 0) {
              const last = latest[latest.length - 1];
              const dx = last.x - startPos.x;
              const dy = last.y - startPos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < STATIONARY_MOVE_MIN) {
                // Touch barely moved — likely a palm resting
                cancelPalmDrawing();
              }
            }
            stationaryTimerRef.current = null;
          }, STATIONARY_TIMEOUT_MS);
        }
      },
      onPanResponderMove: (event) => {
        // If already palm-rejected, skip all processing
        if (isPalmRejected.current) return;

        // @ts-ignore
        const pointerType = event.nativeEvent.pointerType || 'touch';
        // @ts-ignore
        const pointerId = event.nativeEvent.pointerId;

        // ── Palm Rejection: radius check during move ──
        if (pointerType !== 'pen' && isPalmTouch(event)) {
          cancelPalmDrawing();
          return;
        }

        // ── Multi-touch radius update ──
        const ne = event.nativeEvent as any;
        const radius = Math.max(ne.radiusX ?? 0, ne.radiusY ?? 0);
        activeTouchesRef.current.set(pointerId ?? 0, { radius });

        // If another smaller touch exists, reject this one mid-stroke
        if (
          pointerType !== 'pen' &&
          radius > 0 &&
          isLargerThanActiveTouch(pointerId ?? 0, radius)
        ) {
          cancelPalmDrawing();
          return;
        }

        // Pen/stylus priority: If current active pointer is PEN, ignore TOUCH moves
        if (
          activePointerId.current !== null &&
          pointerType !== 'pen' &&
          activePointerId.current !== pointerId
        ) {
          return;
        }

        if (pointerType === 'pen') {
          activePointerId.current = pointerId;
        }

        const point = getPoint(event);
        currentPathRef.current.push(point);
        setCurrentPath((prev) => [...prev, point]);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (event) => {
        // Clean up multi-touch tracking
        // @ts-ignore
        const pointerId = event.nativeEvent.pointerId;
        activeTouchesRef.current.delete(pointerId ?? 0);
        handlePanResponderRelease();
      },
      onPanResponderTerminate: (event) => {
        // @ts-ignore
        const pointerId = event.nativeEvent.pointerId;
        activeTouchesRef.current.delete(pointerId ?? 0);
        handlePanResponderRelease();
      },
    })
  ).current;

  const handlePanResponderRelease = () => {
    // Clean up stationary timer
    if (stationaryTimerRef.current) {
      clearTimeout(stationaryTimerRef.current);
      stationaryTimerRef.current = null;
    }
    touchStartPosRef.current = null;

    const currentPoints = currentPathRef.current;
    const existingPaths = pathsRef.current;

    // Reset active pointer
    activePointerId.current = null;

    // If this stroke was palm-rejected, discard it silently
    if (isPalmRejected.current) {
      isPalmRejected.current = false;
      currentPathRef.current = [];
      setCurrentPath([]);
      if (existingPaths.length === 0) {
        setIsWriting(false);
      }
      return;
    }

    if (currentPoints.length > 0) {
      const newPath: DrawingPath = {
        points: [...currentPoints],
        color: strokeColor,
        strokeWidth,
      };
      const newPaths = [...existingPaths, newPath];
      setPaths(newPaths);
      pathsRef.current = newPaths;

      setCurrentPath([]);

      recognitionTimeoutRef.current = setTimeout(() => {
        setIsWriting(false);
        handleDrawingComplete(newPaths);
      }, 800);
    } else {
      setIsWriting(false);
    }
  };

  const pointsToSvgPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;

    if (points.length === 2) {
      d += ` L ${points[1].x} ${points[1].y}`;
      return d;
    }

    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
    }

    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return d;
  };

  return (
    <>
      <View
        // @ts-ignore - touchAction is a valid web style prop
        style={[
          styles.overlay,
          { width: gridSize, height: gridSize, touchAction: 'none' },
        ]}
        // Use Pointer Events for handling input
        {...panResponder.panHandlers}
      >
        <Svg
          width={gridSize}
          height={gridSize}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          {/* Render completed paths */}
          {paths.map((path, index) => (
            <Path
              key={index}
              d={pointsToSvgPath(path.points)}
              stroke={path.color}
              strokeWidth={path.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

          {/* Render current drawing path */}
          {currentPath.length > 0 && (
            <Path
              d={pointsToSvgPath(currentPath)}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>

        {/* Processing indicator */}
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <Text style={styles.processingText}>🔍</Text>
          </View>
        )}
      </View>

      {/* Ink Chooser Modal */}
      {showInkChooser && (
        <InkChooser
          visible={showInkChooser}
          candidates={inkChooserCandidates}
          onSelect={handleInkChooserSelect}
          onDismiss={handleInkChooserCancel}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  processingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  processingText: {
    fontSize: 24,
  },
});
