import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { VisionOCR } from './VisionOCR';
import type { StylusSupportInfo } from './types';

export type StylusInputType = 'pencil' | 'finger' | 'unknown';

interface StylusState {
  /** Whether the device may support Apple Pencil */
  isSupported: boolean;
  /** Whether Apple Pencil has been detected in this session */
  isPencilDetected: boolean;
  /** Current input type based on last touch */
  currentInputType: StylusInputType;
  /** Whether handwriting mode should be enabled */
  isHandwritingEnabled: boolean;
}

/**
 * Hook to detect and track Apple Pencil usage.
 *
 * Handwriting recognition is only enabled when:
 * 1. Device is an iPad (may support Pencil)
 * 2. User has used Apple Pencil in this session
 *
 * This is a premium feature - regular users get number buttons.
 */
export function useStylusDetection() {
  const [state, setState] = useState<StylusState>({
    isSupported: false,
    isPencilDetected: false,
    currentInputType: 'unknown',
    isHandwritingEnabled: false,
  });

  const hasCheckedSupport = useRef(false);

  // Check device support on mount
  useEffect(() => {
    if (hasCheckedSupport.current) return;
    hasCheckedSupport.current = true;

    async function checkSupport() {
      try {
        const info: StylusSupportInfo = await VisionOCR.checkStylusSupport();
        setState((prev) => ({
          ...prev,
          isSupported: info.maySupportPencil,
        }));
      } catch (error) {
        // Non-iOS or module not available
        setState((prev) => ({
          ...prev,
          isSupported: false,
        }));
      }
    }

    checkSupport();
  }, []);

  /**
   * Call this when a touch event is detected to identify input type.
   * In React Native, we can check touch type from gesture handlers.
   *
   * @param touchType - The touch type from gesture event
   */
  const onTouchDetected = useCallback(
    (touchType: 'stylus' | 'direct' | 'unknown') => {
      const inputType: StylusInputType =
        touchType === 'stylus'
          ? 'pencil'
          : touchType === 'direct'
            ? 'finger'
            : 'unknown';

      setState((prev) => {
        const isPencilDetected =
          prev.isPencilDetected || inputType === 'pencil';
        return {
          ...prev,
          currentInputType: inputType,
          isPencilDetected,
          // Enable handwriting only if pencil is detected and supported
          isHandwritingEnabled:
            prev.isSupported && isPencilDetected && inputType === 'pencil',
        };
      });
    },
    []
  );

  /**
   * Manually enable/disable handwriting mode (for testing/preferences)
   */
  const setHandwritingEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      isHandwritingEnabled:
        prev.isSupported && prev.isPencilDetected && enabled,
    }));
  }, []);

  return {
    ...state,
    onTouchDetected,
    setHandwritingEnabled,
  };
}

/**
 * Simple utility to check if we're on an iPad
 */
export function isIPad(): boolean {
  return Platform.OS === 'ios' && Platform.isPad === true;
}
