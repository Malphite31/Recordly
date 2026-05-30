/**
 * gifDecoder.ts
 *
 * Decodes animated GIF data URLs into arrays of ImageData frames using omggif.
 * Results are cached by data URL so re-renders never re-decode the same GIF.
 *
 * Used by watermarkRenderer.ts to render animated GIF watermarks at the
 * correct frame for any given playback timestamp.
 */

// @ts-expect-error — omggif has no bundled TypeScript types
import omggifModule from "omggif";

interface OmggifFrameInfo {
	x: number;
	y: number;
	width: number;
	height: number;
	delay: number; // in units of 10ms
	disposal: number; // 0=unspecified, 1=leave, 2=restore-bg, 3=restore-prev
	transparent_index: number | null;
	interlaced: boolean;
	has_local_palette: boolean;
	palette_offset: number | null;
	palette_size: number | null;
	data_offset: number;
	data_length: number;
}

interface OmggifReader {
	width: number;
	height: number;
	numFrames(): number;
	loopCount(): number | null;
	frameInfo(frameNum: number): OmggifFrameInfo;
	decodeAndBlitFrameRGBA(frameNum: number, pixels: Uint8Array): void;
}

// omggif exports GifReader as a named export or as the default depending on bundler
const GifReader: new (buf: Uint8Array) => OmggifReader =
	omggifModule?.GifReader ?? omggifModule;

export interface GifFrame {
	imageData: ImageData;
	/** Duration of this frame in milliseconds */
	durationMs: number;
}

export interface DecodedGif {
	frames: GifFrame[];
	/** Total loop duration in milliseconds (sum of all frame durations) */
	totalDurationMs: number;
}

/** Minimum frame delay in ms — matches browser GIF rendering behaviour */
const MIN_FRAME_DELAY_MS = 100;

/** Module-level cache keyed by data URL to avoid re-decoding on every render */
const gifCache = new Map<string, DecodedGif>();

/**
 * Decodes a GIF data URL into an array of frames with ImageData pixel buffers.
 * Results are cached by data URL.
 *
 * Handles all GIF disposal methods:
 *   0 / 1 — leave in place (composite onto accumulated canvas)
 *   2     — restore to background (clear the frame rect to transparent)
 *   3     — restore to previous (revert to the canvas state before this frame)
 */
export async function decodeGif(dataUrl: string): Promise<DecodedGif> {
	const cached = gifCache.get(dataUrl);
	if (cached) return cached;

	// Strip the data URL prefix to get the raw base64 payload
	const base64 = dataUrl.split(",")[1];
	if (!base64) throw new Error("[gifDecoder] Invalid data URL — no base64 payload");

	// Decode base64 → binary string → Uint8Array
	const binaryStr = atob(base64);
	const bytes = new Uint8Array(binaryStr.length);
	for (let i = 0; i < binaryStr.length; i++) {
		bytes[i] = binaryStr.charCodeAt(i);
	}

	const reader = new GifReader(bytes);
	const gifWidth = reader.width;
	const gifHeight = reader.height;
	const numFrames = reader.numFrames();

	if (numFrames === 0) throw new Error("[gifDecoder] GIF contains no frames");

	// We maintain an "accumulated" canvas that represents the composited state
	// after each frame is applied, respecting disposal methods.
	const accumulatedCanvas = new OffscreenCanvas(gifWidth, gifHeight);
	const accCtx = accumulatedCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;

	// For disposal=3 (restore-to-previous) we need a snapshot of the canvas
	// state before the current frame was drawn.
	let previousImageData: ImageData | null = null;

	const frames: GifFrame[] = [];

	for (let i = 0; i < numFrames; i++) {
		const info = reader.frameInfo(i);

		// Delay is in units of 10ms; clamp to minimum 100ms (browser behaviour)
		const rawDelayMs = info.delay * 10;
		const durationMs = Math.max(MIN_FRAME_DELAY_MS, rawDelayMs);

		// For disposal=3 we need to save the canvas state BEFORE drawing
		if (info.disposal === 3) {
			previousImageData = accCtx.getImageData(0, 0, gifWidth, gifHeight);
		}

		// Decode this frame's indexed pixels into RGBA
		const framePixels = new Uint8Array(gifWidth * gifHeight * 4);
		reader.decodeAndBlitFrameRGBA(i, framePixels);

		// Paint the decoded RGBA data onto the accumulated canvas
		const frameImageData = new ImageData(
			new Uint8ClampedArray(framePixels.buffer),
			gifWidth,
			gifHeight,
		);
		accCtx.putImageData(frameImageData, 0, 0);

		// Capture the composited frame as the output ImageData
		const outputImageData = accCtx.getImageData(0, 0, gifWidth, gifHeight);
		frames.push({ imageData: outputImageData, durationMs });

		// Apply disposal method to prepare the canvas for the next frame
		switch (info.disposal) {
			case 2:
				// Restore to background — clear the frame's subrect to transparent
				accCtx.clearRect(info.x, info.y, info.width, info.height);
				break;
			case 3:
				// Restore to previous — revert to the snapshot taken before this frame
				if (previousImageData) {
					accCtx.putImageData(previousImageData, 0, 0);
					previousImageData = null;
				}
				break;
			// 0 and 1: leave in place — no action needed
		}
	}

	const totalDurationMs = frames.reduce((sum, f) => sum + f.durationMs, 0);
	const decoded: DecodedGif = { frames, totalDurationMs };

	gifCache.set(dataUrl, decoded);
	return decoded;
}

/**
 * Returns the GIF frame that should be displayed at `currentTimeMs`,
 * looping using `currentTimeMs % totalDurationMs`.
 *
 * Requirements 1.2, 1.3: frame selection is deterministic and loops.
 */
export function getGifFrameAtTime(gif: DecodedGif, currentTimeMs: number): GifFrame {
	if (gif.frames.length === 0) throw new Error("[gifDecoder] DecodedGif has no frames");
	if (gif.frames.length === 1) return gif.frames[0];

	// Modulo-loop the timestamp within the total GIF duration
	const loopedTime = currentTimeMs % gif.totalDurationMs;

	let elapsed = 0;
	for (const frame of gif.frames) {
		elapsed += frame.durationMs;
		if (loopedTime < elapsed) return frame;
	}

	// Fallback: return the last frame (handles floating-point edge cases)
	return gif.frames[gif.frames.length - 1];
}
