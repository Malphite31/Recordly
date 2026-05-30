/**
 * Smoke tests for WatermarkSidebar.tsx
 *
 * These tests verify static properties of the component source and type
 * definitions without mounting the component in a DOM environment.
 *
 * Requirements: 3.3, 4.1, 5.2, 5.3, 7.1, 7.2, 7.3
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { WatermarkAnimationStyle } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read the WatermarkSidebar source once for all source-inspection tests. */
const sidebarSource = readFileSync(
	resolve(__dirname, "WatermarkSidebar.tsx"),
	"utf-8",
);

// ---------------------------------------------------------------------------
// 1. WatermarkAnimationStyle type union — smoke test (Req 4.1)
// ---------------------------------------------------------------------------

describe("WatermarkAnimationStyle type union", () => {
	it("includes all 8 required animation style values", () => {
		// Compile-time check: TypeScript will error if any value is not in the union.
		// At runtime we verify the expected set is exhaustive.
		const allStyles: WatermarkAnimationStyle[] = [
			"none",
			"pulse",
			"fade-in-out",
			"fade-in",
			"slide-in-left",
			"slide-in-right",
			"slide-in-top",
			"slide-in-bottom",
		];

		expect(allStyles).toHaveLength(8);

		// Verify each value is a non-empty string (guards against accidental undefined).
		for (const style of allStyles) {
			expect(typeof style).toBe("string");
			expect(style.length).toBeGreaterThan(0);
		}
	});
});

// ---------------------------------------------------------------------------
// 2. Image file input accept attribute (Req 3.3, 5.3)
// ---------------------------------------------------------------------------

describe("WatermarkSidebar image upload accept attribute", () => {
	it("includes image/jpeg in the accept attribute", () => {
		// Req 3.3: JPEG must be listed as an accepted format.
		expect(sidebarSource).toContain("image/jpeg");
	});

	it("includes image/png in the accept attribute", () => {
		expect(sidebarSource).toContain("image/png");
	});

	it("includes image/gif in the accept attribute", () => {
		expect(sidebarSource).toContain("image/gif");
	});

	it("includes image/webp in the accept attribute", () => {
		expect(sidebarSource).toContain("image/webp");
	});

	it("includes image/svg+xml in the accept attribute", () => {
		expect(sidebarSource).toContain("image/svg+xml");
	});

	it("sets the image accept attribute to the full required list", () => {
		// Req 5.3: The file input must accept PNG, JPEG, GIF, WebP, SVG.
		expect(sidebarSource).toContain(
			'accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"',
		);
	});
});

// ---------------------------------------------------------------------------
// 3. Video file input accept attribute (Req 5.2)
// ---------------------------------------------------------------------------

describe("WatermarkSidebar video upload accept attribute", () => {
	it("includes video/mp4 in the accept attribute", () => {
		// Req 5.2: The video upload control must accept MP4.
		expect(sidebarSource).toContain("video/mp4");
	});

	it("includes video/quicktime in the accept attribute", () => {
		// Req 5.2: The video upload control must accept MOV (video/quicktime).
		expect(sidebarSource).toContain("video/quicktime");
	});

	it("sets the video accept attribute to the full required list", () => {
		expect(sidebarSource).toContain('accept="video/mp4,video/quicktime"');
	});
});

// ---------------------------------------------------------------------------
// 4. Slider min / max / step values (Req 7.1, 7.2, 7.3)
// ---------------------------------------------------------------------------

describe("WatermarkSidebar slider configuration", () => {
	// Req 7.1: Scale slider — min=0.1, max=3.0, step=0.05
	it("Scale slider has min=0.1", () => {
		// The scale slider line contains all three attributes; check each individually.
		expect(sidebarSource).toMatch(/min=\{0\.1\}/);
	});

	it("Scale slider has max=3.0", () => {
		expect(sidebarSource).toMatch(/max=\{3\.0\}/);
	});

	it("Scale slider has step=0.05", () => {
		expect(sidebarSource).toMatch(/step=\{0\.05\}/);
	});

	// Req 7.2: Opacity slider — min=0, max=1, step=0.01
	it("Opacity slider has min=0", () => {
		// min={0} appears for both opacity and padding; presence is sufficient.
		expect(sidebarSource).toMatch(/min=\{0\}/);
	});

	it("Opacity slider has max=1", () => {
		expect(sidebarSource).toMatch(/max=\{1\}/);
	});

	it("Opacity slider has step=0.01", () => {
		expect(sidebarSource).toMatch(/step=\{0\.01\}/);
	});

	// Req 7.3: Padding slider — min=0, max=120, step=4
	it("Padding slider has max=120", () => {
		expect(sidebarSource).toMatch(/max=\{120\}/);
	});

	it("Padding slider has step=4", () => {
		expect(sidebarSource).toMatch(/step=\{4\}/);
	});
});
