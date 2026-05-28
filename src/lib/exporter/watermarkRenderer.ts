/**
 * watermarkRenderer
 *
 * Renders a text or image watermark onto a 2D canvas.
 * Used by both the live preview (VideoPlayback) and the export pipeline
 * (modernFrameRenderer) so the output is pixel-identical.
 */

import type { WatermarkSettings } from "@/components/video-editor/types";

const imageCache = new Map<string, HTMLImageElement>();

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
	const cached = imageCache.get(dataUrl);
	if (cached) return Promise.resolve(cached);
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			imageCache.set(dataUrl, img);
			resolve(img);
		};
		img.onerror = reject;
		img.src = dataUrl;
	});
}

function getAnchorXY(
	settings: WatermarkSettings,
	canvasWidth: number,
	canvasHeight: number,
	padding: number,
): { x: number; y: number; alignX: "left" | "center" | "right"; alignY: "top" | "bottom" } {
	let nx: number;
	let ny: number;

	switch (settings.position) {
		case "top-left":      nx = 0;   ny = 0;   break;
		case "top-center":    nx = 0.5; ny = 0;   break;
		case "top-right":     nx = 1;   ny = 0;   break;
		case "center-left":   nx = 0;   ny = 0.5; break;
		case "center":        nx = 0.5; ny = 0.5; break;
		case "center-right":  nx = 1;   ny = 0.5; break;
		case "bottom-left":   nx = 0;   ny = 1;   break;
		case "bottom-center": nx = 0.5; ny = 1;   break;
		case "bottom-right":  nx = 1;   ny = 1;   break;
		case "custom":
			nx = Math.max(0, Math.min(1, settings.positionX));
			ny = Math.max(0, Math.min(1, settings.positionY));
			break;
		default:
			nx = 1; ny = 1;
	}

	const usableW = canvasWidth - padding * 2;
	const usableH = canvasHeight - padding * 2;
	const x = padding + usableW * nx;
	const y = padding + usableH * ny;

	const alignX: "left" | "center" | "right" = nx < 0.33 ? "left" : nx > 0.67 ? "right" : "center";
	const alignY: "top" | "bottom" = ny <= 0.5 ? "top" : "bottom";

	return { x, y, alignX, alignY };
}

function computeAnimatedOpacity(
	settings: WatermarkSettings,
	currentTimeMs: number,
): number {
	if (settings.animationStyle === "none") return settings.opacity;

	if (settings.animationStyle === "pulse") {
		// Gentle pulse: opacity oscillates between 60% and 100% of base opacity
		const t = (currentTimeMs / 1000) % 2; // 2-second cycle
		const factor = 0.7 + 0.3 * Math.sin(Math.PI * t);
		return settings.opacity * factor;
	}

	if (settings.animationStyle === "fade-in-out") {
		// Slow fade in/out: 3-second cycle
		const t = (currentTimeMs / 3000) % 1;
		const factor = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
		return settings.opacity * Math.max(0.1, factor);
	}

	return settings.opacity;
}

export async function renderWatermark(
	ctx: CanvasRenderingContext2D,
	settings: WatermarkSettings,
	currentTimeMs: number,
	canvasWidth: number,
	canvasHeight: number,
): Promise<void> {
	if (!settings.enabled) return;

	const scaleFactor = canvasWidth / 1920;
	const padding = settings.padding * scaleFactor;
	const opacity = computeAnimatedOpacity(settings, currentTimeMs);

	const { x, y, alignX, alignY } = getAnchorXY(settings, canvasWidth, canvasHeight, padding);

	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

	if (settings.type === "text") {
		const fontSize = settings.fontSize * scaleFactor * settings.scale;
		ctx.font = `bold ${fontSize}px ${settings.fontFamily}`;
		ctx.fillStyle = settings.color;
		ctx.textBaseline = alignY === "top" ? "top" : "bottom";
		ctx.textAlign = alignX;

		// Subtle text shadow for readability
		ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
		ctx.shadowBlur = 4 * scaleFactor;
		ctx.shadowOffsetX = 1 * scaleFactor;
		ctx.shadowOffsetY = 1 * scaleFactor;

		ctx.fillText(settings.text, x, y);
	} else if (settings.type === "image" && settings.imageDataUrl) {
		try {
			const img = await loadImage(settings.imageDataUrl);
			const baseSize = Math.min(canvasWidth, canvasHeight) * 0.15 * settings.scale;
			const aspect = img.width / img.height;
			const drawW = baseSize * aspect;
			const drawH = baseSize;

			let drawX = x;
			let drawY = y;

			if (alignX === "center") drawX = x - drawW / 2;
			else if (alignX === "right") drawX = x - drawW;

			if (alignY === "bottom") drawY = y - drawH;

			// Subtle shadow
			ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
			ctx.shadowBlur = 6 * scaleFactor;

			ctx.drawImage(img, drawX, drawY, drawW, drawH);
		} catch {
			// Image failed to load — skip silently
		}
	}

	ctx.restore();
}
