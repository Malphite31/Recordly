/**
 * Keyboard telemetry capture using uiohook-napi.
 *
 * Captures keydown/keyup events during recording and stores them as
 * `{videoPath}.keyboard.json` — the same sidecar pattern as cursor telemetry.
 *
 * The raw events are later parsed in the renderer by keyboardOverlayUtils.ts
 * to produce KeyboardOverlayEvent[] (combo detection, dedup, display duration).
 */

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import type { UiohookModuleNamespace } from "../types";
import {
	activeKeyboardEvents,
	isCursorCaptureActive,
	keyboardCaptureCleanup,
	setActiveKeyboardEvents,
	setKeyboardCaptureCleanup,
	type RawKeyEvent,
} from "../state";
import { getCursorCaptureElapsedMs, isCursorCapturePaused } from "./telemetry";
import { getKeyboardTelemetryPathForVideo } from "../utils";

const nodeRequire = createRequire(import.meta.url);

const MAX_KEYBOARD_EVENTS = 50_000;

// ─── Keycode → label map ──────────────────────────────────────────────────────
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

const MODIFIER_KEYCODES = new Set([
	29, 3613, 56, 3640, 42, 54, 3675, 3676, 58,
]);

export function getKeycodeLabel(keycode: number): string | null {
	if (MODIFIER_KEYCODES.has(keycode)) return null;
	return KEYCODE_LABELS[keycode] ?? null;
}

// ─── Capture ──────────────────────────────────────────────────────────────────

function resolveUiohook(moduleExports: UiohookModuleNamespace) {
	const candidates = [
		moduleExports.uIOhook,
		moduleExports.uiohook,
		moduleExports.Uiohook,
		(moduleExports.default as UiohookModuleNamespace)?.uIOhook,
		(moduleExports.default as UiohookModuleNamespace)?.uiohook,
	];
	return candidates.find((c) => c && typeof c.on === "function" && typeof c.start === "function") ?? null;
}

function loadUiohook() {
	try {
		const mod = nodeRequire("uiohook-napi") as UiohookModuleNamespace;
		return resolveUiohook(mod);
	} catch {
		return null;
	}
}

export function stopKeyboardCapture() {
	if (keyboardCaptureCleanup) {
		keyboardCaptureCleanup();
		setKeyboardCaptureCleanup(null);
	}
}

export async function startKeyboardCapture() {
	if (!isCursorCaptureActive) return;
	if (!["darwin", "win32", "linux"].includes(process.platform)) return;

	stopKeyboardCapture();

	try {
		const hook = loadUiohook();
		if (!hook) return;

		const onKeyDown = (event: { keycode?: number; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
			if (!isCursorCaptureActive || isCursorCapturePaused()) return;
			const keycode = event.keycode ?? 0;
			if (MODIFIER_KEYCODES.has(keycode)) return;
			if (activeKeyboardEvents.length >= MAX_KEYBOARD_EVENTS) return;

			activeKeyboardEvents.push({
				timeMs: getCursorCaptureElapsedMs(),
				keycode,
				type: "keydown",
				altKey: event.altKey ?? false,
				ctrlKey: event.ctrlKey ?? false,
				metaKey: event.metaKey ?? false,
				shiftKey: event.shiftKey ?? false,
			});
		};

		const onKeyUp = (event: { keycode?: number; altKey?: boolean; ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }) => {
			if (!isCursorCaptureActive || isCursorCapturePaused()) return;
			const keycode = event.keycode ?? 0;
			if (MODIFIER_KEYCODES.has(keycode)) return;
			if (activeKeyboardEvents.length >= MAX_KEYBOARD_EVENTS) return;

			activeKeyboardEvents.push({
				timeMs: getCursorCaptureElapsedMs(),
				keycode,
				type: "keyup",
				altKey: event.altKey ?? false,
				ctrlKey: event.ctrlKey ?? false,
				metaKey: event.metaKey ?? false,
				shiftKey: event.shiftKey ?? false,
			});
		};

		(hook as { on: (event: string, listener: (e: unknown) => void) => void }).on("keydown", onKeyDown as (e: unknown) => void);
		(hook as { on: (event: string, listener: (e: unknown) => void) => void }).on("keyup", onKeyUp as (e: unknown) => void);

		setKeyboardCaptureCleanup(() => {
			try {
				const h = hook as { off?: (event: string, listener: (e: unknown) => void) => void; removeListener?: (event: string, listener: (e: unknown) => void) => void };
				if (typeof h.off === "function") {
					h.off("keydown", onKeyDown as (e: unknown) => void);
					h.off("keyup", onKeyUp as (e: unknown) => void);
				} else if (typeof h.removeListener === "function") {
					h.removeListener("keydown", onKeyDown as (e: unknown) => void);
					h.removeListener("keyup", onKeyUp as (e: unknown) => void);
				}
			} catch {
				// ignore
			}
		});
	} catch (error) {
		console.warn("[KeyboardCapture] Failed to start keyboard capture:", error);
	}
}

// ─── Persistence ─────────────────────────────────────────────────────────────

export async function persistKeyboardTelemetry(videoPath: string) {
	const telemetryPath = getKeyboardTelemetryPathForVideo(videoPath);
	const events = activeKeyboardEvents;
	setActiveKeyboardEvents([]);

	if (events.length === 0) {
		await fs.rm(telemetryPath, { force: true });
		return;
	}

	await fs.writeFile(
		telemetryPath,
		JSON.stringify({ version: 1, events }, null, 2),
		"utf-8",
	);
}

export async function loadKeyboardTelemetry(videoPath: string): Promise<RawKeyEvent[]> {
	const telemetryPath = getKeyboardTelemetryPathForVideo(videoPath);
	try {
		const content = await fs.readFile(telemetryPath, "utf-8");
		const parsed = JSON.parse(content) as { version?: number; events?: unknown[] };
		if (!Array.isArray(parsed.events)) return [];
		return parsed.events
			.filter((e): e is RawKeyEvent =>
				e !== null &&
				typeof e === "object" &&
				typeof (e as RawKeyEvent).timeMs === "number" &&
				typeof (e as RawKeyEvent).keycode === "number" &&
				((e as RawKeyEvent).type === "keydown" || (e as RawKeyEvent).type === "keyup"),
			)
			.slice(0, MAX_KEYBOARD_EVENTS);
	} catch (error) {
		const nodeError = error as NodeJS.ErrnoException;
		if (nodeError.code === "ENOENT") return [];
		console.error("[KeyboardCapture] Failed to load keyboard telemetry:", error);
		return [];
	}
}
