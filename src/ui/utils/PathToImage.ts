import { SkPath, Skia } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the bounding box of multiple paths.
 */
export function getPathsBounds(paths: SkPath[]): Bounds | null {
  if (paths.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  paths.forEach((path) => {
    const bounds = path.getBounds();
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });

  if (!isFinite(minX) || !isFinite(minY)) return null;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Create a path image for OCR processing.
 *
 * Note: This is a simplified version. For actual implementation,
 * you would use Skia's makeImage or makeImageFromPicture methods
 * which require access to the Canvas context.
 *
 * The actual image creation should happen in the DrawingCanvas component
 * using the canvasRef.
 */
export async function saveSvgPathToImage(
  paths: SkPath[],
  size: number = 128
): Promise<string | null> {
  try {
    const bounds = getPathsBounds(paths);
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return null;
    }

    // Create an SVG representation of the paths
    // This is a fallback when direct Skia image export isn't available
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}">`;

    paths.forEach((path) => {
      const svgPath = path.toSVGString();
      svgContent += `<path d="${svgPath}" fill="none" stroke="black" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    svgContent += '</svg>';

    // Save SVG to temp file using new expo-file-system API
    const fileName = `drawing_${Date.now()}.svg`;
    const file = new File(Paths.cache, fileName);

    await file.write(svgContent);

    return file.uri;
  } catch (error) {
    console.error('Error saving path to image:', error);
    return null;
  }
}

/**
 * Utility to center and scale paths to a target size.
 * Useful for normalizing input before OCR.
 */
export function normalizePaths(
  paths: SkPath[],
  targetSize: number = 128,
  padding: number = 16
): SkPath[] {
  const bounds = getPathsBounds(paths);
  if (!bounds) return paths;

  const maxDim = Math.max(bounds.width, bounds.height);
  const scale = (targetSize - padding * 2) / maxDim;

  const offsetX = -bounds.x * scale + (targetSize - bounds.width * scale) / 2;
  const offsetY = -bounds.y * scale + (targetSize - bounds.height * scale) / 2;

  // Create transformation matrix
  const matrix = Skia.Matrix();
  matrix.translate(offsetX, offsetY);
  matrix.scale(scale, scale);

  return paths.map((path) => {
    const newPath = path.copy();
    newPath.transform(matrix);
    return newPath;
  });
}

/**
 * Clean up temporary image files.
 */
export async function cleanupTempImages(): Promise<void> {
  try {
    const cacheDir = Paths.cache;

    // List files in cache directory and delete drawing files
    const entries = await cacheDir.list();

    await Promise.all(
      entries
        .filter(
          (entry) => entry instanceof File && entry.name.startsWith('drawing_')
        )
        .map((entry) => (entry as File).delete())
    );
  } catch (error) {
    // Ignore cleanup errors
  }
}
