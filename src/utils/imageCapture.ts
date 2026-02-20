import { RefObject } from 'react';
import { captureRef } from 'react-native-view-shot';

export async function captureView(ref: RefObject<any>): Promise<string> {
  return await captureRef(ref, {
    format: 'png',
    quality: 1.0,
  });
}
