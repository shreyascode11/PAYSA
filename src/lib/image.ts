/**
 * Removes every JPEG segment that can carry identifying metadata (EXIF/GPS in APP1, XMP, comments…),
 * keeping only what is needed to decode the image. Returns null if the bytes are not a JPEG.
 */
export function stripJpegMetadata(input: Uint8Array): Uint8Array | null {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) return null;
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i + 4 <= input.length) {
    if (input[i] !== 0xff) return null;
    const marker = input[i + 1] ?? 0;
    // Start of scan: the rest is entropy-coded image data.
    if (marker === 0xda) {
      for (let j = i; j < input.length; j++) out.push(input[j] ?? 0);
      return Uint8Array.from(out);
    }
    const len = ((input[i + 2] ?? 0) << 8) | (input[i + 3] ?? 0);
    const end = i + 2 + len;
    if (len < 2 || end > input.length) return null;
    const isAppN = marker >= 0xe1 && marker <= 0xef;
    const isComment = marker === 0xfe;
    if (!isAppN && !isComment) for (let j = i; j < end; j++) out.push(input[j] ?? 0);
    i = end;
  }
  return null;
}
