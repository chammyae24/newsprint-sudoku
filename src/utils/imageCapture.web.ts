import * as htmlToImage from 'html-to-image';
import { RefObject } from 'react';

export async function captureView(ref: RefObject<any>): Promise<string> {
  if (!ref.current) throw new Error('Reference is null');

  // Convert node to image using html-to-image which works flawlessly on web React Native views.
  // We use filter to avoid font parsing issues in some browsers (e.g. Firefox) mapped to html-to-image bugs.
  return await htmlToImage.toPng(ref.current as unknown as HTMLElement, {
    quality: 1.0,
    fontEmbedCSS: '', // Bypass font embedding to avoid "trim" font errors
  });
}
