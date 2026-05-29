/**
 * Parses raw keyboard telemetry events (keydown/keyup pairs) into
 * KeyboardOverlayEvent[] suitable for display in the editor and export.
 *
 * Groups modifier keys with the next non-modifier keydown into combos,
 * deduplicates rapid repeats, and assigns a display duration.
 */

import type { KeyboardOverlayEvent } from "@/components/video-editor/types";

interface RawKeyEvent {
	timeMs: number;
	keycode: number;
	type: "keydown" | "keyup";
	altKey: boolean;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
}

// Modifier keycodes — same set as in keyboardCapture.ts
const MODIFIER_KEYCODES = new Set([
	29, 3613,  // Ctrl, CtrlRight
	56, 3640,  // Alt, AltRight
	42, 54,    // Shift, ShiftRight
	3675, 3676, // Meta, MetaRight
	58,        // CapsLock
]);

const KEYCODE_LABELS: Record<number, string> = {
	1: "Esc", 14: "Backspace", 15: "Tab", 28: "Enter", 57: "Space",
	58: "CapsLock", 69: "NumLock", 70: "ScrollLock", 3639: "PrintScreen",
	3657: "PageUp", 3665: "PageDown", 3663: "End", 3655: "Home",
	3666: "Insert", 3667: "Delete",
	57419: "←", 57416: "↑", 57421: "→", 57424: "↓",
	11: "0", 2: "1", 3: "2", 4: "3", 5: "4",
	6: "5", 7: "6", 8: "7", 9: "8", 10: "9",
	30: "A", 48: "B", 46: "C", 32: "D", 18: "E",
	33: "F", 34: "G", 35: "H", 23: "I", 36: "J",
	37: "K", 38: "L", 50: "M", 49: "N", 24: "O",
	25: "P", 16: "Q", 19: "R", 31: "S", 20: "T",
	22: "U", 47: "V", 17: "W", 45: "X", 21: "Y", 44: "Z",
	59: "F1", 60: "F2", 61: "F3", 62: "F4", 63: "F5", 64: "F6",
	65: "F7", 66: "F8", 67: "F9", 68: "F10", 87: "F11", 88: "F12",
	39: ";", 13: "=", 51: ",", 12: "-", 52: ".", 53: "/",
	41: "`", 26: "[", 43: "\\", 27: "]", 40: "'",
};

function getKeycodeLabel(keycode: number): string | null {
	if (MODIFIER_KEYCODES.has(keycode)) return null;
	return KEYCODE_LABELS[keycode] ?? null;
}

function buildModifierLabels(event: RawKeyEvent): string[] {
	const mods: string[] = [];
	if (event.ctrlKey) mods.push("Ctrl");
	if (event.metaKey) mods.push("Cmd");
	if (event.altKey) mods.push("Alt");
	if (event.shiftKey) mods.push("Shift");
	return mods;
}

const DEFAULT_DISPLAY_DURATION_MS = 2000;
const DEDUP_WINDOW_MS = 500; // ignore identical combos within this window

export interface ParseKeyboardTelemetryOptions {
	displayDurationMs?: number;
	dedupWindowMs?: number;
}

export function parseKeyboardTelemetry(
	rawEvents: RawKeyEvent[],
	options: ParseKeyboardTelemetryOptions = {},
): KeyboardOverlayEvent[] {
	const displayDurationMs = options.displayDurationMs ?? DEFAULT_DISPLAY_DURATION_MS;
	const dedupWindowMs = options.dedupWindowMs ?? DEDUP_WINDOW_MS;

	const result: KeyboardOverlayEvent[] = [];
	let lastComboKey = "";
	let lastComboTimeMs = -Infinity;

	for (const event of rawEvents) {
		if (event.type !== "keydown") continue;
		if (MODIFIER_KEYCODES.has(event.keycode)) continue;

		const label = getKeycodeLabel(event.keycode);
		if (!label) continue;

		const modifiers = buildModifierLabels(event);
		const keys = [...modifiers, label];
		const comboKey = keys.join("+");

		// Deduplicate rapid repeats
		if (comboKey === lastComboKey && event.timeMs - lastComboTimeMs < dedupWindowMs) {
			continue;
		}

		// Only record combos with at least one modifier (skip bare letter/number presses)
		if (modifiers.length === 0 && keys.length === 1) {
			// Allow function keys and special keys as standalone
			const isFunctionKey = event.keycode >= 59 && event.keycode <= 88;
			const isSpecialKey = [1, 14, 15, 28, 57, 3657, 3665, 3663, 3655, 3666, 3667].includes(event.keycode);
			if (!isFunctionKey && !isSpecialKey) continue;
		}

		result.push({
			timeMs: event.timeMs,
			durationMs: displayDurationMs,
			keys,
		});

		lastComboKey = comboKey;
		lastComboTimeMs = event.timeMs;
	}

	return result;
}
