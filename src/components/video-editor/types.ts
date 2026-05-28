export type ZoomDepth = 1 | 2 | 3 | 4 | 5 | 6;

export interface ZoomFocus {
	cx: number; // normalized horizontal center (0-1)
	cy: number; // normalized vertical center (0-1)
}

export type ZoomMode = "auto" | "manual";

export interface ZoomRegion {
	id: string;
	startMs: number;
	endMs: number;
	depth: ZoomDepth;
	focus: ZoomFocus;
	mode?: ZoomMode;
	/** When true, this zoom applies to the webcam feed (camera zoom), not the screen. */
	isCameraZoom?: boolean;
}

export interface CursorTelemetryPoint {
	timeMs: number;
	cx: number;
	cy: number;
	pressure?: number;
	interactionType?:
		| "move"
		| "click"
		| "double-click"
		| "right-click"
		| "middle-click"
		| "mouseup";
	cursorType?:
		| "arrow"
		| "text"
		| "pointer"
		| "crosshair"
		| "open-hand"
		| "closed-hand"
		| "resize-ew"
		| "resize-ns"
		| "not-allowed";
}

export interface CursorVisualSettings {
	size: number;
	smoothing: number;
	motionBlur: number;
	clickBounce: number;
	clickBounceDuration: number;
	sway: number;
	style: CursorStyle;
}

export type CursorStyle = "macos" | "tahoe" | "tahoe-inverted" | "dot" | "figma" | (string & {}); // extension-contributed cursor styles
export const DEFAULT_CURSOR_STYLE: CursorStyle = "tahoe";

export type EditorEffectSection =
	| "scene"
	| "cursor"
	| "captions"
	| "webcam"
	| "keyboard"
	| "watermark"
	| "settings"
	| "zoom"
	| "frame"
	| "crop"
	| "extensions"
	| "clip"
	| "audio"
	| `ext:${string}`;

export type ZoomTransitionEasing = "recordly" | "glide" | "smooth" | "snappy" | "linear";

export type WebcamCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export type WebcamPositionPreset =
	| WebcamCorner
	| "top-center"
	| "center-left"
	| "center"
	| "center-right"
	| "bottom-center"
	| "custom";

/**
 * How the webcam is composited onto the canvas.
 * - "overlay": floating bubble (legacy default)
 * - "dock-bottom": webcam fills a full-width band at the bottom; screen recording
 *   is pushed into the top portion and can be masked with a rounded rect.
 * - "dock-bottom-portrait": same as dock-bottom but tuned for 9:16 aspect ratio
 */
export type WebcamLayoutMode = "overlay" | "dock-bottom" | "dock-bottom-portrait";

export interface WebcamOverlaySettings {
	enabled: boolean;
	sourcePath: string | null;
	timeOffsetMs: number;
	mirror: boolean;
	cropRegion: CropRegion;
	corner: WebcamCorner;
	positionPreset: WebcamPositionPreset;
	positionX: number;
	positionY: number;
	size: number;
	reactToZoom: boolean;
	cornerRadius: number;
	shadow: number;
	margin: number;
	morphFrames?: WebcamMorphFrame[];
	/** Layout mode — controls how webcam and screen are composited. Default: "overlay" */
	layoutMode?: WebcamLayoutMode;
	/**
	 * For dock-bottom layouts: fraction of canvas height the webcam section occupies (0–1).
	 * Default: 0.38 for landscape, 0.45 for portrait.
	 */
	dockHeightFraction?: number;
	/**
	 * Corner radius (px at 1920 base width) applied to the screen recording mask
	 * when using dock-bottom layouts. 0 = no mask. Default: 0.
	 */
	screenMaskRadius?: number;
	/**
	 * Per-layout-preset crop regions. Keyed by LayoutPresetId so each layout
	 * remembers its own webcam crop independently.
	 */
	cropRegionByPreset?: Record<string, CropRegion>;
	/** The currently active layout preset id (used to look up cropRegionByPreset). */
	activePresetId?: string;
}

export interface WebcamMorphFrame {
	id: string;
	timeMs: number;
	positionX: number;
	positionY: number;
	size: number;
	cornerRadius: number;
	margin: number;
	shadow: number;
	/** When true the webcam fills the full screen (size=100, cornerRadius=0). */
	fullscreen?: boolean;
}

