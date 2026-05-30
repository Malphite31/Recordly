/**
 * Unit tests for watermarkRenderer animation functions.
 *
 * Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9
 */

import { describe, expect, it } from "vitest";
import type { WatermarkSettings } from "@/components/video-editor/types";
import { computeAnimatedOffset, computeAnimatedOpacity } from "./watermarkRenderer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Builds a minimal WatermarkSettings object for testing animation functions.
 * Only `opacity` and `animationStyle` are relevant to `computeAnimatedOpacity`;
 * only `animationStyle` is relevant to `computeAnimatedOffset`.
 */
function makeSettings(
	overrides: Partial<WatermarkSettings> = {},
): WatermarkSettings {
	return {
		enabled: true,
		type: "text",
		text: "Test",
		imageDataUrl: null,
		videoDataUrl: null,
		position: "bottom-right",
		positionX: 1,
		positionY: 1,
		scale: 1.0,
		opacity: 1.0,
		fontSize: 28,
		color: "#FFFFFF",
		fontFamily: "sans-serif",
		animationStyle: "none",
		padding: 32,
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// computeAnimatedOpacity
// ---------------------------------------------------------------------------

describe("computeAnimatedOpacity", () => {
	// Requirement 4.7 — none: preserves base opacity exactly
	describe('style "none"', () => {
		it("returns base opacity at t=0", () => {
			const s = makeSettings({ animationStyle: "none", opacity: 0.8 });
			expect(computeAnimatedOpacity(s, 0)).toBe(0.8);
		});

		it("returns base opacity at t=5000", () => {
			const s = makeSettings({ animationStyle: "none", opacity: 0.8 });
			expect(computeAnimatedOpacity(s, 5000)).toBe(0.8);
		});

		it("returns base opacity of 0.5 at any time", () => {
			const s = makeSettings({ animationStyle: "none", opacity: 0.5 });
			expect(computeAnimatedOpacity(s, 0)).toBe(0.5);
			expect(computeAnimatedOpacity(s, 99999)).toBe(0.5);
		});
	});

	// Requirement 4.8 — pulse: oscillates between 70% and 100% of base opacity
	describe('style "pulse"', () => {
		it("returns a value in [0.7*o, 1.0*o] at t=0", () => {
			const o = 0.8;
			const s = makeSettings({ animationStyle: "pulse", opacity: o });
			const result = computeAnimatedOpacity(s, 0);
			expect(result).toBeGreaterThanOrEqual(0.7 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});

		it("returns a value in [0.7*o, 1.0*o] at t=1000 (mid-cycle)", () => {
			const o = 0.8;
			const s = makeSettings({ animationStyle: "pulse", opacity: o });
			const result = computeAnimatedOpacity(s, 1000);
			expect(result).toBeGreaterThanOrEqual(0.7 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});

		it("returns a value in [0.7*o, 1.0*o] at t=2000 (full cycle boundary)", () => {
			const o = 0.6;
			const s = makeSettings({ animationStyle: "pulse", opacity: o });
			const result = computeAnimatedOpacity(s, 2000);
			expect(result).toBeGreaterThanOrEqual(0.7 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});

		it("scales correctly with opacity=1.0", () => {
			const s = makeSettings({ animationStyle: "pulse", opacity: 1.0 });
			const result = computeAnimatedOpacity(s, 500);
			expect(result).toBeGreaterThanOrEqual(0.7 - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 + 1e-10);
		});
	});

	// Requirement 4.9 — fade-in-out: oscillates between 10% and 100% of base opacity
	describe('style "fade-in-out"', () => {
		it("returns a value in [0.1*o, 1.0*o] at t=0", () => {
			const o = 0.9;
			const s = makeSettings({ animationStyle: "fade-in-out", opacity: o });
			const result = computeAnimatedOpacity(s, 0);
			expect(result).toBeGreaterThanOrEqual(0.1 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});

		it("returns a value in [0.1*o, 1.0*o] at t=1500 (mid-cycle)", () => {
			const o = 0.9;
			const s = makeSettings({ animationStyle: "fade-in-out", opacity: o });
			const result = computeAnimatedOpacity(s, 1500);
			expect(result).toBeGreaterThanOrEqual(0.1 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});

		it("returns a value in [0.1*o, 1.0*o] at t=3000 (full cycle boundary)", () => {
			const o = 0.7;
			const s = makeSettings({ animationStyle: "fade-in-out", opacity: o });
			const result = computeAnimatedOpacity(s, 3000);
			expect(result).toBeGreaterThanOrEqual(0.1 * o - 1e-10);
			expect(result).toBeLessThanOrEqual(1.0 * o + 1e-10);
		});
	});

	// Requirement 4.2 — fade-in: linear ramp from 0 to baseOpacity over first 1000ms
	describe('style "fade-in"', () => {
		it("returns 0 at t=0", () => {
			const s = makeSettings({ animationStyle: "fade-in", opacity: 0.8 });
			expect(computeAnimatedOpacity(s, 0)).toBe(0);
		});

		it("returns 0.5*o at t=500 (midpoint)", () => {
			const o = 0.8;
			const s = makeSettings({ animationStyle: "fade-in", opacity: o });
			expect(computeAnimatedOpacity(s, 500)).toBeCloseTo(0.5 * o, 10);
		});

		it("returns base opacity at t=1000 (boundary)", () => {
			const o = 0.8;
			const s = makeSettings({ animationStyle: "fade-in", opacity: o });
			expect(computeAnimatedOpacity(s, 1000)).toBeCloseTo(o, 10);
		});

		it("returns base opacity at t=2000 (past boundary — clamped)", () => {
			const o = 0.8;
			const s = makeSettings({ animationStyle: "fade-in", opacity: o });
			expect(computeAnimatedOpacity(s, 2000)).toBeCloseTo(o, 10);
		});

		it("is monotonically non-decreasing from t=0 to t=1000", () => {
			const o = 0.6;
			const s = makeSettings({ animationStyle: "fade-in", opacity: o });
			const times = [0, 100, 250, 500, 750, 900, 1000];
			const values = times.map((t) => computeAnimatedOpacity(s, t));
			for (let i = 1; i < values.length; i++) {
				expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 1e-10);
			}
		});
	});

	// Slide-in styles should fall through to base opacity (no opacity modification)
	describe("slide-in styles — opacity passthrough", () => {
		for (const style of [
			"slide-in-left",
			"slide-in-right",
			"slide-in-top",
			"slide-in-bottom",
		] as const) {
			it(`returns base opacity for "${style}" at t=0`, () => {
				const o = 0.75;
				const s = makeSettings({ animationStyle: style, opacity: o });
				expect(computeAnimatedOpacity(s, 0)).toBe(o);
			});
		}
	});
});

// ---------------------------------------------------------------------------
// computeAnimatedOffset
// ---------------------------------------------------------------------------

const W = 1920;
const H = 1080;

describe("computeAnimatedOffset", () => {
	// Non-slide styles should return zero offset
	describe("non-slide styles return {dx:0, dy:0}", () => {
		for (const style of ["none", "pulse", "fade-in-out", "fade-in"] as const) {
			it(`returns zero offset for "${style}"`, () => {
				const s = makeSettings({ animationStyle: style });
				expect(computeAnimatedOffset(s, 0, W, H)).toEqual({ dx: 0, dy: 0 });
				expect(computeAnimatedOffset(s, 5000, W, H)).toEqual({ dx: 0, dy: 0 });
			});
		}
	});

	// Requirement 4.3 — slide-in-left
	describe('style "slide-in-left"', () => {
		it("at t=0: full off-screen to the left (dx = -canvasWidth)", () => {
			const s = makeSettings({ animationStyle: "slide-in-left" });
			const { dx, dy } = computeAnimatedOffset(s, 0, W, H);
			expect(dx).toBeCloseTo(-W, 5);
			expect(dy).toBe(0);
		});

		it("at t=300 (mid-ease): dx ≈ -canvasWidth * (1 - eased) where eased = 1-(0.5)^3 = 0.875", () => {
			// progress = 300/600 = 0.5; eased = 1 - (1-0.5)^3 = 1 - 0.125 = 0.875
			// slideAmount = 1 - 0.875 = 0.125; dx = -1920 * 0.125 = -240
			const s = makeSettings({ animationStyle: "slide-in-left" });
			const { dx, dy } = computeAnimatedOffset(s, 300, W, H);
			expect(dx).toBeCloseTo(-W * 0.125, 5);
			expect(dy).toBe(0);
		});

		it("at t=600 (animation complete): dx = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-left" });
			const { dx, dy } = computeAnimatedOffset(s, 600, W, H);
			expect(dx).toBeCloseTo(0, 10);
			expect(dy).toBe(0);
		});

		it("at t=1000 (past boundary): dx = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-left" });
			const { dx, dy } = computeAnimatedOffset(s, 1000, W, H);
			expect(dx).toBeCloseTo(0, 10);
			expect(dy).toBe(0);
		});
	});

	// Requirement 4.4 — slide-in-right
	describe('style "slide-in-right"', () => {
		it("at t=0: full off-screen to the right (dx = +canvasWidth)", () => {
			const s = makeSettings({ animationStyle: "slide-in-right" });
			const { dx, dy } = computeAnimatedOffset(s, 0, W, H);
			expect(dx).toBeCloseTo(W, 5);
			expect(dy).toBe(0);
		});

		it("at t=300 (mid-ease): dx ≈ +canvasWidth * 0.125", () => {
			const s = makeSettings({ animationStyle: "slide-in-right" });
			const { dx, dy } = computeAnimatedOffset(s, 300, W, H);
			expect(dx).toBeCloseTo(W * 0.125, 5);
			expect(dy).toBe(0);
		});

		it("at t=600: dx = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-right" });
			const { dx, dy } = computeAnimatedOffset(s, 600, W, H);
			expect(dx).toBeCloseTo(0, 10);
			expect(dy).toBe(0);
		});

		it("at t=1000: dx = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-right" });
			const { dx, dy } = computeAnimatedOffset(s, 1000, W, H);
			expect(dx).toBeCloseTo(0, 10);
			expect(dy).toBe(0);
		});
	});

	// Requirement 4.5 — slide-in-top
	describe('style "slide-in-top"', () => {
		it("at t=0: full off-screen above (dy = -canvasHeight)", () => {
			const s = makeSettings({ animationStyle: "slide-in-top" });
			const { dx, dy } = computeAnimatedOffset(s, 0, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(-H, 5);
		});

		it("at t=300 (mid-ease): dy ≈ -canvasHeight * 0.125", () => {
			const s = makeSettings({ animationStyle: "slide-in-top" });
			const { dx, dy } = computeAnimatedOffset(s, 300, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(-H * 0.125, 5);
		});

		it("at t=600: dy = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-top" });
			const { dx, dy } = computeAnimatedOffset(s, 600, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(0, 10);
		});

		it("at t=1000: dy = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-top" });
			const { dx, dy } = computeAnimatedOffset(s, 1000, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(0, 10);
		});
	});

	// Requirement 4.6 — slide-in-bottom
	describe('style "slide-in-bottom"', () => {
		it("at t=0: full off-screen below (dy = +canvasHeight)", () => {
			const s = makeSettings({ animationStyle: "slide-in-bottom" });
			const { dx, dy } = computeAnimatedOffset(s, 0, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(H, 5);
		});

		it("at t=300 (mid-ease): dy ≈ +canvasHeight * 0.125", () => {
			const s = makeSettings({ animationStyle: "slide-in-bottom" });
			const { dx, dy } = computeAnimatedOffset(s, 300, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(H * 0.125, 5);
		});

		it("at t=600: dy = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-bottom" });
			const { dx, dy } = computeAnimatedOffset(s, 600, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(0, 10);
		});

		it("at t=1000: dy = 0", () => {
			const s = makeSettings({ animationStyle: "slide-in-bottom" });
			const { dx, dy } = computeAnimatedOffset(s, 1000, W, H);
			expect(dx).toBe(0);
			expect(dy).toBeCloseTo(0, 10);
		});
	});

	// Verify the ease-out formula at a few additional checkpoints
	describe("ease-out curve verification", () => {
		it("slide-in-left at t=150 (progress=0.25): dx ≈ -canvasWidth * (1 - eased_0.25)", () => {
			// progress = 150/600 = 0.25; eased = 1 - (0.75)^3 = 1 - 0.421875 = 0.578125
			// slideAmount = 1 - 0.578125 = 0.421875
			const s = makeSettings({ animationStyle: "slide-in-left" });
			const { dx } = computeAnimatedOffset(s, 150, W, H);
			const expectedSlideAmount = 1 - (1 - 0.25) ** 3;
			expect(dx).toBeCloseTo(-W * (1 - expectedSlideAmount), 5);
		});

		it("slide-in-right at t=450 (progress=0.75): dx ≈ +canvasWidth * (1 - eased_0.75)", () => {
			// progress = 450/600 = 0.75; eased = 1 - (0.25)^3 = 1 - 0.015625 = 0.984375
			// slideAmount = 1 - 0.984375 = 0.015625
			const s = makeSettings({ animationStyle: "slide-in-right" });
			const { dx } = computeAnimatedOffset(s, 450, W, H);
			const expectedSlideAmount = 1 - (1 - 0.75) ** 3;
			expect(dx).toBeCloseTo(W * (1 - expectedSlideAmount), 5);
		});
	});
});
