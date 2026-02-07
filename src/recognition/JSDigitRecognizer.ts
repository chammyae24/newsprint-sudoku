/**
 * JavaScript-based digit recognizer using pre-trained MNIST neural network.
 * Enhanced preprocessing to match MNIST training data format for better accuracy.
 */

import type { DrawingPath } from '../ui/components/DrawingCanvas';
import { getTopPredictions, predictDigit, type NeuralNetworkWeights } from './NeuralNetwork';

// Import the pre-trained weights
import rawWeights from './model/mnist_weights.json';

// Map the raw weights to our interface structure
const mnistWeights: NeuralNetworkWeights = {
  inputLayerWeights: rawWeights.weight_0,
  inputLayerBias: rawWeights.weight_1,
  hiddenLayerWeights: rawWeights.weight_2,
  hiddenLayerBias: rawWeights.weight_3,
  outputLayerWeights: rawWeights.weight_4,
  outputLayerBias: rawWeights.weight_5,
};

export interface RecognitionResult {
  digit: number;
  confidence: number;
  allCandidates: Array<{ digit: number; confidence: number }>;
}

// Target image size for MNIST (28x28)
const IMAGE_SIZE = 28;

/**
 * Recognize a digit from drawing paths using the MNIST neural network.
 */
export async function recognizeDigitJS(
  paths: DrawingPath[],
  canvasSize: number
): Promise<RecognitionResult> {
  if (paths.length === 0) {
    throw new Error('No drawing paths provided');
  }

  // Convert paths to 28x28 binary image with enhanced preprocessing
  const imageMatrix = pathsToImage(paths, canvasSize);
  
  // Debug: log the image matrix
  if (__DEV__) {
    console.log('Image matrix preview:');
    const preview = imageMatrix.slice(0, 10).map(row => 
      row.map(v => v > 0.5 ? '█' : ' ').join('')
    ).join('\n');
    console.log(preview);
  }
  
  // Run neural network inference
  const result = predictDigit(mnistWeights, imageMatrix);
  
  // Get top predictions
  const topPredictions = getTopPredictions(result, 5);
  
  // Filter to only 1-9 for Sudoku (class 0 is digit 0, class 10 is "none")
  const sudokuCandidates = topPredictions.filter(p => p.digit >= 1 && p.digit <= 9);
  
  // Get the best digit in 1-9 range
  let predictedDigit = result.predictedClass;
  let confidence = result.confidence;
  
  // If predicted class is 0 or 10 (none), use the best 1-9 digit
  if (predictedDigit === 0 || predictedDigit === 10) {
    if (sudokuCandidates.length > 0) {
      predictedDigit = sudokuCandidates[0].digit;
      confidence = sudokuCandidates[0].confidence;
    } else {
      predictedDigit = 1;
      confidence = 0.1;
    }
  }
  
  // === STROKE-BASED POST-PROCESSING ===
  // Apply CONSERVATIVE heuristics to fix common confusions
  // Only correct when we're very confident the NN is wrong
  
  const strokeFeatures = analyzeStrokes(paths, canvasSize);
  
  // Get the top 2 candidates for comparison
  const topCandidate = sudokuCandidates[0];
  const secondCandidate = sudokuCandidates[1];
  const confidenceGap = topCandidate && secondCandidate 
    ? topCandidate.confidence - secondCandidate.confidence 
    : 1;
  
  // === FIX 4 vs 9 CONFUSION using IMAGE PATTERN ===
  // Key insight: In a "4", the LEFT-MIDDLE area (below the diagonal) is mostly EMPTY
  // In a "9", the LEFT-MIDDLE area has pixels from the loop
  // We analyze the 28x28 image matrix directly
  
  if (predictedDigit === 9) {
    const looksLike4 = analyze4vs9Pattern(imageMatrix);
    if (looksLike4 && strokeFeatures.hasHorizontalCrossbar) {
      const fourCandidate = sudokuCandidates.find(c => c.digit === 4);
      if (fourCandidate) {
        predictedDigit = 4;
        confidence = Math.max(fourCandidate.confidence, 0.75);
        if (__DEV__) console.log('Post-processing: Changed 9 → 4 (image pattern + crossbar)');
      }
    }
  }
  
  if (predictedDigit === 4 && confidenceGap < 0.3) {
    // Check if 9 is the second choice
    const nineIsSecond = secondCandidate?.digit === 9;
    // Only change if clear loop at top AND no crossbar AND 9 is close second
    if (nineIsSecond && 
        strokeFeatures.hasTopLoop && 
        !strokeFeatures.hasHorizontalCrossbar) {
      predictedDigit = 9;
      confidence = Math.max(secondCandidate.confidence, 0.6);
      if (__DEV__) console.log('Post-processing: Changed 4 → 9 (loop + close second)');
    }
  }
  
  // === FIX 5 vs 3 CONFUSION ===
  // Only apply when NN is uncertain
  // 5: Horizontal stroke at TOP, left side has ink at top
  // 3: Curves open to the left, no flat top
  
  if (predictedDigit === 3 && confidenceGap < 0.3) {
    const fiveIsSecond = secondCandidate?.digit === 5;
    // Only change if clear top horizontal AND 5 is close second
    if (fiveIsSecond && 
        strokeFeatures.hasTopHorizontal && 
        !strokeFeatures.leftSideOpen) {
      predictedDigit = 5;
      confidence = Math.max(secondCandidate.confidence, 0.6);
      if (__DEV__) console.log('Post-processing: Changed 3 → 5 (top horizontal + close second)');
    }
  }
  
  if (predictedDigit === 5 && confidenceGap < 0.3) {
    const threeIsSecond = secondCandidate?.digit === 3;
    // Only change if no top horizontal AND left side is open AND 3 is close second
    if (threeIsSecond && 
        !strokeFeatures.hasTopHorizontal && 
        strokeFeatures.leftSideOpen) {
      predictedDigit = 3;
      confidence = Math.max(secondCandidate.confidence, 0.6);
      if (__DEV__) console.log('Post-processing: Changed 5 → 3 (left open + close second)');
    }
  }
  
  // === FIX MULTI-STROKE 1 ===
  // If very narrow and tall (aspect ratio < 0.35), it's likely 1
  // This is more reliable than other heuristics
  if (strokeFeatures.aspectRatio < 0.35 && strokeFeatures.isMainlyVertical) {
    const oneCandidate = sudokuCandidates.find(c => c.digit === 1);
    if (oneCandidate && predictedDigit !== 1 && oneCandidate.confidence > 0.05) {
      predictedDigit = 1;
      confidence = Math.max(oneCandidate.confidence, 0.65);
      if (__DEV__) console.log('Post-processing: Changed → 1 (narrow vertical shape)');
    }
  }

  
  // Update candidates with any corrections
  const finalCandidates = sudokuCandidates.map(c => ({
    ...c,
    confidence: c.digit === predictedDigit ? confidence : c.confidence
  })).sort((a, b) => b.confidence - a.confidence);
  
  return {
    digit: predictedDigit,
    confidence,
    allCandidates: finalCandidates.slice(0, 3),
  };
}

