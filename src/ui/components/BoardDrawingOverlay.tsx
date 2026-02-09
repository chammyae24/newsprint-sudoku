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
  strokeColor = '#1a1a2e',
  strokeWidth = 4,
}: BoardDrawingOverlayProps) {
  const grid = useGameStore((state) => state.grid);
  const inputMode = useGameStore((state) => state.inputMode);
  const setCellValue = useGameStore((state) => state.setCellValue);
  const toggleNote = useGameStore((state) => state.toggleNote);
  const selectCell = useGameStore((state) => state.selectCell);

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
  currentPathRef.current = currentPath;

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

  const getPoint = (event: GestureResponderEvent) => ({
    x: event.nativeEvent.locationX,
    y: event.nativeEvent.locationY,
  });

  const handleDrawingComplete = async (allPaths: DrawingPath[]) => {
    if (allPaths.length === 0 || isProcessing) return;

    setIsProcessing(true);

    try {
      // Detect which cell was drawn in
      const targetCell = detectCell(allPaths);
      if (!targetCell) {
        clearDrawing();
        setIsProcessing(false);
        return;
      }

      const { row, col } = targetCell;
      const cell = grid[row][col];

      // Can't draw on given cells or (in solve mode) cells with values
      if (cell.isGiven || (inputMode === 'solve' && cell.value !== null)) {
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
    selectCell(row, col);

    if (inputMode === 'solve') {
      const isCorrect = setCellValue(digit);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (!isCorrect) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        // Check if we are touching a filled cell
        const col = Math.floor(locationX / cellSize);
        const row = Math.floor(locationY / cellSize);

        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
          const cell = grid[row][col];
          // If cell has a value, let touch pass through to Cell component below
          if (cell.value !== null) {
            return false;
          }
        }
        return true;
      },
      onMoveShouldSetPanResponder: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const col = Math.floor(locationX / cellSize);
        const row = Math.floor(locationY / cellSize);

        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
          const cell = grid[row][col];
          if (cell.value !== null) {
            return false;
          }
        }
        return true;
      },
      onPanResponderGrant: (event) => {
        const point = getPoint(event);
        setCurrentPath([point]);
      },
      onPanResponderMove: (event) => {
        const point = getPoint(event);
        setCurrentPath((prev) => [...prev, point]);
      },
      onPanResponderRelease: () => {
        const currentPoints = currentPathRef.current;
        const existingPaths = pathsRef.current;

        if (currentPoints.length > 0) {
          const newPath: DrawingPath = {
            points: [...currentPoints],
            color: strokeColor,
            strokeWidth,
          };
          const newPaths = [...existingPaths, newPath];
          setPaths(newPaths);
          setCurrentPath([]);

          // Process after a short delay to allow multi-stroke digits
          setTimeout(() => {
            handleDrawingComplete(newPaths);
          }, 500);
        }
      },
    })
  ).current;

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
        style={[styles.overlay, { width: gridSize, height: gridSize }]}
        {...panResponder.panHandlers}
      >
        <Svg width={gridSize} height={gridSize} style={StyleSheet.absoluteFill}>
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
