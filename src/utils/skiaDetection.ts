import Constants from 'expo-constants';

/**
 * Utility to detect if Skia is available and functional at runtime.
 * Skia requires native builds and won't work in Expo Go.
 */

let skiaAvailable: boolean | null = null;

/**
 * Check if we're running in Expo Go (where native modules don't work).
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Check if @shopify/react-native-skia is available and functional.
 * This will return false in Expo Go since Skia requires native modules.
 */
export function isSkiaAvailable(): boolean {
  if (skiaAvailable !== null) {
    return skiaAvailable;
  }

  // Expo Go doesn't support native modules like Skia
  if (isExpoGo()) {
    skiaAvailable = false;
    return false;
  }

  try {
    // Try to import Skia and check if the native module is actually loaded
    const SkiaModule = require('@shopify/react-native-skia');
    
    // The Skia object must exist AND have the Make functions available
    // These will be undefined if native module not loaded
    if (SkiaModule?.Skia?.Path?.Make) {
      // Try to actually create a path to verify native code works
      const testPath = SkiaModule.Skia.Path.Make();
      skiaAvailable = testPath !== null && testPath !== undefined;
    } else {
      skiaAvailable = false;
    }
  } catch (e) {
    skiaAvailable = false;
  }

  return skiaAvailable;
}

/**
 * Get the recommended drawing renderer based on availability.
 */
export type DrawingRenderer = 'skia' | 'svg';

export function getDrawingRenderer(): DrawingRenderer {
  return isSkiaAvailable() ? 'skia' : 'svg';
}