/**
 * Analyze the 28x28 image matrix to distinguish 4 from 9.
 * 
 * Key insight from user's actual handwriting:
 * - "4" has a GAP in the BOTTOM-CENTER area (between the left diagonal and right stem)
 * - "9" has continuous ink in the bottom area (the tail comes down from the loop)
 * 
 * Looking at the image matrix pattern for 4: "██  ██" - gap in the middle of bottom row
 */
function analyze4vs9Pattern(imageMatrix: number[][]): boolean {
  const size = imageMatrix.length; // Should be 28
  
  // Find the bounding box of the ink
  let minRow = size, maxRow = 0, minCol = size, maxCol = 0;
  let totalInk = 0;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (imageMatrix[row][col] > 0.3) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
        totalInk++;
      }
    }
  }
  
  if (totalInk < 10) return false;
  
  const height = maxRow - minRow + 1;
  const width = maxCol - minCol + 1;
  
  // Check BOTTOM-CENTER region (rows 60-85%, columns 35-65% of bounding box)
  // This is where 4 has a gap between the left diagonal part and right vertical stem
  const checkRowStart = minRow + Math.floor(height * 0.60);
  const checkRowEnd = minRow + Math.floor(height * 0.85);
  const checkColStart = minCol + Math.floor(width * 0.35);
  const checkColEnd = minCol + Math.floor(width * 0.65);
  
  let bottomCenterInk = 0;
  let bottomCenterTotal = 0;
  
  for (let row = checkRowStart; row <= checkRowEnd; row++) {
    for (let col = checkColStart; col <= checkColEnd; col++) {
      if (row >= 0 && row < size && col >= 0 && col < size) {
        bottomCenterTotal++;
        if (imageMatrix[row][col] > 0.3) {
          bottomCenterInk++;
        }
      }
    }
  }
  
  const bottomCenterDensity = bottomCenterTotal > 0 ? bottomCenterInk / bottomCenterTotal : 0;
  
  if (__DEV__) {
    console.log(`4vs9 pattern: bottomCenterDensity=${bottomCenterDensity.toFixed(3)}, looksLike4=${bottomCenterDensity < 0.25}`);
  }
  
  // If bottom-center region has a gap (< 25% density), it looks like a "4"
  // If it's more filled (> 25%), it looks like a "9" (the tail fills this area)
  return bottomCenterDensity < 0.25;
}

