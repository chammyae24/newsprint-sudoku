import React, { useCallback, useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, Text, View } from 'react-native';

export interface DrawingPath {
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

interface DrawingCanvasProps {
  /** Width and height of the canvas */
  size: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Called when drawing ends with all paths */
  onDrawingComplete?: (paths: DrawingPath[]) => void;
  /** Called when stylus type is detected */
  onStylusDetected?: (isStylus: boolean) => void;
  /** Whether the canvas is disabled */
  disabled?: boolean;
}

/**
 * Fallback drawing canvas using SVG Path rendering.
 * Works in Expo Go without native Skia module.
 * For production, consider using @shopify/react-native-skia with native builds.
 */
export function DrawingCanvas({
  size,
  strokeColor = '#1a1a2e',
  strokeWidth = 3,
  onDrawingComplete,
  onStylusDetected,
  disabled = false,
}: DrawingCanvasProps) {
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const containerRef = useRef<View>(null);
  const layoutRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleLayout = useCallback(() => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      layoutRef.current = { x: pageX, y: pageY };
    });
  }, []);

  const getPoint = (event: GestureResponderEvent) => {
    return {
      x: event.nativeEvent.locationX,
      y: event.nativeEvent.locationY,
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (event) => {
        const point = getPoint(event);
        setCurrentPath([point]);
        
        // Check for stylus (Apple Pencil)
        // @ts-ignore - force property may exist on iOS
        const isStylus = event.nativeEvent.force !== undefined && event.nativeEvent.force > 0;
        if (onStylusDetected) {
          onStylusDetected(isStylus);
        }
      },
      onPanResponderMove: (event) => {
        const point = getPoint(event);
        setCurrentPath(prev => [...prev, point]);
      },
      onPanResponderRelease: () => {
        if (currentPath.length > 0) {
          const newPath: DrawingPath = {
            points: currentPath,
            color: strokeColor,
            strokeWidth,
          };
          const newPaths = [...paths, newPath];
          setPaths(newPaths);
          setCurrentPath([]);
          
          if (onDrawingComplete) {
            onDrawingComplete(newPaths);
          }
        }
      },
    })
  ).current;

  // Convert points to SVG path string
  const pointsToPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }
    return d;
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width: size, height: size }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Use SVG-like rendering with Views for fallback */}
      <View style={[StyleSheet.absoluteFill, styles.canvas]}>
        {/* Show drawing area indicator */}
        <View style={styles.drawingArea}>
          <Text style={styles.placeholder}>
            {paths.length === 0 && currentPath.length === 0 
              ? 'Draw here' 
              : `${paths.length} stroke(s)`}
          </Text>
        </View>
        
        {/* Render paths as colored dots for visualization */}
        {paths.map((path, pathIndex) => (
          <View key={pathIndex} style={StyleSheet.absoluteFill} pointerEvents="none">
            {path.points.filter((_, i) => i % 3 === 0).map((point, pointIndex) => (
              <View
                key={pointIndex}
                style={[
                  styles.dot,
                  {
                    left: point.x - path.strokeWidth / 2,
                    top: point.y - path.strokeWidth / 2,
                    width: path.strokeWidth,
                    height: path.strokeWidth,
                    backgroundColor: path.color,
                  },
                ]}
              />
            ))}
          </View>
        ))}
        
        {/* Current path */}
        {currentPath.filter((_, i) => i % 3 === 0).map((point, index) => (
          <View
            key={`current-${index}`}
            style={[
              styles.dot,
              {
                left: point.x - strokeWidth / 2,
                top: point.y - strokeWidth / 2,
                width: strokeWidth,
                height: strokeWidth,
                backgroundColor: strokeColor,
              },
            ]}
            pointerEvents="none"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  canvas: {
    backgroundColor: 'transparent',
  },
  drawingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: '#d1d5db',
    fontSize: 16,
    fontStyle: 'italic',
  },
  dot: {
    position: 'absolute',
    borderRadius: 100,
  },
});

// Ref type for external access
export interface DrawingCanvasRef {
  clear: () => void;
  getPaths: () => DrawingPath[];
}
