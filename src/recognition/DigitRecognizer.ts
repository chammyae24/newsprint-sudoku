/**
 * Unified digit recognition interface.
 * Automatically uses native Vision OCR when available, falls back to JS recognizer.
 */

import { isVisionOCRAvailable } from '../native/VisionOCR';
import type { DrawingPath } from '../ui/components/DrawingCanvas';
import { isJSRecognizerAvailable, recognizeDigitJS, type RecognitionResult } from './JSDigitRecognizer';

export type RecognizerType = 'vision' | 'js' | 'none';

/**
 * Get the type of recognizer that will be used.
 */
export function getRecognizerType(): RecognizerType {
  if (isVisionOCRAvailable()) {
    return 'vision';
  }
  if (isJSRecognizerAvailable()) {
    return 'js';
  }
  return 'none';
}

/**
 * Check if any digit recognizer is available.
 */
export function isRecognizerAvailable(): boolean {
  return getRecognizerType() !== 'none';
}

/**
 * Get a human-readable name for the current recognizer.
 */
export function getRecognizerDisplayName(): string {
  const type = getRecognizerType();
  switch (type) {
    case 'vision':
      return '✅ Apple Vision (native)';
    case 'js':
      return '📝 JS Fallback';
    case 'none':
      return '❌ Not available';
  }
}

/**
 * Recognize a digit from drawing paths.
 * Automatically chooses the best available recognizer.
 */
export async function recognizeDigit(
  paths: DrawingPath[],
  canvasSize: number
): Promise<RecognitionResult> {
  const type = getRecognizerType();
  
  switch (type) {
    case 'vision':
      // TODO: When native Vision OCR is implemented, convert paths to image
      // and call the native module. For now, fall through to JS.
      // In production, this would be:
      // const imagePath = await convertPathsToImage(paths, canvasSize);
      // const results = await VisionOCR.recognizeText(imagePath);
      // return convertVisionResultToRecognitionResult(results);
      
      // Fall through to JS for now since image conversion isn't implemented
      return recognizeDigitJS(paths, canvasSize);
      
    case 'js':
      return recognizeDigitJS(paths, canvasSize);
      
    case 'none':
      throw new Error('No digit recognizer available');
  }
}

export type { RecognitionResult } from './JSDigitRecognizer';
