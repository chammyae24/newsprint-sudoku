import { useCallback, useState } from 'react';
import { VisionOCR, isVisionOCRAvailable } from '../../native/VisionOCR';
import type { OCRResult } from '../../native/types';

interface RecognitionResult {
  /** Best recognized digit (1-9) or null if not recognized */
  digit: number | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** All candidates for disambiguiation */
  candidates: Array<{ digit: number; confidence: number }>;
}

interface UseHandwritingRecognitionOptions {
  /** Minimum confidence to auto-accept (default: 0.7) */
  confidenceThreshold?: number;
}

/**
 * Hook for handwriting recognition using Apple Vision.
 * Converts drawing paths to image and runs OCR.
 * 
 * This is a PREMIUM feature for Apple Pencil users only.
 */
export function useHandwritingRecognition(
  options: UseHandwritingRecognitionOptions = {}
) {
  const { confidenceThreshold = 0.7 } = options;
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<RecognitionResult | null>(null);
  
  /**
   * Recognize a digit from drawing paths.
   * This is a stub implementation - actual path-to-image conversion
   * requires Skia's makeImageFromPicture which should be called
   * in the component where the Canvas ref is available.
   */
  const recognizeFromImagePath = useCallback(async (
    imagePath: string
  ): Promise<RecognitionResult> => {
    if (!isVisionOCRAvailable()) {
      console.warn('Vision OCR not available');
      return { digit: null, confidence: 0, candidates: [] };
    }
    
    setIsProcessing(true);
    
    try {
      const results: OCRResult[] = await VisionOCR.recognizeText(imagePath);
      
      // Filter and process results
      const candidates = results
        .filter(r => {
          const digit = parseInt(r.text, 10);
          return !isNaN(digit) && digit >= 1 && digit <= 9;
        })
        .map(r => ({
          digit: parseInt(r.text, 10),
          confidence: r.confidence,
        }))
        .sort((a, b) => b.confidence - a.confidence);
      
      const bestMatch = candidates[0] || null;
      
      const result: RecognitionResult = {
        digit: bestMatch?.confidence >= confidenceThreshold ? bestMatch.digit : null,
        confidence: bestMatch?.confidence || 0,
        candidates,
      };
      
      setLastResult(result);
      return result;
      
    } catch (error) {
      console.error('Handwriting recognition error:', error);
      return { digit: null, confidence: 0, candidates: [] };
    } finally {
      setIsProcessing(false);
    }
  }, [confidenceThreshold]);
  
  /**
   * Check if we need to show the InkChooser (low confidence scenario)
   */
  const needsDisambiguation = useCallback((result: RecognitionResult): boolean => {
    if (result.digit === null && result.candidates.length > 0) {
      // No digit auto-accepted but we have candidates
      return true;
    }
    return false;
  }, []);
  
  return {
    recognizeFromImagePath,
    isProcessing,
    lastResult,
    needsDisambiguation,
    confidenceThreshold,
  };
}
