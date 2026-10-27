import { describe, expect, it } from "vitest";
import { stripJpegMetadata } from "@/lib/image";

const seg = (marker: number, payload: number[]): number[] => {
  const len = payload.length + 2;
  return [0xff, marker, len >> 8, len & 0xff, ...payload];
};

describe("stripJpegMetadata", () => {
  const app0 = seg(0xe0, [0x4a, 0x46, 0x49, 0x46, 0]);
  const exif = seg(0xe1, [0x45, 0x78, 0x69, 0x66, 0, 0, 1, 2, 3]); // "Exif" + fake GPS data
  const comment = seg(0xfe, [0x68, 0x69]);
  const dqt = seg(0xdb, [0, 1, 2]);
  const sos = [0xff, 0xda, 0, 2, 9, 9, 9, 0xff, 0xd9];
  const jpeg = Uint8Array.from([0xff, 0xd8, ...app0, ...exif, comment, dqt, sos].flat());

  it("drops EXIF (APP1) and comment segments but keeps image data", () => {
    const out = stripJpegMetadata(jpeg);
    expect(out).not.toBeNull();
    expect(Array.from(out ?? [])).toEqual([0xff, 0xd8, ...app0, ...dqt, ...sos]);
  });

  it("rejects non-JPEG input", () => {
    expect(stripJpegMetadata(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });

  it("rejects truncated segments", () => {
    expect(stripJpegMetadata(Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00, 1]))).toBeNull();
  });
});
