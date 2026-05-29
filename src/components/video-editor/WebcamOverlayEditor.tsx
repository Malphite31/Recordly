/**
 * WebcamOverlayEditor — interactive drag handles for repositioning/resizing
 * the webcam bubble directly in the preview.
 *
 * This is a stub implementation that renders nothing visible but satisfies
 * the import. A full implementation can be added later.
 */

import type { WebcamOverlaySettings } from "./types";

interface WebcamOverlayEditorProps {
	containerWidth: number;
	containerHeight: number;
	webcam: WebcamOverlaySettings;
	onWebcamChange: (patch: Partial<WebcamOverlaySettings>) => void;
	onOpenCrop?: () => void;
	bubbleRect: { x: number; y: number; w: number; h: number } | null;
}

export function WebcamOverlayEditor(_props: WebcamOverlayEditorProps) {
	// Stub — interactive webcam drag handles not yet implemented.
	return null;
}