/**
 * Analyze stroke patterns for post-processing heuristics
 */
interface StrokeFeatures {
  aspectRatio: number;
  isMainlyVertical: boolean;
  hasHorizontalCrossbar: boolean;
  hasTopLoop: boolean;
  hasTopHorizontal: boolean; // For 5 (has it) vs 3 (doesn't)
  hasAngularTop: boolean;    // For 4 (angular) vs 9 (curved)
  leftSideOpen: boolean;     // For 3 (open left) vs 5 (closed left initially)
  topCurvature: number;      // Higher = more curved (9), lower = more angular (4)
}

function analyzeStrokes(paths: DrawingPath[], canvasSize: number): StrokeFeatures {
  // Collect all points
  const allPoints: { x: number; y: number }[] = [];
  for (const path of paths) {
    allPoints.push(...path.points);
  }
  
  if (allPoints.length === 0) {
    return {
      aspectRatio: 1,
      isMainlyVertical: false,
      hasHorizontalCrossbar: false,
      hasTopLoop: false,
      hasTopHorizontal: false,
      hasAngularTop: false,
      leftSideOpen: false,
      topCurvature: 0,
    };
  }
  
  // Find bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const p of allPoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const aspectRatio = width / height;
  const isMainlyVertical = height > width * 1.5;
  
  // === ANALYZE HORIZONTAL SEGMENTS ===
  
  // Top region (0-30% of height) - for detecting 4's flat top-left or 5's top bar
  const topYEnd = minY + height * 0.30;
  // Middle region (30-65% of height) - for detecting 4's crossbar (expanded range)
  const middleYStart = minY + height * 0.30;
  const middleYEnd = minY + height * 0.65;
  
  let topHorizontalCount = 0;
  let middleHorizontalCount = 0;
  let totalTopPoints = 0;
  let totalMiddlePoints = 0;
  
  // === ANALYZE ANGLES/CURVATURE ===
  let sharpAngleCount = 0;
  let smoothCurveCount = 0;
  
  for (const path of paths) {
    for (let i = 1; i < path.points.length; i++) {
      const p1 = path.points[i - 1];
      const p2 = path.points[i];
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      
      // Check if in top region
      if (p1.y <= topYEnd || p2.y <= topYEnd) {
        totalTopPoints++;
        // Horizontal if moving more in X than Y (lowered threshold)
        if (absDx > absDy && absDx > 2) {
          topHorizontalCount++;
        }
      }
      
      // Check if in middle region
      if ((p1.y >= middleYStart && p1.y <= middleYEnd) ||
          (p2.y >= middleYStart && p2.y <= middleYEnd)) {
        totalMiddlePoints++;
        // Lowered threshold for crossbar detection
        if (absDx > absDy && absDx > 2) {
          middleHorizontalCount++;
        }
      }
      
      // Analyze angle changes for curvature detection (in top half)
      if (i >= 2 && p1.y <= minY + height * 0.5) {
        const p0 = path.points[i - 2];
        const dx1 = p1.x - p0.x;
        const dy1 = p1.y - p0.y;
        const dx2 = p2.x - p1.x;
        const dy2 = p2.y - p1.y;
        
        // Calculate angle change using cross product
        const cross = dx1 * dy2 - dy1 * dx2;
        const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        if (mag1 > 2 && mag2 > 2) {
          const normalizedCross = Math.abs(cross) / (mag1 * mag2);
          
          // Sharp angle > 0.7, smooth curve < 0.3
          if (normalizedCross > 0.7) {
            sharpAngleCount++;
          } else if (normalizedCross < 0.3) {
            smoothCurveCount++;
          }
        }
      }
    }
  }
  
  // === CALCULATE FEATURES ===
  
  const hasTopHorizontal = totalTopPoints > 0 && topHorizontalCount > totalTopPoints * 0.2;
  
  // === CROSSBAR DETECTION FOR "4" ===
  // Instead of just counting horizontal segments, check if there's a horizontal stroke
  // that spans significant width (characteristic of 4's crossbar)
  // Look for points at similar Y that span at least 40% of width
  
  let hasHorizontalCrossbar = false;
  
  // Group points by Y position (with tolerance) and find horizontal spans
  const yTolerance = height * 0.08; // 8% of height
  const middleRegionStart = minY + height * 0.25;
  const middleRegionEnd = minY + height * 0.70;
  
  // Check multiple Y slices for horizontal span
  for (let checkY = middleRegionStart; checkY <= middleRegionEnd; checkY += yTolerance) {
    const pointsAtY = allPoints.filter(p => 
      p.y >= checkY - yTolerance && p.y <= checkY + yTolerance
    );
    
    if (pointsAtY.length >= 3) {
      const minPointX = Math.min(...pointsAtY.map(p => p.x));
      const maxPointX = Math.max(...pointsAtY.map(p => p.x));
      const horizontalSpan = maxPointX - minPointX;
      
      // If points span 40%+ of the width at this Y level, it's likely a crossbar
      if (horizontalSpan >= width * 0.4) {
        hasHorizontalCrossbar = true;
        if (__DEV__) console.log(`Crossbar detected at Y=${checkY.toFixed(0)}, span=${horizontalSpan.toFixed(0)}, width=${width.toFixed(0)}`);
        break;
      }
    }
  }
  
  // Also check the segment-based approach as fallback
  if (!hasHorizontalCrossbar && totalMiddlePoints > 0 && middleHorizontalCount > totalMiddlePoints * 0.15) {
    hasHorizontalCrossbar = true;
  }
  
  // Angular top (4) vs curved top (9)
  const hasAngularTop = sharpAngleCount > smoothCurveCount * 0.5;
  const topCurvature = smoothCurveCount / Math.max(1, sharpAngleCount + smoothCurveCount);
  
  // Check for loop at top (for 9)
  const topRegionEnd = minY + height * 0.5;
  const topPoints = allPoints.filter(p => p.y <= topRegionEnd);
  let hasTopLoop = false;
  
  if (topPoints.length > 10) {
    const topMinX = Math.min(...topPoints.map(p => p.x));
    const topMaxX = Math.max(...topPoints.map(p => p.x));
    const topWidth = topMaxX - topMinX;
    
    // Loop if top is wide AND curved
    hasTopLoop = topWidth > width * 0.5 && topCurvature > 0.4;
  }
  
  // Check if left side is open (for 3)
  const leftX = minX + width * 0.3;
  const leftSidePoints = allPoints.filter(p => p.x <= leftX);
  const leftSideOpen = leftSidePoints.length < allPoints.length * 0.2;
  
  if (__DEV__) {
    console.log('Stroke analysis:', {
      aspectRatio: aspectRatio.toFixed(2),
      hasTopHorizontal,
      hasHorizontalCrossbar,
      hasAngularTop,
      hasTopLoop,
      leftSideOpen,
      topCurvature: topCurvature.toFixed(2),
      sharpAngleCount,
      smoothCurveCount,
    });
  }
  
  return {
    aspectRatio,
    isMainlyVertical,
    hasHorizontalCrossbar,
    hasTopLoop,
    hasTopHorizontal,
    hasAngularTop,
    leftSideOpen,
    topCurvature,
  };
}

