/**
 * Native module types for Vision OCR and stylus detection
 */

export interface OCRResult {
  /** The recognized text (digit 1-9) */
  text: string;
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
  /** Bounding box in normalized coordinates (0-1) */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface StylusSupportInfo {
  /** Whether the device is an iPad */
  isPadDevice: boolean;
  /** Whether the device may support Apple Pencil */
  maySupportPencil: boolean;
}

export interface VisionOCRInterface {
  /**
   * Recognize text from an image file path
   * @param imagePath Absolute path to the image file
   * @returns Array of OCR results with recognized digits
   */
  recognizeText(imagePath: string): Promise<OCRResult[]>;
  
  /**
   * Check if the device may support Apple Pencil
   * @returns Stylus support information
   */
  checkStylusSupport(): Promise<StylusSupportInfo>;
}
