import * as htmlToImage from 'html-to-image';
import { RefObject } from 'react';

export async function captureView(ref: RefObject<any>): Promise<string> {
  if (!ref.current) throw new Error('Reference is null');

  // Convert node to image using html-to-image which works flawlessly on web React Native views.
  return await htmlToImage.toPng(ref.current as unknown as HTMLElement, {
    quality: 1.0,
  });
}
