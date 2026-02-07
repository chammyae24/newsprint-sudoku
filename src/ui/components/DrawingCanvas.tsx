import React, { useRef, useState } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getDrawingRenderer, isSkiaAvailable } from '../../utils/skiaDetection';

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
 * Adaptive drawing canvas that uses Skia (native) or SVG (Expo Go) based on availability.
 */
export function DrawingCanvas({
  size,
  strokeColor = '#1a1a2e',
  strokeWidth = 3,
  onDrawingComplete,
  onStylusDetected,
  disabled = false,
}: DrawingCanvasProps) {
  const renderer = getDrawingRenderer();
  
  // If Skia is available, use SkiaDrawingCanvas
  if (renderer === 'skia' && isSkiaAvailable()) {
    return (
      <SkiaDrawingCanvas
        size={size}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        onDrawingComplete={onDrawingComplete}
        onStylusDetected={onStylusDetected}
        disabled={disabled}
      />
    );
  }
  
  // Fallback to SVG canvas
  return (
    <SvgDrawingCanvas
      size={size}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      onDrawingComplete={onDrawingComplete}
      onStylusDetected={onStylusDetected}
      disabled={disabled}
    />
  );
}

/**
 * SVG-based drawing canvas - works everywhere including Expo Go.
 */
function SvgDrawingCanvas({
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
  
  // Use refs to track current values to avoid stale closures in PanResponder
  const pathsRef = useRef<DrawingPath[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  
  // Keep refs in sync with state
  pathsRef.current = paths;
  currentPathRef.current = currentPath;

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
        // Use refs to get current values (avoid stale closure)
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
          
          if (onDrawingComplete) {
            onDrawingComplete(newPaths);
          }
        }
      },
    })
  ).current;

  // Convert points to SVG path string with quadratic curves for smoothness
  const pointsToSvgPath = (points: { x: number; y: number }[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      // Single point - draw a small circle
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    if (points.length === 2) {
      d += ` L ${points[1].x} ${points[1].y}`;
      return d;
    }
    
    // Use quadratic bezier curves for smooth lines
    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      d += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
    }
    
    // Connect to last point
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    
    return d;
  };

  return (
    <View
      ref={containerRef}
      style={[styles.container, { width: size, height: size }]}
      {...panResponder.panHandlers}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
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
    </View>
  );
}

/**
 * Skia-based drawing canvas - requires native build (won't work in Expo Go).
 * Provides better performance and smoother rendering.
 * Uses modern react-native-skia v2+ API with GestureHandler.
 */
function SkiaDrawingCanvas({
  size,
  strokeColor = '#1a1a2e',
  strokeWidth = 3,
  onDrawingComplete,
  onStylusDetected,
  disabled = false,
}: DrawingCanvasProps) {
  // Lazy load Skia components to avoid crashes in Expo Go
  const { Canvas, Path: SkiaPath, Skia } = require('@shopify/react-native-skia');
  const { Gesture, GestureDetector } = require('react-native-gesture-handler');
  
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const currentPathRef = useRef<{ x: number; y: number }[]>([]);
  const [, forceUpdate] = useState(0);

  // Create pan gesture for drawing
  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin((event: { x: number; y: number }) => {
      currentPathRef.current = [{ x: event.x, y: event.y }];
      forceUpdate(n => n + 1);
    })
    .onUpdate((event: { x: number; y: number }) => {
      currentPathRef.current.push({ x: event.x, y: event.y });
      forceUpdate(n => n + 1);
    })
    .onEnd(() => {
      if (currentPathRef.current.length > 0) {
        const newPath: DrawingPath = {
          points: [...currentPathRef.current],
          color: strokeColor,
          strokeWidth,
        };
        const newPaths = [...paths, newPath];
        setPaths(newPaths);
        currentPathRef.current = [];
        
        if (onDrawingComplete) {
          onDrawingComplete(newPaths);
        }
      }
    });

  // Convert points to Skia path
  const createSkiaPath = (points: { x: number; y: number }[]) => {
    const skiaPath = Skia.Path.Make();
    if (points.length === 0) return skiaPath;
    
    skiaPath.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const prev = points[i - 1];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      skiaPath.quadTo(prev.x, prev.y, midX, midY);
    }
    
    if (points.length > 1) {
      const last = points[points.length - 1];
      skiaPath.lineTo(last.x, last.y);
    }
    
    return skiaPath;
  };

  const paint = Skia.Paint();
  paint.setStyle(1); // Stroke
  paint.setStrokeWidth(strokeWidth);
  paint.setColor(Skia.Color(strokeColor));
  paint.setStrokeCap(1); // Round
  paint.setStrokeJoin(1); // Round

  return (
    <GestureDetector gesture={panGesture}>
      <Canvas style={[styles.container, { width: size, height: size }]}>
        {/* Render completed paths */}
        {paths.map((path, index) => {
          const skiaPath = createSkiaPath(path.points);
          const pathPaint = Skia.Paint();
          pathPaint.setStyle(1);
          pathPaint.setStrokeWidth(path.strokeWidth);
          pathPaint.setColor(Skia.Color(path.color));
          pathPaint.setStrokeCap(1);
          pathPaint.setStrokeJoin(1);
          return <SkiaPath key={index} path={skiaPath} paint={pathPaint} />;
        })}
        
        {/* Render current path */}
        {currentPathRef.current.length > 0 && (
          <SkiaPath path={createSkiaPath(currentPathRef.current)} paint={paint} />
        )}
      </Canvas>
    </GestureDetector>
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
});

// Ref type for external access
export interface DrawingCanvasRef {
  clear: () => void;
  getPaths: () => DrawingPath[];
}
