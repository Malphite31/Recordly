import { describe, expect, it } from "vitest";
import {
	getWebcamCropSourceRect,
	isWebcamCropRegionDefault,
	normalizeWebcamCropRegion,
	normalizeWebcamMorphFrames,
	resolveWebcamOverlayAtTime,
} from "./webcamOverlay";
import { DEFAULT_WEBCAM_OVERLAY } from "./types";

describe("normalizeWebcamCropRegion", () => {
	it("defaults to the full webcam frame", () => {
		expect(normalizeWebcamCropRegion()).toEqual({ x: 0, y: 0, width: 1, height: 1 });
		expect(isWebcamCropRegionDefault()).toBe(true);
	});

	it("clamps crop dimensions inside the source frame", () => {
		const crop = normalizeWebcamCropRegion({ x: 0.8, y: -1, width: 0.5, height: 2 });
		expect(crop.x).toBe(0.8);
		expect(crop.y).toBe(0);
		expect(crop.width).toBeCloseTo(0.2);
		expect(crop.height).toBe(1);
	});
});

describe("getWebcamCropSourceRect", () => {
	it("converts normalized crop settings to source pixels", () => {
		expect(
			getWebcamCropSourceRect({ x: 0.25, y: 0.1, width: 0.5, height: 0.75 }, 1920, 1080),
		).toEqual({
			sx: 480,
			sy: 108,
			sw: 960,
			sh: 810,
		});
	});
});

describe("webcam morph frames", () => {
	it("drops saved webcam morph frames", () => {
		expect(
			normalizeWebcamMorphFrames([
				{ id: "late", timeMs: 2000, positionX: 2, positionY: -1, size: 150 },
				{ id: "early", timeMs: 1000, positionX: 0.25, positionY: 0.75, size: 20 },
			]),
		).toEqual([]);
	});

	it("leaves webcam layout unchanged at timeline time", () => {
		const webcam = {
			...DEFAULT_WEBCAM_OVERLAY,
			positionPreset: "custom" as const,
			positionX: 0,
			positionY: 0,
			size: 20,
			morphFrames: [
				{
					id: "target",
					timeMs: 1000,
					positionX: 1,
					positionY: 1,
					size: 60,
					cornerRadius: 200,
					margin: 40,
					shadow: 1,
				},
			],
		};

		expect(resolveWebcamOverlayAtTime(webcam, 500)).toBe(webcam);
	});
});
