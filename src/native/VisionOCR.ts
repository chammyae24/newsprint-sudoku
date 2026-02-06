import { NativeModules, Platform } from 'react-native';
import type { OCRResult, StylusSupportInfo, VisionOCRInterface } from './types';

const { VisionOCRModule } = NativeModules;

/**
 * Vision OCR wrapper for Apple Vision text recognition.
 * Only available on iOS - throws on other platforms.
 */
export const VisionOCR: VisionOCRInterface = {
  /**
   * Recognize text (digits 1-9) from an image
   */
  async recognizeText(imagePath: string): Promise<OCRResult[]> {
    if (Platform.OS !== 'ios') {
      throw new Error('Vision OCR is only available on iOS');
    }
    
    if (!VisionOCRModule) {
      throw new Error('VisionOCRModule is not available. Did you run expo prebuild?');
    }
    
    return await VisionOCRModule.recognizeText(imagePath);
  },
  
  /**
   * Check if the device may support Apple Pencil
   */
  async checkStylusSupport(): Promise<StylusSupportInfo> {
    if (Platform.OS !== 'ios') {
      // Non-iOS devices don't support Apple Pencil
      return {
        isPadDevice: false,
        maySupportPencil: false,
      };
    }
    
    if (!VisionOCRModule) {
      return {
        isPadDevice: false,
        maySupportPencil: false,
      };
    }
    
    return await VisionOCRModule.checkStylusSupport();
  },
};

/**
 * Check if Vision OCR module is available
 */
export function isVisionOCRAvailable(): boolean {
  return Platform.OS === 'ios' && VisionOCRModule != null;
}

export type { OCRResult, StylusSupportInfo } from './types';
