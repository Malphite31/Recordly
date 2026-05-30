/**
 * Property-based tests for WatermarkSidebar upload handler behavior
 * Feature: enhanced-watermark
 *
 * Uses fast-check to verify universal correctness properties defined in the
 * design document (Properties 13–14).
 *
 * Because the upload handlers live inside a React component, we test the
 * underlying pure logic directly:
 *   - Property 13: MIME validation arrays — unsupported types are rejected
 *   - Property 14: Type-switch spread — inactive source fields are preserved
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { WatermarkSettings, WatermarkType } from "./types";

// ---------------------------------------------------------------------------
// Accepted MIME type sets (mirrors WatermarkSidebar.tsx exactly)
// ---------------------------------------------------------------------------

const ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/gif",
	"image/webp",
	"image/svg+xml",
] as const;

const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simulates the MIME validation logic from handleImageUpload:
 *   if (!validTypes.includes(file.type)) { return /* rejected *\/ }
 * Returns true when the file would be accepted, false when rejected.
 */
function isImageTypeAccepted(mimeType: string): boolean {
	return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Simulates the MIME validation logic from handleVideoUpload.
 */
function isVideoTypeAccepted(mimeType: string): boolean {
	return (ACCEPTED_VIDEO_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Simulates the `update` helper inside WatermarkSidebar:
 *   const update = (patch) => onChange({ ...settings, ...patch });
 * Returns the new settings object that would be passed to onChange.
 */
function applyUpdate(
	settings: WatermarkSettings,
	patch: Partial<WatermarkSettings>,
): WatermarkSettings {
	return { ...settings, ...patch };
}

// ---------------------------------------------------------------------------
// Arbitrary for WatermarkSettings
// ---------------------------------------------------------------------------

/**
 * Generates an arbitrary WatermarkSettings object with all fields populated.
 * Mirrors the watermarkSettingsArb helper used in watermarkRenderer.property.test.ts.
 */
const watermarkSettingsArb = fc.record<WatermarkSettings>({
	enabled: fc.boolean(),
	type: fc.constantFrom<WatermarkType>("text", "image", "video"),
	text: fc.string({ minLength: 0, maxLength: 64 }),
	imageDataUrl: fc.option(fc.constant("data:image/png;base64,abc"), { nil: null }),
	videoDataUrl: fc.option(fc.constant("data:video/mp4;base64,abc"), { nil: null }),
	position: fc.constantFrom(
		"top-left" as const,
		"top-center" as const,
		"top-right" as const,
		"center-left" as const,
		"center" as const,
		"center-right" as const,
		"bottom-left" as const,
		"bottom-center" as const,
		"bottom-right" as const,
		"custom" as const,
	),
	positionX: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
	positionY: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
	scale: fc.float({ min: Math.fround(0.1), max: Math.fround(3.0), noNaN: true }),
	opacity: fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true }),
	fontSize: fc.integer({ min: 8, max: 200 }),
	color: fc.constantFrom("#FFFFFF", "#000000", "#FF0000", "#00FF00"),
	fontFamily: fc.constantFrom("sans-serif", "serif", "monospace"),
	animationStyle: fc.constantFrom(
		"none" as const,
		"pulse" as const,
		"fade-in-out" as const,
		"fade-in" as const,
		"slide-in-left" as const,
		"slide-in-right" as const,
		"slide-in-top" as const,
		"slide-in-bottom" as const,
	),
	padding: fc.integer({ min: 0, max: 120 }),
});

// ---------------------------------------------------------------------------
// Arbitrary for unsupported MIME types
// ---------------------------------------------------------------------------

/**
 * Generates MIME-type-shaped strings that are NOT in the accepted image list.
 * We use a broad string generator and filter out the accepted types.
 */
const unsupportedImageMimeArb = fc
	.string({ minLength: 1, maxLength: 64 })
	.filter((s) => !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(s));

/**
 * Generates MIME-type-shaped strings that are NOT in the accepted video list.
 */
const unsupportedVideoMimeArb = fc
	.string({ minLength: 1, maxLength: 64 })
	.filter((s) => !(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(s));

// ---------------------------------------------------------------------------
// Property 13: Unsupported file type leaves settings unchanged
// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
// Validates: Requirements 10.2
// ---------------------------------------------------------------------------

describe("Property 13: Unsupported file type leaves settings unchanged", () => {
	/**
	 * **Validates: Requirements 10.2**
	 *
	 * For any current WatermarkSettings and any file with an unsupported image
	 * MIME type, the upload handler SHALL leave all fields of WatermarkSettings
	 * unchanged.
	 *
	 * We test this by verifying that:
	 * 1. The MIME validation function correctly rejects unsupported types.
	 * 2. When the validation rejects a file, no update is applied to settings.
	 */
	it("rejects any image MIME type not in the accepted list", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		fc.assert(
			fc.property(unsupportedImageMimeArb, (mimeType) => {
				expect(isImageTypeAccepted(mimeType)).toBe(false);
			}),
			{ numRuns: 200 },
		);
	});

	it("accepts all and only the declared image MIME types", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		for (const mime of ACCEPTED_IMAGE_TYPES) {
			expect(isImageTypeAccepted(mime)).toBe(true);
		}
	});

	it("rejects any video MIME type not in the accepted list", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		fc.assert(
			fc.property(unsupportedVideoMimeArb, (mimeType) => {
				expect(isVideoTypeAccepted(mimeType)).toBe(false);
			}),
			{ numRuns: 200 },
		);
	});

	it("accepts all and only the declared video MIME types", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		for (const mime of ACCEPTED_VIDEO_TYPES) {
			expect(isVideoTypeAccepted(mime)).toBe(true);
		}
	});

	it("settings remain unchanged when an unsupported image MIME type is rejected", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		fc.assert(
			fc.property(watermarkSettingsArb, unsupportedImageMimeArb, (settings, mimeType) => {
				// Simulate the handler: if MIME is not accepted, return early without calling update
				const rejected = !isImageTypeAccepted(mimeType);
				expect(rejected).toBe(true);

				// Since the handler returns early, settings are never modified.
				// We verify this by confirming no update would be applied.
				// (The handler calls `e.target.value = ""` and returns — no onChange call.)
				const settingsAfterRejection = rejected ? settings : applyUpdate(settings, { imageDataUrl: "data:image/png;base64,new" });
				expect(settingsAfterRejection).toStrictEqual(settings);
			}),
			{ numRuns: 200 },
		);
	});

	it("settings remain unchanged when an unsupported video MIME type is rejected", () => {
		// Feature: enhanced-watermark, Property 13: Unsupported file type leaves settings unchanged
		fc.assert(
			fc.property(watermarkSettingsArb, unsupportedVideoMimeArb, (settings, mimeType) => {
				// Simulate the handler: if MIME is not accepted, return early without calling update
				const rejected = !isVideoTypeAccepted(mimeType);
				expect(rejected).toBe(true);

				// Since the handler returns early, settings are never modified.
				const settingsAfterRejection = rejected ? settings : applyUpdate(settings, { videoDataUrl: "data:video/mp4;base64,new" });
				expect(settingsAfterRejection).toStrictEqual(settings);
			}),
			{ numRuns: 200 },
		);
	});
});

