import { formatClipSpeedLabel } from "../../clipSpeedChange";
import type {
	AnnotationRegion,
	AudioRegion,
	ClipRegion,
	KeyboardOverlayEvent,
	LayoutRegion,
	ZoomRegion,
} from "../../types";
import { CAMERA_ZOOM_ROW_ID, CLIP_ROW_ID, KEYBOARD_ROW_ID, LAYOUT_ROW_ID, WEBCAM_ROW_ID, ZOOM_ROW_ID } from "../core/constants";
import {
	getAnnotationTrackIndex,
	getAnnotationTrackRowId,
	getAudioTrackIndex,
	getAudioTrackRowId,
	isAnnotationTrackRowId,
	isAudioTrackRowId,
} from "../core/rows";
import type { TimelineRegionSpan, TimelineRenderItem } from "../core/timelineTypes";

export function getAnnotationLabel(region: AnnotationRegion): string {
	if (region.type === "text") {
		const preview = region.content.trim() || "Empty text";
		return preview.length > 20 ? `${preview.substring(0, 20)}...` : preview;
	}
	if (region.type === "image") {
		return "Image";
	}
	return "Annotation";
}

export function getAudioLabel(region: AudioRegion): string {
	return region.audioPath.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "Audio";
}

export function buildTimelineItems(params: {
	zoomRegions: ZoomRegion[];
	clipRegions: ClipRegion[];
	annotationRegions: AnnotationRegion[];
	audioRegions: AudioRegion[];
	layoutRegions?: LayoutRegion[];
	keyboardEvents?: KeyboardOverlayEvent[];
	webcamSpan?: { startMs: number; endMs: number } | null;
	sourceAudioStartDelayMsByPath?: Record<string, number>;
}): TimelineRenderItem[] {
	const { zoomRegions, clipRegions, annotationRegions, audioRegions, layoutRegions = [], keyboardEvents = [], webcamSpan, sourceAudioStartDelayMsByPath = {} } = params;
	void sourceAudioStartDelayMsByPath;

	const zooms: TimelineRenderItem[] = zoomRegions.map((region, index) => ({
		id: region.id,
		rowId: region.isCameraZoom ? CAMERA_ZOOM_ROW_ID : ZOOM_ROW_ID,
		span: { start: region.startMs, end: region.endMs },
		label: region.isCameraZoom ? `Cam Zoom ${index + 1}` : `Zoom ${index + 1}`,
		zoomDepth: region.depth,
		zoomMode: region.mode ?? "auto",
		variant: "zoom",
	}));

	const clips: TimelineRenderItem[] = clipRegions.map((region, index) => {
		const displayDurationMs = Math.max(0, region.endMs - region.startMs);
		const speed = Number.isFinite(region.speed) && region.speed > 0 ? region.speed : 1;
		const sourceAudioDurationMs = displayDurationMs * speed;
		const sourceStart = region.sourceStartMs ?? 0;
		const speedLabel = formatClipSpeedLabel(speed);
		return {
			id: region.id,
			rowId: CLIP_ROW_ID,
			span: { start: region.startMs, end: region.endMs },
			sourceSpan: { start: sourceStart, end: sourceStart + sourceAudioDurationMs },
			label: speedLabel ? `Clip ${index + 1} ${speedLabel}` : `Clip ${index + 1}`,
			speedValue: speedLabel ? speed : undefined,
			showSourceAudio: region.showSourceAudio,
			muted: Boolean(region.muted),
			variant: "clip",
		};
	});

	// Layout regions — proper type, not annotation hack
	const layouts: TimelineRenderItem[] = layoutRegions.map((region) => ({
		id: region.id,
		rowId: LAYOUT_ROW_ID,
		span: { start: region.startMs, end: region.endMs },
		label: region.presetId,
		variant: "annotation" as const,
	}));

	// Annotations — only real annotations (no layout hack)
	const annotations: TimelineRenderItem[] = annotationRegions
		.filter((r) => r.trackIndex !== -1)
		.map((region) => ({
			id: region.id,
			rowId: getAnnotationTrackRowId(region.trackIndex ?? 0),
			span: { start: region.startMs, end: region.endMs },
			label: getAnnotationLabel(region),
			variant: "annotation" as const,
		}));

	const audios: TimelineRenderItem[] = audioRegions.map((region) => ({
		id: region.id,
		rowId: getAudioTrackRowId(region.trackIndex ?? 0),
		span: { start: region.startMs, end: region.endMs },
		label: getAudioLabel(region),
		audioPath: region.audioPath,
		audioGain: region.volume,
		audioNormalize: Boolean(region.normalize),
		variant: "audio",
	}));

	const keyboards: TimelineRenderItem[] = keyboardEvents.map((event, index) => ({
		id: `keyboard-event-${index}`,
		rowId: KEYBOARD_ROW_ID,
		span: { start: event.timeMs, end: event.timeMs + event.durationMs },
		label: event.keys.join(" + "),
		keyboardKeys: event.keys,
		variant: "keyboard",
	}));

	const webcams: TimelineRenderItem[] = webcamSpan
		? [{ id: "webcam-overlay", rowId: WEBCAM_ROW_ID, span: { start: webcamSpan.startMs, end: webcamSpan.endMs }, label: "Webcam", variant: "annotation" as const }]
		: [];

	return [...zooms, ...clips, ...layouts, ...annotations, ...audios, ...keyboards, ...webcams];
}

export function buildAllRegionSpans(params: {
	zoomRegions: ZoomRegion[];
	clipRegions: ClipRegion[];
	audioRegions: AudioRegion[];
}): TimelineRegionSpan[] {
	const { zoomRegions, clipRegions, audioRegions } = params;
	const zooms = zoomRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: ZOOM_ROW_ID,
	}));
	const clips = clipRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: CLIP_ROW_ID,
	}));
	const audios = audioRegions.map((r) => ({
		id: r.id,
		start: r.startMs,
		end: r.endMs,
		rowId: getAudioTrackRowId(r.trackIndex ?? 0),
	}));
	return [...zooms, ...clips, ...audios];
}

export function resolveDropRowId(
	id: string,
	proposedRowId: string,
	timelineItems: TimelineRenderItem[],
) {
	const currentRowId = timelineItems.find((item) => item.id === id)?.rowId;
	if (!currentRowId) {
		return proposedRowId;
	}

	if (isAnnotationTrackRowId(currentRowId)) {
		return isAnnotationTrackRowId(proposedRowId)
			? getAnnotationTrackRowId(getAnnotationTrackIndex(proposedRowId))
			: currentRowId;
	}

	if (isAudioTrackRowId(currentRowId)) {
		return isAudioTrackRowId(proposedRowId)
			? getAudioTrackRowId(getAudioTrackIndex(proposedRowId))
			: currentRowId;
	}

	return currentRowId;
}
