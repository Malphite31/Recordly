/**
 * Renders the keyboard overlay HUD onto a Canvas 2D context.
 * Used in both the VideoPlayback preview canvas and the export pipeline.
 */

import type { KeyboardOverlaySettings, KeyboardOverlayEvent } from "@/components/video-editor/types";

const BASE_WIDTH = 1920;

function resolvePosition(
	settings: KeyboardOverlaySettings,
	canvasWidth: number,
	canvasHeight: number,
): { x: number; y: number } {
	const scale = canvasWidth / BASE_WIDTH;
	const padding = 48 * scale;

	const presets: Record<string, { x: number; y: number }> = {
		"top-left":      { x: padding, y: padding },
		"top-center":    { x: canvasWidth / 2, y: padding },
		"top-right":     { x: canvasWidth - padding, y: padding },
		"center-left":   { x: padding, y: canvasHeight / 2 },
		"center":        { x: canvasWidth / 2, y: canvasHeight / 2 },
		"center-right":  { x: canvasWidth - padding, y: canvasHeight / 2 },
		"bottom-left":   { x: padding, y: canvasHeight - padding },
		"bottom-center": { x: canvasWidth / 2, y: canvasHeight - padding },
		"bottom-right":  { x: canvasWidth - padding, y: canvasHeight - padding },
	};

	if (settings.position === "custom") {
		return {
			x: (settings.positionX ?? 0.5) * canvasWidth,
			y: (settings.positionY ?? 1) * canvasHeight,
		};
	}

	return presets[settings.position] ?? presets["bottom-center"];
}

function getActiveEvents(
	events: KeyboardOverlayEvent[],
	currentTimeMs: number,
	maxVisible: number,
): KeyboardOverlayEvent[] {
	const active = events.filter(
		(e) => currentTimeMs >= e.timeMs && currentTimeMs < e.timeMs + e.durationMs,
	);
	return active.slice(-maxVisible);
}

function getFadeAlpha(
	event: KeyboardOverlayEvent,
	currentTimeMs: number,
	fadeDurationMs: number,
): number {
	const elapsed = currentTimeMs - event.timeMs;
	const remaining = event.durationMs - elapsed;

	if (fadeDurationMs <= 0) return 1;

	const fadeIn = Math.min(1, elapsed / fadeDurationMs);
	const fadeOut = Math.min(1, remaining / fadeDurationMs);
	return Math.min(fadeIn, fadeOut);
}

