/**
 * watermarkRenderer
 *
 * Renders a text or image watermark onto a 2D canvas.
 * Used by both the live preview (VideoPlayback) and the export pipeline
 * (modernFrameRenderer) so the output is pixel-identical.
 */

import type { WatermarkSettings } from "@/components/video-editor/types";
import { decodeGif, getGifFrameAtTime } from "./gifDecoder";

const imageCache = new Map<string, HTMLImageElement>();

/** Cache for offscreen video elements used for video watermarks */
const videoElementCache = new Map<string, HTMLVideoElement>();

/** Reusable offscreen canvas for painting GIF ImageData frames */
let gifOffscreenCanvas: OffscreenCanvas | null = null;
let gifOffscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

function getOrCreateGifOffscreenCanvas(width: number, height: number): OffscreenCanvas {
	if (!gifOffscreenCanvas || gifOffscreenCanvas.width !== width || gifOffscreenCanvas.height !== height) {
		gifOffscreenCanvas = new OffscreenCanvas(width, height);
		gifOffscreenCtx = gifOffscreenCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
	}
	return gifOffscreenCanvas;
}

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

/**
 * Returns a cached offscreen HTMLVideoElement for the given data URL,
 * creating and loading it on first access.
 */
function getOrCreateVideoElement(dataUrl: string): Promise<HTMLVideoElement> {
	const cached = videoElementCache.get(dataUrl);
	if (cached) return Promise.resolve(cached);
	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		video.muted = true;
		video.playsInline = true;
		video.preload = "auto";
		video.onloadedmetadata = () => {
			videoElementCache.set(dataUrl, video);
			resolve(video);
		};
		video.onerror = reject;
		video.src = dataUrl;
		video.load();
	});
}

/**
 * Seeks an HTMLVideoElement to the given time (in seconds).
 * Resolves when the seek completes or rejects after a 2-second timeout.
 */
function seekVideoElement(video: HTMLVideoElement, timeSeconds: number): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error("[watermarkRenderer] Video seek timed out"));
		}, 2000);

		const onSeeked = () => {
			clearTimeout(timeout);
			video.removeEventListener("seeked", onSeeked);
			resolve();
		};

		video.addEventListener("seeked", onSeeked);
		video.currentTime = timeSeconds;
	});
}

