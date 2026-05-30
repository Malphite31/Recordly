import { useTimelineContext } from "dnd-timeline";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { AudioPeaksData } from "../../core/timelineTypes";

interface AudioWaveformProps {
	peaks: AudioPeaksData;
	/** Audio-file time (ms) where the segment starts. */
	segmentStartMs?: number;
	/** Audio-file time (ms) where the segment ends. */
	segmentEndMs?: number;
	/**
	 * The item's timeline span (ms). When provided together with segmentStartMs/End,
	 * the waveform correctly handles partial visibility (scrolled/zoomed timeline).
	 */
	itemSpanStartMs?: number;
	itemSpanEndMs?: number;
	gain?: number;
	normalize?: boolean;
	className?: string;
}

/**
 * Renders an audio waveform as a canvas that fills its parent container.
 * Automatically syncs with the timeline's visible range so the waveform
 * scrolls and zooms together with the clip items above it.
 */
function AudioWaveformComponent({
	peaks,
	segmentStartMs,
	segmentEndMs,
	itemSpanStartMs,
	itemSpanEndMs,
	gain = 1,
	normalize = false,
	className,
}: AudioWaveformProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const { range } = useTimelineContext();
	const [resizeKey, setResizeKey] = useState(0);
	const lastDrawAtRef = useRef(0);

	// Bump resizeKey when the canvas element changes size.
	const observerRef = useRef<ResizeObserver | null>(null);
	const setCanvasRef = useCallback((node: HTMLCanvasElement | null) => {
		if (observerRef.current) {
			observerRef.current.disconnect();
			observerRef.current = null;
		}
		(canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node;
		if (node) {
			const ro = new ResizeObserver(() => setResizeKey((k) => k + 1));
			ro.observe(node);
			observerRef.current = ro;
		}
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let rafId = 0;
		let timeoutId = 0;

		const draw = () => {
			rafId = 0;
			const now = performance.now();
			const elapsed = now - lastDrawAtRef.current;
			if (elapsed < 33) {
				timeoutId = window.setTimeout(() => {
					timeoutId = 0;
					rafId = requestAnimationFrame(draw);
				}, 33 - elapsed);
				return;
			}
			lastDrawAtRef.current = now;

			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const rect = canvas.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;
			const width = Math.round(rect.width * dpr);
			const height = Math.round(rect.height * dpr);

			if (width === 0 || height === 0) return;

			canvas.width = width;
			canvas.height = height;

			ctx.clearRect(0, 0, width, height);

			const { peaks: peakData, durationMs } = peaks;
			if (durationMs <= 0 || peakData.length === 0) return;

			// Determine which portion of the audio file is visible in the canvas.
			//
			// The canvas fills the *visible* portion of the item (dnd-timeline clips
			// items to the viewport via itemContentStyle padding). We need to map
			// canvas pixels → audio-file time correctly.
			//
			// If we know the item's full timeline span and the audio segment bounds,
			// we can compute which audio slice corresponds to the visible pixels.
			let audioStartMs: number;
			let audioEndMs: number;

			if (
				segmentStartMs !== undefined &&
				segmentEndMs !== undefined &&
				itemSpanStartMs !== undefined &&
				itemSpanEndMs !== undefined
			) {
				const itemDurationMs = Math.max(1, itemSpanEndMs - itemSpanStartMs);
				const audioDuration = segmentEndMs - segmentStartMs;

				// Visible timeline window clipped to the item's span
				const visibleTimelineStart = Math.max(range.start, itemSpanStartMs);
				const visibleTimelineEnd = Math.min(range.end, itemSpanEndMs);

				if (visibleTimelineEnd <= visibleTimelineStart) return;

				// Map visible timeline window → audio-file time
				const ratio = audioDuration / itemDurationMs;
				audioStartMs = segmentStartMs + (visibleTimelineStart - itemSpanStartMs) * ratio;
				audioEndMs = segmentStartMs + (visibleTimelineEnd - itemSpanStartMs) * ratio;
			} else {
				// Fallback: draw the full segment across the canvas
				audioStartMs = segmentStartMs ?? 0;
				audioEndMs = segmentEndMs ?? (range.end - range.start);
			}

			const audioDurationMs = audioEndMs - audioStartMs;
			if (audioDurationMs <= 0) return;

			const midY = height / 2;
			ctx.beginPath();

			for (let px = 0; px < width; px++) {
				const t = audioStartMs + (px / width) * audioDurationMs;

				if (t < 0 || t > durationMs) continue;

				const exactIndex = (t / durationMs) * (peakData.length - 1);
				const leftIndex = Math.floor(exactIndex);
				const rightIndex = Math.min(peakData.length - 1, leftIndex + 1);
				const mix = exactIndex - leftIndex;

				let amplitude = peakData[leftIndex] * (1 - mix) + peakData[rightIndex] * mix;

				if (normalize) amplitude = Math.sqrt(Math.max(0, amplitude));
				amplitude = Math.max(0, Math.min(1, amplitude * gain));

				const barHeight = amplitude * midY * 0.85;

				ctx.moveTo(px, midY - barHeight);
				ctx.lineTo(px, midY + barHeight);
			}

			ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
			ctx.lineWidth = dpr;
			ctx.stroke();
		};
		rafId = requestAnimationFrame(draw);
		return () => {
			if (rafId) cancelAnimationFrame(rafId);
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [gain, normalize, peaks, range.start, range.end, resizeKey, segmentStartMs, segmentEndMs, itemSpanStartMs, itemSpanEndMs]);

	return (
		<canvas
			ref={setCanvasRef}
			className={className ?? "absolute inset-0 w-full h-full pointer-events-none"}
			style={{ display: "block" }}
		/>
	);
}

export default memo(AudioWaveformComponent);