export function renderKeyboardOverlay(
	ctx: CanvasRenderingContext2D,
	settings: KeyboardOverlaySettings,
	currentTimeMs: number,
	canvasWidth: number,
	canvasHeight: number,
): void {
	if (!settings.enabled || settings.events.length === 0) return;

	const activeEvents = getActiveEvents(settings.events, currentTimeMs, settings.maxVisible ?? 3);
	if (activeEvents.length === 0) return;

	const scale = canvasWidth / BASE_WIDTH;
	const userScale = settings.scale ?? 1;
	const opacity = settings.opacity ?? 1;
	const fadeDurationMs = settings.fadeDurationMs ?? 180;
	const animStyle = settings.animationStyle ?? "fade";
	const stacked = settings.stackedDisplay ?? true;

	const fontSize = Math.round(28 * scale * userScale);
	const keyPadX = Math.round(14 * scale * userScale);
	const keyPadY = Math.round(8 * scale * userScale);
	const keyGap = Math.round(6 * scale * userScale);
	const comboGap = Math.round(12 * scale * userScale);
	const containerPadX = Math.round(18 * scale * userScale);
	const containerPadY = Math.round(12 * scale * userScale);
	const containerRadius = Math.round(14 * scale * userScale);
	const keyRadius = Math.round(7 * scale * userScale);

	ctx.save();
	ctx.font = `bold ${fontSize}px "SF Pro Display", "SF Pro Text", Helvetica, sans-serif`;

	// Measure all combos
	const comboWidths = activeEvents.map((event) => {
		let w = containerPadX * 2;
		for (let i = 0; i < event.keys.length; i++) {
			const keyW = ctx.measureText(event.keys[i]).width + keyPadX * 2;
			w += keyW;
			if (i < event.keys.length - 1) w += keyGap;
		}
		return w;
	});

	const comboHeight = fontSize + keyPadY * 2;
	const containerHeight = comboHeight + containerPadY * 2;

	const { x: anchorX, y: anchorY } = resolvePosition(settings, canvasWidth, canvasHeight);

	const eventsToRender = stacked ? activeEvents : [activeEvents[activeEvents.length - 1]];
	const widthsToRender = stacked ? comboWidths : [comboWidths[comboWidths.length - 1]];

	eventsToRender.forEach((event, idx) => {
		const alpha = getFadeAlpha(event, currentTimeMs, fadeDurationMs) * opacity;
		if (alpha <= 0) return;

		const comboW = widthsToRender[idx];
		const totalH = containerHeight;

		// Position: anchor is bottom-center of the stack
		const stackOffset = stacked ? (eventsToRender.length - 1 - idx) * (totalH + comboGap) : 0;

		let drawX = anchorX - comboW / 2;
		let drawY = anchorY - totalH - stackOffset;

		// Clamp to canvas
		drawX = Math.max(4, Math.min(canvasWidth - comboW - 4, drawX));
		drawY = Math.max(4, Math.min(canvasHeight - totalH - 4, drawY));

		// Animation offset
		let offsetY = 0;
		if (animStyle === "slide-up") {
			const elapsed = currentTimeMs - event.timeMs;
			const progress = Math.min(1, elapsed / Math.max(1, fadeDurationMs));
			const eased = 1 - Math.pow(1 - progress, 3);
			offsetY = (1 - eased) * 16 * scale * userScale;
		} else if (animStyle === "pop") {
			const elapsed = currentTimeMs - event.timeMs;
			const progress = Math.min(1, elapsed / Math.max(1, fadeDurationMs));
			const popScale = 0.85 + 0.15 * (1 - Math.pow(1 - progress, 3));
			ctx.save();
			ctx.globalAlpha = alpha;
			ctx.translate(drawX + comboW / 2, drawY + totalH / 2);
			ctx.scale(popScale, popScale);
			ctx.translate(-(drawX + comboW / 2), -(drawY + totalH / 2));
		}

		ctx.globalAlpha = alpha;

		// Container background
		if (settings.glassmorphism) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
		} else {
			ctx.fillStyle = "rgba(30, 30, 30, 0.92)";
		}

		// Draw rounded rect container
		ctx.beginPath();
		ctx.roundRect(drawX, drawY + offsetY, comboW, totalH, containerRadius);
		ctx.fill();

		// Border
		ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
		ctx.lineWidth = 1 * scale * userScale;
		ctx.stroke();

		// Draw keys
		let keyX = drawX + containerPadX;
		const keyY = drawY + containerPadY + offsetY;

		for (let i = 0; i < event.keys.length; i++) {
			const keyLabel = event.keys[i];
			const keyW = ctx.measureText(keyLabel).width + keyPadX * 2;

			// Key background
			ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
			ctx.beginPath();
			ctx.roundRect(keyX, keyY, keyW, comboHeight, keyRadius);
			ctx.fill();

			// Key border
			ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
			ctx.lineWidth = 1 * scale * userScale;
			ctx.stroke();

			// Key top highlight
			ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
			ctx.beginPath();
			ctx.roundRect(keyX + 1, keyY + 1, keyW - 2, comboHeight / 2, [keyRadius, keyRadius, 0, 0]);
			ctx.fill();

			// Key text
			ctx.fillStyle = "#ffffff";
			ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			ctx.fillText(keyLabel, keyX + keyW / 2, keyY + comboHeight / 2);

			keyX += keyW + keyGap;
		}

		if (animStyle === "pop") {
			ctx.restore();
		}
	});

	ctx.restore();
}