export function getAnchorXY(
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

export function computeAnimatedOpacity(
	settings: WatermarkSettings,
	currentTimeMs: number,
): number {
	if (settings.animationStyle === "none") return settings.opacity;

	if (settings.animationStyle === "pulse") {
		// Gentle pulse: opacity oscillates between 70% and 100% of base opacity
		const t = (currentTimeMs / 1000) % 2; // 2-second cycle
		const factor = Math.max(0.7, Math.min(1.0, 0.7 + 0.3 * Math.sin(Math.PI * t)));
		return settings.opacity * factor;
	}

	if (settings.animationStyle === "fade-in-out") {
		// Slow fade in/out: 3-second cycle
		const t = (currentTimeMs / 3000) % 1;
		const factor = 0.5 + 0.5 * Math.sin(2 * Math.PI * t);
		return settings.opacity * Math.max(0.1, Math.min(1.0, factor));
	}

	if (settings.animationStyle === "fade-in") {
		// Linear ramp from 0 to baseOpacity over the first 1000ms
		const progress = Math.min(1, currentTimeMs / 1000);
		return settings.opacity * progress;
	}

	return settings.opacity;
}

const SLIDE_DURATION_MS = 600;

/**
 * Returns a {dx, dy} pixel offset to apply to the watermark position
 * for slide-in animations. Returns {dx:0, dy:0} for non-slide styles.
 */
export function computeAnimatedOffset(
	settings: WatermarkSettings,
	currentTimeMs: number,
	canvasWidth: number,
	canvasHeight: number,
): { dx: number; dy: number } {
	const style = settings.animationStyle;

	if (
		style !== "slide-in-left" &&
		style !== "slide-in-right" &&
		style !== "slide-in-top" &&
		style !== "slide-in-bottom"
	) {
		return { dx: 0, dy: 0 };
	}

	const progress = Math.min(1, currentTimeMs / SLIDE_DURATION_MS);
	// ease-out cubic: 1 - (1 - t)^3
	const eased = 1 - Math.pow(1 - progress, 3);
	// At progress=0, slideAmount=1 (full off-screen). At progress=1, slideAmount=0 (in place).
	const slideAmount = 1 - eased;

	switch (style) {
		case "slide-in-left":
			return { dx: -canvasWidth * slideAmount, dy: 0 };
		case "slide-in-right":
			return { dx: canvasWidth * slideAmount, dy: 0 };
		case "slide-in-top":
			return { dx: 0, dy: -canvasHeight * slideAmount };
		case "slide-in-bottom":
			return { dx: 0, dy: canvasHeight * slideAmount };
	}
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

		// Apply slide-in animation offset
		const { dx, dy } = computeAnimatedOffset(settings, currentTimeMs, canvasWidth, canvasHeight);
		ctx.fillText(settings.text, x + dx, y + dy);
	} else if (settings.type === "image" && settings.imageDataUrl) {
		if (settings.imageDataUrl.startsWith("data:image/gif")) {
			// GIF branch: decode frames and select the correct one by timestamp
			try {
				const gif = await decodeGif(settings.imageDataUrl);
				const frame = getGifFrameAtTime(gif, currentTimeMs);

				const baseSize = Math.min(canvasWidth, canvasHeight) * 0.15 * settings.scale;
				const aspect = frame.imageData.width / frame.imageData.height;
				const drawW = baseSize * aspect;
				const drawH = baseSize;

				let drawX = x;
				let drawY = y;

				if (alignX === "center") drawX = x - drawW / 2;
				else if (alignX === "right") drawX = x - drawW;

				if (alignY === "bottom") drawY = y - drawH;

				// Apply slide-in animation offset
				const { dx, dy } = computeAnimatedOffset(settings, currentTimeMs, canvasWidth, canvasHeight);
				drawX += dx;
				drawY += dy;

				// Paint ImageData to the reusable offscreen canvas, then drawImage to main context
				const offscreen = getOrCreateGifOffscreenCanvas(frame.imageData.width, frame.imageData.height);
				gifOffscreenCtx!.putImageData(frame.imageData, 0, 0);

				// Subtle shadow
				ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
				ctx.shadowBlur = 6 * scaleFactor;

				ctx.drawImage(offscreen, drawX, drawY, drawW, drawH);
			} catch {
				console.warn("[watermarkRenderer] GIF frame decode failed, skipping.");
			}
		} else {
			// Static image branch (PNG, JPEG, WebP, SVG, etc.)
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

				// Apply slide-in animation offset
				const { dx, dy } = computeAnimatedOffset(settings, currentTimeMs, canvasWidth, canvasHeight);
				drawX += dx;
				drawY += dy;

				// Subtle shadow
				ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
				ctx.shadowBlur = 6 * scaleFactor;

				ctx.drawImage(img, drawX, drawY, drawW, drawH);
			} catch {
				// Image failed to load — skip silently
			}
		}
	} else if (settings.type === "video" && settings.videoDataUrl) {
		try {
			const video = await getOrCreateVideoElement(settings.videoDataUrl);
			const sourceDurationMs = (video.duration || 1) * 1000;
			const loopedTimeMs = currentTimeMs % sourceDurationMs;
			await seekVideoElement(video, loopedTimeMs / 1000);

			// Same sizing logic as image watermarks
			const baseSize = Math.min(canvasWidth, canvasHeight) * 0.15 * settings.scale;
			const aspect =
				video.videoWidth > 0 && video.videoHeight > 0
					? video.videoWidth / video.videoHeight
					: 16 / 9;
			const drawW = baseSize * aspect;
			const drawH = baseSize;

			let drawX = x;
			let drawY = y;

			if (alignX === "center") drawX = x - drawW / 2;
			else if (alignX === "right") drawX = x - drawW;

			if (alignY === "bottom") drawY = y - drawH;

			// Apply slide-in animation offset
			const { dx, dy } = computeAnimatedOffset(settings, currentTimeMs, canvasWidth, canvasHeight);
			drawX += dx;
			drawY += dy;

			// Subtle shadow
			ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
			ctx.shadowBlur = 6 * scaleFactor;

			ctx.drawImage(video, drawX, drawY, drawW, drawH);
		} catch {
			console.warn("[watermarkRenderer] Video watermark frame unavailable, skipping.");
		}
	}

	ctx.restore();
}