export const DEFAULT_CURSOR_SIZE = 3.0;
export const DEFAULT_CURSOR_SMOOTHING = 0.0;
export const DEFAULT_CURSOR_MOTION_BLUR = 0.4;
export const DEFAULT_CURSOR_CLICK_BOUNCE = 2.5;
export const DEFAULT_CURSOR_CLICK_BOUNCE_DURATION = 350;
export const DEFAULT_CURSOR_SWAY = 0.4;
export const DEFAULT_CURSOR_AUTO_HIDE = false;
export const DEFAULT_CURSOR_AUTO_HIDE_DELAY_MS = 1500;
export const DEFAULT_CURSOR_OFFSET_MS = 0;
export const DEFAULT_ZOOM_SMOOTHNESS = 0.5;
export const DEFAULT_ZOOM_MOTION_BLUR = 0.35;
export interface ZoomMotionBlurTuning {
	panVelocityThreshold: number;
	zoomVelocityThreshold: number;
	maxDirectionalBlurPx: number;
	maxRadialBlurStrength: number;
	panResponsePerSecond: number;
	zoomResponsePerSecond: number;
	zoomSafeZoneRadiusPx: number;
}

export const DEFAULT_ZOOM_MOTION_BLUR_TUNING: ZoomMotionBlurTuning = {
	panVelocityThreshold: 0,
	zoomVelocityThreshold: 0,
	maxDirectionalBlurPx: 41.8,
	maxRadialBlurStrength: 1,
	panResponsePerSecond: 11,
	zoomResponsePerSecond: 9,
	zoomSafeZoneRadiusPx: 6,
};
export const DEFAULT_ZOOM_IN_DURATION_MS = 1522.575;
export const DEFAULT_ZOOM_IN_OVERLAP_MS = 500;
export const DEFAULT_ZOOM_OUT_DURATION_MS = 1015.05;
export const DEFAULT_CONNECTED_ZOOM_GAP_MS = 1500;
export const DEFAULT_CONNECTED_ZOOM_DURATION_MS = 1000;
export const DEFAULT_ZOOM_IN_EASING: ZoomTransitionEasing = "recordly";
export const DEFAULT_ZOOM_OUT_EASING: ZoomTransitionEasing = "recordly";
export const DEFAULT_CONNECTED_ZOOM_EASING: ZoomTransitionEasing = "glide";
export const DEFAULT_WEBCAM_SIZE = 40;
export const DEFAULT_WEBCAM_REACT_TO_ZOOM = true;
export const DEFAULT_WEBCAM_CORNER_RADIUS = 90;
export const DEFAULT_WEBCAM_SHADOW = 0.67;
export const DEFAULT_WEBCAM_MARGIN = 24;
export const DEFAULT_WEBCAM_POSITION_PRESET: WebcamPositionPreset = "bottom-right";
export const DEFAULT_WEBCAM_POSITION_X = 1;
export const DEFAULT_WEBCAM_POSITION_Y = 1;
export const DEFAULT_WEBCAM_TIME_OFFSET_MS = 0;

export const DEFAULT_WEBCAM_OVERLAY: WebcamOverlaySettings = {
	enabled: false,
	sourcePath: null,
	timeOffsetMs: DEFAULT_WEBCAM_TIME_OFFSET_MS,
	mirror: true,
	cropRegion: { x: 0, y: 0, width: 1, height: 1 },
	corner: "bottom-right",
	positionPreset: DEFAULT_WEBCAM_POSITION_PRESET,
	positionX: DEFAULT_WEBCAM_POSITION_X,
	positionY: DEFAULT_WEBCAM_POSITION_Y,
	size: DEFAULT_WEBCAM_SIZE,
	reactToZoom: DEFAULT_WEBCAM_REACT_TO_ZOOM,
	cornerRadius: DEFAULT_WEBCAM_CORNER_RADIUS,
	shadow: DEFAULT_WEBCAM_SHADOW,
	margin: DEFAULT_WEBCAM_MARGIN,
	morphFrames: [],
};

export interface TrimRegion {
	id: string;
	startMs: number;
	endMs: number;
}

