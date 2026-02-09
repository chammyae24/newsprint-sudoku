/**
 * Recognition module exports.
 */

export {
  getRecognizerDisplayName,
  getRecognizerType,
  isRecognizerAvailable,
  recognizeDigit,
  type RecognitionResult,
  type RecognizerType,
} from './DigitRecognizer';

export { isJSRecognizerAvailable, recognizeDigitJS } from './JSDigitRecognizer';