/**
 * Convert drawing paths to a 28x28 binary image matrix.
 * Uses enhanced preprocessing to match MNIST format:
 * - Centers the digit in a 20x20 box within the 28x28 image (4px padding)
 * - Uses proper anti-aliasing for smoother strokes
 * - Computes center of mass for better centering
 */
function pathsToImage(paths: DrawingPath[], canvasSize: number): number[][] {
  // Step 1: Create a high-resolution buffer (56x56) for better quality
  const HR_SIZE = 56;
  const hrBuffer: number[][] = Array(HR_SIZE)
    .fill(null)
    .map(() => Array(HR_SIZE).fill(0));
  
  // Collect all points
  const allPoints: { x: number; y: number }[] = [];
  for (const path of paths) {
    allPoints.push(...path.points);
  }
  
  if (allPoints.length === 0) {
    return Array(IMAGE_SIZE).fill(null).map(() => Array(IMAGE_SIZE).fill(0));
  }
  
  // Find bounding box
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  for (const p of allPoints) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  
  // Scale to fit in 40x40 area in the high-res buffer (leaving 8px padding each side)
  const targetSize = 40;
  const scale = Math.min(targetSize / width, targetSize / height);
  
  // Calculate center offset
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (HR_SIZE - scaledWidth) / 2;
  const offsetY = (HR_SIZE - scaledHeight) / 2;
  
  // Draw strokes with anti-aliasing
  const strokeRadius = 3.0; // Thicker strokes in high-res buffer
  
  for (const path of paths) {
    for (let i = 0; i < path.points.length; i++) {
      const p = path.points[i];
      
      // Transform point to high-res buffer space
      const imgX = offsetX + (p.x - minX) * scale;
      const imgY = offsetY + (p.y - minY) * scale;
      
      // Draw point with anti-aliasing
      drawAntialiasedPoint(hrBuffer, imgX, imgY, strokeRadius, HR_SIZE);
      
      // Draw line between consecutive points
      if (i > 0) {
        const prevP = path.points[i - 1];
        const prevImgX = offsetX + (prevP.x - minX) * scale;
        const prevImgY = offsetY + (prevP.y - minY) * scale;
        
        drawAntialiasedLine(hrBuffer, prevImgX, prevImgY, imgX, imgY, strokeRadius, HR_SIZE);
      }
    }
  }
  
  // Step 2: Downsample to 28x28 with averaging
  const image: number[][] = Array(IMAGE_SIZE)
    .fill(null)
    .map(() => Array(IMAGE_SIZE).fill(0));
  
  const downscaleFactor = HR_SIZE / IMAGE_SIZE;
  
  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = 0; dy < downscaleFactor; dy++) {
        for (let dx = 0; dx < downscaleFactor; dx++) {
          const hrY = Math.floor(y * downscaleFactor + dy);
          const hrX = Math.floor(x * downscaleFactor + dx);
          if (hrY < HR_SIZE && hrX < HR_SIZE) {
            sum += hrBuffer[hrY][hrX];
            count++;
          }
        }
      }
      
      image[y][x] = count > 0 ? sum / count : 0;
    }
  }
  
  // Step 3: Center by center of mass (as done in MNIST preprocessing)
  const centerOfMass = computeCenterOfMass(image);
  const shiftX = Math.round(IMAGE_SIZE / 2 - centerOfMass.x);
  const shiftY = Math.round(IMAGE_SIZE / 2 - centerOfMass.y);
  
  if (shiftX !== 0 || shiftY !== 0) {
    return shiftImage(image, shiftX, shiftY);
  }
  
  return image;
}