/**
 * A layout keyframe region — stores which webcam layout preset is active
 * during a time range. Rendered on the LAYOUT timeline row.
 */
export interface LayoutRegion {
	id: string;
	startMs: number;
	endMs: number;
	/** The LayoutPresetId to apply during this time range. */
	presetId: string;
}

export interface ClipRegion {
	id: string;
	startMs: number;
	endMs: number;
	speed: number;
	muted?: boolean;
	showSourceAudio?: boolean;
	/**
	 * The offset into the source audio file (in ms) where this clip begins.
	 * For the original unsplit clip this is 0. After a split, the right-hand
	 * piece carries the accumulated offset so the waveform renderer can show
	 * the correct section of the audio file.
	 */
	sourceStartMs?: number;
}

export function getClipSourceEndMs(clip: ClipRegion): number {
	const displayDurationMs = Math.max(0, clip.endMs - clip.startMs);
	const speed = Number.isFinite(clip.speed) && clip.speed > 0 ? clip.speed : 1;
	return Math.round(clip.startMs + displayDurationMs * speed);
}

export function getTimelineDurationMs(clips: ClipRegion[], sourceDurationMs: number): number {
	const baseDurationMs = Math.max(0, Math.round(sourceDurationMs));
	if (clips.length === 0) {
		return baseDurationMs;
	}

	return clips.reduce(
		(durationMs, clip) => Math.max(durationMs, Math.max(0, Math.round(clip.endMs))),
		baseDurationMs,
	);
}

export function sortClipRegions(clips: ClipRegion[]): ClipRegion[] {
	return [...clips].sort((left, right) => left.startMs - right.startMs);
}

function getSafeClipSpeed(clip: ClipRegion) {
	return Number.isFinite(clip.speed) && clip.speed > 0 ? clip.speed : 1;
}

function clampToNearestClipBoundary(
	timeMs: number,
	clips: ClipRegion[],
	kind: "timeline" | "source",
) {
	let nearestTimeMs = Math.round(timeMs);
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const clip of clips) {
		const boundaries =
			kind === "timeline"
				? [clip.startMs, clip.endMs]
				: [clip.startMs, getClipSourceEndMs(clip)];

		for (const boundary of boundaries) {
			const distance = Math.abs(timeMs - boundary);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestTimeMs = Math.round(boundary);
			}
		}
	}

	return nearestTimeMs;
}

export function mapTimelineTimeToSourceTime(timeMs: number, clips: ClipRegion[]): number {
	const roundedTimeMs = Math.round(timeMs);
	const sortedClips = sortClipRegions(clips);

	for (const clip of sortedClips) {
		if (roundedTimeMs < clip.startMs || roundedTimeMs > clip.endMs) {
			continue;
		}

		return Math.round(clip.startMs + (roundedTimeMs - clip.startMs) * getSafeClipSpeed(clip));
	}

	if (sortedClips.length === 0) {
		return roundedTimeMs;
	}

	return clampToNearestClipBoundary(roundedTimeMs, sortedClips, "timeline");
}

export function mapSourceTimeToTimelineTime(timeMs: number, clips: ClipRegion[]): number {
	const roundedTimeMs = Math.round(timeMs);
	const sortedClips = sortClipRegions(clips);

	for (const clip of sortedClips) {
		const sourceEndMs = getClipSourceEndMs(clip);
		if (roundedTimeMs < clip.startMs || roundedTimeMs > sourceEndMs) {
			continue;
		}

		return Math.round(clip.startMs + (roundedTimeMs - clip.startMs) / getSafeClipSpeed(clip));
	}

	if (sortedClips.length === 0) {
		return roundedTimeMs;
	}

	return clampToNearestClipBoundary(roundedTimeMs, sortedClips, "source");
}

export function findClipAtTimelineTime(timeMs: number, clips: ClipRegion[]): ClipRegion | null {
	const roundedTimeMs = Math.round(timeMs);
	return (
		sortClipRegions(clips).find(
			(clip) => roundedTimeMs >= clip.startMs && roundedTimeMs < clip.endMs,
		) ?? null
	);
}

