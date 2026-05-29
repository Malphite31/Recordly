/**
 * LayoutPresetsPanel — visual panel for switching between webcam layout presets.
 *
 * This is a stub implementation that renders nothing visible but satisfies
 * the import. A full implementation can be added later.
 */

import type { WebcamOverlaySettings, CropRegion } from "./types";
import type { AspectRatio } from "@/utils/aspectRatioUtils";

interface LayoutPresetsPanelProps {
	webcam: WebcamOverlaySettings;
	onWebcamChange: (webcam: WebcamOverlaySettings) => void;
	hasWebcam: boolean;
	aspectRatio: AspectRatio;
	onAspectRatioChange?: (ratio: AspectRatio) => void;
	onPresetApplied?: () => void;
	screenVideoEl?: HTMLVideoElement | null;
	webcamVideoEl?: HTMLVideoElement | null;
	currentTime?: number;
}

export function LayoutPresetsPanel(_props: LayoutPresetsPanelProps) {
	// Stub — layout preset thumbnails not yet implemented.
	return null;
}

/**
 * Updates the webcam crop region for the currently active layout preset.
 * Stub — returns the webcam settings unchanged.
 */
export function updateWebcamCropForActivePreset(
	webcam: WebcamOverlaySettings,
	cropRegion: CropRegion,
): WebcamOverlaySettings {
	if (!webcam.activePresetId) return webcam;
	return {
		...webcam,
		cropRegionByPreset: {
			...(webcam.cropRegionByPreset ?? {}),
			[webcam.activePresetId]: cropRegion,
		},
	};
}