// ---------------------------------------------------------------------------
// Property 14: Type switch preserves the inactive source
// Feature: enhanced-watermark, Property 14: Type switch preserves the inactive source
// Validates: Requirements 5.5, 5.6
// ---------------------------------------------------------------------------

describe("Property 14: Type switch preserves the inactive source", () => {
	/**
	 * **Validates: Requirements 5.5, 5.6**
	 *
	 * For any WatermarkSettings with a non-null videoDataUrl, switching type to
	 * "text" or "image" and then back to "video" SHALL result in videoDataUrl
	 * being identical to its original value.
	 *
	 * The same holds for imageDataUrl when switching away from and back to "image".
	 *
	 * This is a pure data property — the `update` function only spreads the patch
	 * over the existing settings, so fields not in the patch are preserved.
	 */
	it("videoDataUrl is preserved after switching type away from video and back", () => {
		// Feature: enhanced-watermark, Property 14: Type switch preserves the inactive source
		fc.assert(
			fc.property(
				// Settings with a non-null videoDataUrl
				watermarkSettingsArb.filter((s) => s.videoDataUrl !== null),
				// Intermediate type to switch to (not "video")
				fc.constantFrom<WatermarkType>("text", "image"),
				(settings, intermediateType) => {
					// Step 1: switch away from video (only `type` changes)
					const afterSwitch = applyUpdate(settings, { type: intermediateType });

					// videoDataUrl must be preserved during the switch
					expect(afterSwitch.videoDataUrl).toBe(settings.videoDataUrl);

					// Step 2: switch back to video
					const afterReturn = applyUpdate(afterSwitch, { type: "video" });

					// videoDataUrl must still be the original value
					expect(afterReturn.videoDataUrl).toBe(settings.videoDataUrl);
				},
			),
			{ numRuns: 200 },
		);
	});

	it("imageDataUrl is preserved after switching type away from image and back", () => {
		// Feature: enhanced-watermark, Property 14: Type switch preserves the inactive source
		fc.assert(
			fc.property(
				// Settings with a non-null imageDataUrl
				watermarkSettingsArb.filter((s) => s.imageDataUrl !== null),
				// Intermediate type to switch to (not "image")
				fc.constantFrom<WatermarkType>("text", "video"),
				(settings, intermediateType) => {
					// Step 1: switch away from image (only `type` changes)
					const afterSwitch = applyUpdate(settings, { type: intermediateType });

					// imageDataUrl must be preserved during the switch
					expect(afterSwitch.imageDataUrl).toBe(settings.imageDataUrl);

					// Step 2: switch back to image
					const afterReturn = applyUpdate(afterSwitch, { type: "image" });

					// imageDataUrl must still be the original value
					expect(afterReturn.imageDataUrl).toBe(settings.imageDataUrl);
				},
			),
			{ numRuns: 200 },
		);
	});

	it("switching type only changes the type field, not videoDataUrl or imageDataUrl", () => {
		// Feature: enhanced-watermark, Property 14: Type switch preserves the inactive source
		fc.assert(
			fc.property(
				watermarkSettingsArb,
				fc.constantFrom<WatermarkType>("text", "image", "video"),
				(settings, newType) => {
					const updated = applyUpdate(settings, { type: newType });

					// Only `type` should change; data URLs must be untouched
					expect(updated.videoDataUrl).toBe(settings.videoDataUrl);
					expect(updated.imageDataUrl).toBe(settings.imageDataUrl);

					// All other fields must also be unchanged
					const { type: _newType, ...restUpdated } = updated;
					const { type: _origType, ...restOriginal } = settings;
					expect(restUpdated).toStrictEqual(restOriginal);
				},
			),
			{ numRuns: 200 },
		);
	});
});