export function extendAutoFullTrackClip(
	clips: ClipRegion[],
	autoClipId: string | null,
	previousAutoEndMs: number | null,
	nextTotalDurationMs: number,
): ClipRegion[] | null {
	if (
		!autoClipId ||
		!Number.isFinite(previousAutoEndMs) ||
		!Number.isFinite(nextTotalDurationMs) ||
		nextTotalDurationMs <= (previousAutoEndMs ?? 0) ||
		clips.length !== 1
	) {
		return null;
	}

	const [clip] = clips;
	if (
		clip.id !== autoClipId ||
		clip.startMs !== 0 ||
		clip.speed !== 1 ||
		clip.endMs !== previousAutoEndMs
	) {
		return null;
	}

	return [{ ...clip, endMs: nextTotalDurationMs }];
}

/** Convert clip regions (kept segments) to trim regions (gaps to remove). */
export function clipsToTrims(clips: ClipRegion[], totalDurationMs: number): TrimRegion[] {
	if (clips.length === 0) return [];
	const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
	const trims: TrimRegion[] = [];
	let cursor = 0;
	let trimId = 1;
	for (const clip of sorted) {
		if (clip.startMs > cursor) {
			trims.push({ id: `trim-gap-${trimId++}`, startMs: cursor, endMs: clip.startMs });
		}
		cursor = getClipSourceEndMs(clip);
	}
	if (cursor < totalDurationMs) {
		trims.push({ id: `trim-gap-${trimId++}`, startMs: cursor, endMs: totalDurationMs });
	}
	return trims;
}

/** Convert legacy trim regions to clip regions (complement). */
export function trimsToClips(trims: TrimRegion[], totalDurationMs: number): ClipRegion[] {
	if (trims.length === 0) return [{ id: "clip-1", startMs: 0, endMs: totalDurationMs, speed: 1 }];
	const sorted = [...trims].sort((a, b) => a.startMs - b.startMs);
	const clips: ClipRegion[] = [];
	let cursor = 0;
	let clipId = 1;
	for (const trim of sorted) {
		if (trim.startMs > cursor) {
			clips.push({ id: `clip-${clipId++}`, startMs: cursor, endMs: trim.startMs, speed: 1 });
		}
		cursor = trim.endMs;
	}
	if (cursor < totalDurationMs) {
		clips.push({ id: `clip-${clipId++}`, startMs: cursor, endMs: totalDurationMs, speed: 1 });
	}
	return clips;
}

export type AnnotationType = "text" | "image" | "figure" | "blur";
export const BLUR_ANNOTATION_STRENGTH = 20;
export const BASE_PREVIEW_WIDTH = 1920;
export const BASE_PREVIEW_HEIGHT = 1080;

export type ArrowDirection =
	| "up"
	| "down"
	| "left"
	| "right"
	| "up-right"
	| "up-left"
	| "down-right"
	| "down-left";

export interface FigureData {
	arrowDirection: ArrowDirection;
	color: string;
	strokeWidth: number;
}

export type InputOverlayMouseAction =
	| "none"
	| "left-click"
	| "right-click"
	| "double-click"
	| "middle-click"
	| "scroll-up"
	| "scroll-down";

export interface InputOverlayData {
	keys: string[];
	mouseAction: InputOverlayMouseAction;
}

export interface AnnotationPosition {
	x: number;
	y: number;
}

export interface AnnotationSize {
	width: number;
	height: number;
}

export interface AnnotationTextStyle {
	color: string;
	backgroundColor: string;
	fontSize: number; // pixels
	fontFamily: string;
	fontWeight: "normal" | "bold";
	fontStyle: "normal" | "italic";
	textDecoration: "none" | "underline";
	textAlign: "left" | "center" | "right";
	borderRadius: number;
}

function getDefaultAnnotationFontFamily() {
	return '"SF Pro Display", "SF Pro Text", Helvetica, sans-serif';
}

export function getDefaultCaptionFontFamily() {
	return '"SF Pro Text", "SF Pro Display", Helvetica, sans-serif';
}

export interface AnnotationRegion {
	id: string;
	startMs: number;
	endMs: number;
	type: AnnotationType;
	content: string; // Legacy - still used for current type
	textContent?: string; // Separate storage for text
	imageContent?: string; // Separate storage for image data URL
	position: AnnotationPosition;
	size: AnnotationSize;
	style: AnnotationTextStyle;
	zIndex: number;
	trackIndex?: number;
	figureData?: FigureData;
	blurIntensity?: number;
	blurColor?: string;
	inputData?: InputOverlayData;
}

