// UI Components
export { Cell } from './components/Cell';
export {
  DrawingCanvas,
  type DrawingCanvasRef,
  type DrawingPath,
} from './components/DrawingCanvas';
export { Eraser } from './components/Eraser';
export { InkChooser } from './components/InkChooser';
export { InputModeSwitcher } from './components/InputModeSwitcher';
export { Keypad } from './components/Keypad';

// Hooks
export { useHandwritingRecognition } from './hooks/useHandwritingRecognition';

// Utils
export {
  cleanupTempImages,
  getPathsBounds,
  normalizePaths,
  saveSvgPathToImage,
} from './utils/PathToImage';
