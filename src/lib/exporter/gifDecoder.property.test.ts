// Feature: enhanced-watermark, Property 1: Animated watermark frame selection uses modulo looping

import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { type DecodedGif, type GifFrame, getGifFrameAtTime } from "./gifDecoder";

/**
 * Builds a synthetic DecodedGif whose frames sum to exactly `totalDurationMs`.
 *
 * We split the total duration evenly across a fixed number of frames so that
 * the test never depends on real GIF decoding — only on the frame-selection
 * logic inside `getGifFrameAtTime`.
 *
 * The test runs in a Node.js environment where `ImageData` is not available.
 * Since `getGifFrameAtTime` only reads `frame.durationMs` and returns the
 * frame object by reference, we cast a plain object to `GifFrame` — the
 * pixel content is irrelevant for this property.
 */
function buildSyntheticGif(totalDurationMs: number, frameCount = 4): DecodedGif {
	// Each frame gets an equal share of the total duration.
	// We use integer milliseconds to avoid floating-point accumulation drift.
	const baseDuration = Math.floor(totalDurationMs / frameCount);
	const remainder = totalDurationMs - baseDuration * frameCount;

	const frames: GifFrame[] = Array.from({ length: frameCount }, (_, i) => {
		// Distribute the remainder across the first `remainder` frames (1 ms each).
		const durationMs = baseDuration + (i < remainder ? 1 : 0);
		// Stub imageData — getGifFrameAtTime never reads pixel data.
		const imageData = { width: 1, height: 1, data: new Uint8ClampedArray(4) } as unknown as ImageData;
		return { imageData, durationMs };
	});

	const actualTotal = frames.reduce((sum, f) => sum + f.durationMs, 0);
	return { frames, totalDurationMs: actualTotal };
}

describe("getGifFrameAtTime — Property 1: modulo looping", () => {
	/**
	 * **Validates: Requirements 1.2, 1.3, 2.2, 2.3**
	 *
	 * For any total duration D and any timestamp t,
	 * getGifFrameAtTime(gif, t) must return the same frame as
	 * getGifFrameAtTime(gif, t % D).
	 *
	 * This guarantees that the GIF loops seamlessly regardless of how far
	 * into the future the playback timestamp advances.
	 */
	it("returns the same frame for t and t % totalDurationMs", () => {
		fc.assert(
			fc.property(
				// Total GIF duration: 1 ms – 60 000 ms
				fc.float({ min: 1, max: 60_000, noNaN: true }),
				// Playback timestamp: 0 ms – 300 000 ms
				fc.float({ min: 0, max: 300_000, noNaN: true }),
				(totalDurationMs, timestamp) => {
					// Ensure totalDurationMs is at least 1 ms after float rounding
					const safeDuration = Math.max(1, totalDurationMs);
					const gif = buildSyntheticGif(safeDuration);

					const frameAtT = getGifFrameAtTime(gif, timestamp);
					const frameAtTModD = getGifFrameAtTime(gif, timestamp % gif.totalDurationMs);

					// Both calls must resolve to the exact same frame object
					expect(frameAtT).toBe(frameAtTModD);
				},
			),
			{ numRuns: 100 },
		);
	});
});