export const DEFAULT_ANNOTATION_POSITION: AnnotationPosition = {
	x: 50,
	y: 50,
};

export const DEFAULT_ANNOTATION_SIZE: AnnotationSize = {
	width: 30,
	height: 20,
};

export const DEFAULT_ANNOTATION_STYLE: AnnotationTextStyle = {
	color: "#ffffff",
	backgroundColor: "transparent",
	fontSize: 32,
	fontFamily: getDefaultAnnotationFontFamily(),
	fontWeight: "bold",
	fontStyle: "normal",
	textDecoration: "none",
	textAlign: "center",
	borderRadius: 8,
};

export const DEFAULT_FIGURE_DATA: FigureData = {
	arrowDirection: "right",
	color: "#2563EB",
	strokeWidth: 4,
};

export const DEFAULT_INPUT_OVERLAY_DATA: InputOverlayData = {
	keys: ["Ctrl", "K"],
	mouseAction: "none",
};

export interface CropRegion {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const DEFAULT_CROP_REGION: CropRegion = {
	x: 0,
	y: 0,
	width: 1,
	height: 1,
};

export interface Padding {
	top: number;
	bottom: number;
	left: number;
	right: number;
	linked?: boolean;
}

export const DEFAULT_PADDING: Padding = {
	top: 20,
	bottom: 20,
	left: 20,
	right: 20,
	linked: true,
};
export type {
	SourceAudioTrackSetting,
	SourceAudioTrackSettings,
} from "@/components/video-editor/audio/audioTypes";

export interface AudioRegion {
	id: string;
	startMs: number;
	endMs: number;
	audioPath: string;
	volume: number;
	normalize?: boolean;
	trackIndex?: number;
}

export interface CaptionCue {
	id: string;
	startMs: number;
	endMs: number;
	text: string;
	words?: CaptionCueWord[];
}

export interface CaptionCueWord {
	text: string;
	startMs: number;
	endMs: number;
	leadingSpace?: boolean;
}

export type AutoCaptionAnimation = "none" | "fade" | "rise" | "pop";

export interface AutoCaptionSettings {
	enabled: boolean;
	language: string;
	fontFamily: string;
	fontSize: number;
	bottomOffset: number;
	maxWidth: number;
	maxRows: number;
	animationStyle: AutoCaptionAnimation;
	boxRadius: number;
	textColor: string;
	inactiveTextColor: string;
	backgroundOpacity: number;
}

export const DEFAULT_AUTO_CAPTION_SETTINGS: AutoCaptionSettings = {
	enabled: false,
	language: "auto",
	fontFamily: getDefaultCaptionFontFamily(),
	fontSize: 30,
	bottomOffset: 3,
	maxWidth: 62,
	maxRows: 1,
	animationStyle: "fade",
	boxRadius: 17.5,
	textColor: "#FFFFFF",
	inactiveTextColor: "#A3A3A3",
	backgroundOpacity: 0.9,
};

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1.25 | 1.5 | 1.75 | 2;

export interface SpeedRegion {
	id: string;
	startMs: number;
	endMs: number;
	speed: PlaybackSpeed;
}

export const SPEED_OPTIONS: Array<{ speed: PlaybackSpeed; label: string }> = [
	{ speed: 0.25, label: "0.25×" },
	{ speed: 0.5, label: "0.5×" },
	{ speed: 0.75, label: "0.75×" },
	{ speed: 1.25, label: "1.25×" },
	{ speed: 1.5, label: "1.5×" },
	{ speed: 1.75, label: "1.75×" },
	{ speed: 2, label: "2×" },
];

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1.5;

export const ZOOM_DEPTH_SCALES: Record<ZoomDepth, number> = {
	1: 1.25,
	2: 1.5,
	3: 1.8,
	4: 2.2,
	5: 3.5,
	6: 5.0,
};

export const DEFAULT_ZOOM_DEPTH: ZoomDepth = 3;
export const DEFAULT_AUTO_ZOOM_DEPTH: ZoomDepth = 2;

export function clampFocusToDepth(focus: ZoomFocus, _depth: ZoomDepth): ZoomFocus {
	return {
		cx: clamp(focus.cx, 0, 1),
		cy: clamp(focus.cy, 0, 1),
	};
}

function clamp(value: number, min: number, max: number) {
	if (Number.isNaN(value)) return (min + max) / 2;
	return Math.min(max, Math.max(min, value));
}

// ─── Keyboard Overlay ────────────────────────────────────────────────────────

export type KeyboardOverlayPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "center-left"
	| "center"
	| "center-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right"
	| "custom";

/** Custom position (0–1 normalized, used when position = "custom") */

export type KeyboardOverlayAnimationStyle = "fade" | "slide-up" | "pop" | "none";

export type KeyboardOverlayModifierStyle = "symbol" | "text" | "mixed";

/** A single keyboard event captured during recording. */
export interface KeyboardOverlayEvent {
	/** Timeline time in ms when the key combo appeared. */
	timeMs: number;
	/** How long to display this combo (ms). */
	durationMs: number;
	/** Normalized key labels, e.g. ["Ctrl", "K"] */
	keys: string[];
}

export interface KeyboardOverlaySettings {
	enabled: boolean;
	position: KeyboardOverlayPosition;
	/** Custom X position (0–1), used when position = "custom" */
	positionX: number;
	/** Custom Y position (0–1), used when position = "custom" */
	positionY: number;
	/** Scale multiplier (0.5 – 2.0) */
	scale: number;
	/** Overall opacity (0 – 1) */
	opacity: number;
	animationStyle: KeyboardOverlayAnimationStyle;
	/** Fade-in / fade-out duration in ms */
	fadeDurationMs: number;
	/** Whether to use glassmorphism backdrop */
	glassmorphism: boolean;
	modifierStyle: KeyboardOverlayModifierStyle;
	/** Stack multiple active combos vertically */
	stackedDisplay: boolean;
	/** Maximum number of combos visible at once */
	maxVisible: number;
	/** Recorded keyboard events (populated during recording / import) */
	events: KeyboardOverlayEvent[];
}

export const DEFAULT_KEYBOARD_OVERLAY_SETTINGS: KeyboardOverlaySettings = {
	enabled: false,
	position: "bottom-center",
	positionX: 0.5,
	positionY: 1.0,
	scale: 1.0,
	opacity: 1.0,
	animationStyle: "fade",
	fadeDurationMs: 180,
	glassmorphism: true,
	modifierStyle: "mixed",
	stackedDisplay: true,
	maxVisible: 3,
	events: [],
};

// ─── Watermark ────────────────────────────────────────────────────────────────

export type WatermarkType = "text" | "image";

export type WatermarkPosition =
	| "top-left"
	| "top-center"
	| "top-right"
	| "center-left"
	| "center"
	| "center-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right"
	| "custom";

export type WatermarkAnimationStyle = "none" | "pulse" | "fade-in-out";

export interface WatermarkSettings {
	enabled: boolean;
	type: WatermarkType;
	/** Text content (used when type = "text") */
	text: string;
	/** Image data URL (used when type = "image") */
	imageDataUrl: string | null;
	position: WatermarkPosition;
	/** Custom X position (0–1) */
	positionX: number;
	/** Custom Y position (0–1) */
	positionY: number;
	/** Scale multiplier (0.1 – 3.0) */
	scale: number;
	/** Opacity (0 – 1) */
	opacity: number;
	/** Font size in px (for text watermarks) */
	fontSize: number;
	/** Text color */
	color: string;
	/** Font family */
	fontFamily: string;
	/** Animation style */
	animationStyle: WatermarkAnimationStyle;
	/** Padding from edge in px (at 1920 base width) */
	padding: number;
}

export const DEFAULT_WATERMARK_SETTINGS: WatermarkSettings = {
	enabled: false,
	type: "text",
	text: "© My Brand",
	imageDataUrl: null,
	position: "bottom-right",
	positionX: 1,
	positionY: 1,
	scale: 1.0,
	opacity: 0.6,
	fontSize: 28,
	color: "#FFFFFF",
	fontFamily: '"SF Pro Display", "SF Pro Text", Helvetica, sans-serif',
	animationStyle: "none",
	padding: 32,
};
