/**
 * Unit tests for gifDecoder.ts
 *
 * Requirements: 1.2, 1.3
 *
 * Test strategy:
 * - `getGifFrameAtTime` is a pure function — tested directly with synthetic DecodedGif objects.
 *   Since it only reads `frame.durationMs` and returns the frame by reference, we stub
 *   `imageData` as a plain object (same pattern as the property test).
 * - `decodeGif` is tested with a real minimal 3-frame GIF binary (generated via omggif's
 *   GifWriter). OffscreenCanvas and ImageData are polyfilled for the Node environment.
 */

import { describe, expect, it } from "vitest";

// ---------------------------------------------------------------------------
// OffscreenCanvas + ImageData polyfills — installed before gifDecoder is imported
// ---------------------------------------------------------------------------

/**
 * Minimal OffscreenCanvas polyfill backed by a flat Uint8ClampedArray pixel buffer.
 * Supports putImageData, getImageData, and clearRect — the only methods used by decodeGif.
 */
class MockOffscreenCanvas {
	private _pixels: Uint8ClampedArray;
	constructor(
		public width: number,
		public height: number,
	) {
		this._pixels = new Uint8ClampedArray(width * height * 4);
	}

	getContext(_type: string) {
		const pixels = this._pixels;
		const { width, height } = this;

		return {
			putImageData(
				imageData: { data: Uint8ClampedArray; width: number; height: number },
				dx: number,
				dy: number,
			) {
				for (let row = 0; row < imageData.height; row++) {
					for (let col = 0; col < imageData.width; col++) {
						const srcIdx = (row * imageData.width + col) * 4;
						const dstIdx = ((dy + row) * width + (dx + col)) * 4;
						pixels[dstIdx] = imageData.data[srcIdx];
						pixels[dstIdx + 1] = imageData.data[srcIdx + 1];
						pixels[dstIdx + 2] = imageData.data[srcIdx + 2];
						pixels[dstIdx + 3] = imageData.data[srcIdx + 3];
					}
				}
			},
			getImageData(sx: number, sy: number, sw: number, sh: number) {
				const out = new Uint8ClampedArray(sw * sh * 4);
				for (let row = 0; row < sh; row++) {
					for (let col = 0; col < sw; col++) {
						const srcIdx = ((sy + row) * width + (sx + col)) * 4;
						const dstIdx = (row * sw + col) * 4;
						out[dstIdx] = pixels[srcIdx];
						out[dstIdx + 1] = pixels[srcIdx + 1];
						out[dstIdx + 2] = pixels[srcIdx + 2];
						out[dstIdx + 3] = pixels[srcIdx + 3];
					}
				}
				// Return a plain object satisfying the ImageData interface
				return { data: out, width: sw, height: sh };
			},
			clearRect(x: number, y: number, w: number, h: number) {
				for (let row = 0; row < h; row++) {
					for (let col = 0; col < w; col++) {
						const idx = ((y + row) * width + (x + col)) * 4;
						pixels[idx] = 0;
						pixels[idx + 1] = 0;
						pixels[idx + 2] = 0;
						pixels[idx + 3] = 0;
					}
				}
			},
		};
	}
}

// Install polyfills at module evaluation time so they are present when
// gifDecoder.ts is first imported (which happens when this test file loads).
// @ts-expect-error — OffscreenCanvas is not in Node's type definitions
globalThis.OffscreenCanvas = MockOffscreenCanvas;

// ImageData polyfill — needed for `new ImageData(...)` inside decodeGif
if (typeof globalThis.ImageData === "undefined") {
	// @ts-expect-error — ImageData is not in Node's type definitions
	globalThis.ImageData = class ImageDataPolyfill {
		data: Uint8ClampedArray;
		width: number;
		height: number;
		constructor(data: Uint8ClampedArray, width: number, height: number) {
			this.data = data;
			this.width = width;
			this.height = height;
		}
	};
}

// atob polyfill for Node < 16
if (typeof globalThis.atob === "undefined") {
	globalThis.atob = (b64: string) => Buffer.from(b64, "base64").toString("binary");
}

// ---------------------------------------------------------------------------
// Import the module under test AFTER polyfills are in place
// ---------------------------------------------------------------------------

import { type DecodedGif, type GifFrame, decodeGif, getGifFrameAtTime } from "../gifDecoder";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a synthetic DecodedGif with explicit per-frame durations (ms).
 * `imageData` is stubbed as a plain object because `getGifFrameAtTime` never
 * reads pixel data — it only uses `durationMs` for frame selection.
 */
function buildGif(durationsMs: number[]): DecodedGif {
	const frames: GifFrame[] = durationsMs.map((durationMs) => ({
		imageData: { width: 1, height: 1, data: new Uint8ClampedArray(4) } as unknown as ImageData,
		durationMs,
	}));
	const totalDurationMs = durationsMs.reduce((sum, d) => sum + d, 0);
	return { frames, totalDurationMs };
}

/**
 * A real minimal 3-frame 1×1 GIF binary encoded as a data URL.
 *
 * Generated with omggif's GifWriter:
 *   frame 0: delay=20 (200ms), red pixel
 *   frame 1: delay=30 (300ms), green pixel
 *   frame 2: delay=50 (500ms), blue pixel
 *   Total: 1000ms
 *
 * Verified with omggif's GifReader: numFrames()=3, delays=[20,30,50].
 */