/**
 * Draw an anti-aliased point with smooth falloff
 */
function drawAntialiasedPoint(
  buffer: number[][],
  cx: number,
  cy: number,
  radius: number,
  size: number
): void {
  const r2 = radius * radius;
  
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      const px = Math.floor(cx + dx);
      const py = Math.floor(cy + dy);
      
      if (px >= 0 && px < size && py >= 0 && py < size) {
        const dist2 = dx * dx + dy * dy;
        if (dist2 <= r2) {
          // Smooth falloff at the edge
          const t = 1 - Math.sqrt(dist2) / radius;
          const intensity = Math.max(0, Math.min(1, t * 1.5));
          buffer[py][px] = Math.max(buffer[py][px], intensity);
        }
      }
    }
  }
}

/**
 * Draw an anti-aliased line
 */
function drawAntialiasedLine(
  buffer: number[][],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  radius: number,
  size: number
): void {
  const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const steps = Math.max(Math.ceil(dist * 2), 1);
  
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    drawAntialiasedPoint(buffer, x, y, radius, size);
  }
}

/**
 * Compute the center of mass of the image
 */
function computeCenterOfMass(image: number[][]): { x: number; y: number } {
  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;
  
  for (let y = 0; y < image.length; y++) {
    for (let x = 0; x < image[y].length; x++) {
      const mass = image[y][x];
      totalMass += mass;
      sumX += x * mass;
      sumY += y * mass;
    }
  }
  
  if (totalMass === 0) {
    return { x: IMAGE_SIZE / 2, y: IMAGE_SIZE / 2 };
  }
  
  return {
    x: sumX / totalMass,
    y: sumY / totalMass,
  };
}

/**
 * Shift the image by the given offset
 */
function shiftImage(image: number[][], shiftX: number, shiftY: number): number[][] {
  const result: number[][] = Array(IMAGE_SIZE)
    .fill(null)
    .map(() => Array(IMAGE_SIZE).fill(0));
  
  for (let y = 0; y < IMAGE_SIZE; y++) {
    for (let x = 0; x < IMAGE_SIZE; x++) {
      const srcX = x - shiftX;
      const srcY = y - shiftY;
      
      if (srcX >= 0 && srcX < IMAGE_SIZE && srcY >= 0 && srcY < IMAGE_SIZE) {
        result[y][x] = image[srcY][srcX];
      }
    }
  }
  
  return result;
}

/**
 * Check if JS digit recognition is available.
 */
export function isJSRecognizerAvailable(): boolean {
  return rawWeights != null;
}