const THREE_FRAME_GIF_DATA_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQAFAAAACwAAAAAAQABAIAAAAAAAAACAkQBACH5BAAeAAAALAAAAAABAAEAgAAAAAAAAAICRAEAIfkEADIAAAAsAAAAAAEAAQCAAAAAAAAAAgJEAQA7";

// ---------------------------------------------------------------------------
// getGifFrameAtTime — frame selection
// ---------------------------------------------------------------------------

describe("getGifFrameAtTime", () => {
	// 3-frame GIF: [200ms, 300ms, 500ms] = 1000ms total
	// frame 0: [0, 200)
	// frame 1: [200, 500)
	// frame 2: [500, 1000)
	const gif = buildGif([200, 300, 500]);

	it("returns frame 0 at t=0", () => {
		expect(getGifFrameAtTime(gif, 0)).toBe(gif.frames[0]);
	});

	it("returns frame 0 just before the first boundary (t=199)", () => {
		expect(getGifFrameAtTime(gif, 199)).toBe(gif.frames[0]);
	});

	it("returns frame 1 at the first boundary (t=200)", () => {
		// loopedTime=200; elapsed after frame0=200; 200 < 200 is false → frame1
		expect(getGifFrameAtTime(gif, 200)).toBe(gif.frames[1]);
	});

	it("returns frame 1 at t=499 (just before frame 2)", () => {
		expect(getGifFrameAtTime(gif, 499)).toBe(gif.frames[1]);
	});

	it("returns frame 2 at t=500 (midpoint of frame 2)", () => {
		expect(getGifFrameAtTime(gif, 500)).toBe(gif.frames[2]);
	});

	it("returns frame 2 at t=999 (last ms of the loop)", () => {
		expect(getGifFrameAtTime(gif, 999)).toBe(gif.frames[2]);
	});

	it("loops back to frame 0 at t=1000 (boundary equals totalDuration)", () => {
		// 1000 % 1000 = 0 → frame 0
		expect(getGifFrameAtTime(gif, 1000)).toBe(gif.frames[0]);
	});

	it("loops back to frame 0 at t=1001 (one ms past the loop boundary)", () => {
		// 1001 % 1000 = 1 → frame 0
		expect(getGifFrameAtTime(gif, 1001)).toBe(gif.frames[0]);
	});

	it("returns frame 1 at t=1200 (second loop, equivalent to t=200)", () => {
		// 1200 % 1000 = 200 → frame 1
		expect(getGifFrameAtTime(gif, 1200)).toBe(gif.frames[1]);
	});

	it("returns frame 2 at t=2500 (third loop, equivalent to t=500)", () => {
		// 2500 % 1000 = 500 → frame 2
		expect(getGifFrameAtTime(gif, 2500)).toBe(gif.frames[2]);
	});

	it("returns the only frame for a single-frame GIF at any timestamp", () => {
		const singleFrame = buildGif([500]);
		expect(getGifFrameAtTime(singleFrame, 0)).toBe(singleFrame.frames[0]);
		expect(getGifFrameAtTime(singleFrame, 999)).toBe(singleFrame.frames[0]);
		expect(getGifFrameAtTime(singleFrame, 100_000)).toBe(singleFrame.frames[0]);
	});

	it("throws when the gif has no frames", () => {
		const empty: DecodedGif = { frames: [], totalDurationMs: 0 };
		expect(() => getGifFrameAtTime(empty, 0)).toThrow("[gifDecoder] DecodedGif has no frames");
	});
});

// ---------------------------------------------------------------------------
// decodeGif — real GIF binary with OffscreenCanvas polyfill
// ---------------------------------------------------------------------------

describe("decodeGif", () => {
	it("decodes a 3-frame GIF and returns the correct frame count", async () => {
		const decoded = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		expect(decoded.frames).toHaveLength(3);
	});

	it("computes correct per-frame durations (delay × 10ms, min 100ms)", async () => {
		const decoded = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		// delay=20 → 200ms, delay=30 → 300ms, delay=50 → 500ms
		expect(decoded.frames[0].durationMs).toBe(200);
		expect(decoded.frames[1].durationMs).toBe(300);
		expect(decoded.frames[2].durationMs).toBe(500);
	});

	it("computes the correct totalDurationMs (sum of all frame durations)", async () => {
		const decoded = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		expect(decoded.totalDurationMs).toBe(1000);
	});

	it("returns ImageData objects with the correct dimensions for each frame", async () => {
		const decoded = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		for (const frame of decoded.frames) {
			expect(frame.imageData.width).toBe(1);
			expect(frame.imageData.height).toBe(1);
		}
	});

	it("caches the result — returns the same object on a second call", async () => {
		const first = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		const second = await decodeGif(THREE_FRAME_GIF_DATA_URL);
		expect(first).toBe(second);
	});

	it("throws when the data URL has no base64 payload", async () => {
		await expect(decodeGif("data:image/gif;base64,")).rejects.toThrow(
			"[gifDecoder] Invalid data URL",
		);
	});

	it("clamps sub-100ms frame delays to the 100ms minimum", async () => {
		// A real 1-frame 1×1 GIF with delay=5 (50ms) — below the 100ms minimum.
		// Generated with omggif's GifWriter and verified: numFrames()=1, delay=5.
		const shortDelayUrl =
			"data:image/gif;base64,R0lGODlhAQABAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQABQAAACwAAAAAAQABAIAAAAAAAAACAkQBADs=";
		const decoded = await decodeGif(shortDelayUrl);
		expect(decoded.frames[0].durationMs).toBe(100);
	});
});
