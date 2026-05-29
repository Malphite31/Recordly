import {
	ArrowDown,
	ArrowUp,
	Keyboard,
	Plus,
	Trash,
} from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
	KeyboardOverlayAnimationStyle,
	KeyboardOverlayEvent,
	KeyboardOverlayModifierStyle,
	KeyboardOverlayPosition,
	KeyboardOverlaySettings,
} from "./types";

interface KeyboardOverlaySidebarProps {
	settings: KeyboardOverlaySettings;
	currentTimeMs: number;
	onChange: (settings: KeyboardOverlaySettings) => void;
}

const ANIMATION_OPTIONS: Array<{ value: KeyboardOverlayAnimationStyle; label: string }> = [
	{ value: "fade", label: "Fade" },
	{ value: "slide-up", label: "Slide Up" },
	{ value: "pop", label: "Pop" },
	{ value: "none", label: "None" },
];

const MODIFIER_STYLE_OPTIONS: Array<{ value: KeyboardOverlayModifierStyle; label: string }> = [
	{ value: "mixed", label: "Mixed (Ctrl, ⌘, ⇧)" },
	{ value: "text", label: "Text (Ctrl, Cmd, Shift)" },
	{ value: "symbol", label: "Symbol (⌃, ⌘, ⇧)" },
];

const POSITION_GRID: Array<{ preset: Exclude<KeyboardOverlayPosition, "custom">; label: string }> = [
	{ preset: "top-left",     label: "↖" },
	{ preset: "top-center",   label: "↑" },
	{ preset: "top-right",    label: "↗" },
	{ preset: "center-left",  label: "←" },
	{ preset: "center",       label: "•" },
	{ preset: "center-right", label: "→" },
	{ preset: "bottom-left",  label: "↙" },
	{ preset: "bottom-center",label: "↓" },
	{ preset: "bottom-right", label: "↘" },
];

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg bg-foreground/[0.03] px-2.5 py-2">
			<span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
			{children}
		</div>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 mt-4 mb-1.5">
			{children}
		</p>
	);
}

function KeyComboPreview({ keys }: { keys: string[] }) {
	return (
		<div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 backdrop-blur-sm">
			{keys.map((key, i) => (
				<span
					key={i}
					className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
				>
					{key}
				</span>
			))}
		</div>
	);
}

function EventRow({
	event,
	index,
	onUpdate,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
}: {
	event: KeyboardOverlayEvent;
	index: number;
	onUpdate: (index: number, event: KeyboardOverlayEvent) => void;
	onDelete: (index: number) => void;
	onMoveUp: (index: number) => void;
	onMoveDown: (index: number) => void;
	isFirst: boolean;
	isLast: boolean;
}) {
	const [keysText, setKeysText] = useState(event.keys.join(" + "));

	const handleKeysBlur = useCallback(() => {
		const parsed = keysText
			.split(/[+,\n]/)
			.map((k) => k.trim())
			.filter(Boolean)
			.slice(0, 6);
		onUpdate(index, { ...event, keys: parsed });
	}, [keysText, event, index, onUpdate]);

	const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

	return (
		<div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] p-3 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<KeyComboPreview keys={event.keys} />
				<div className="flex items-center gap-1">
					<button type="button" onClick={() => onMoveUp(index)} disabled={isFirst}
						className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
						<ArrowUp className="w-3 h-3" />
					</button>
					<button type="button" onClick={() => onMoveDown(index)} disabled={isLast}
						className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
						<ArrowDown className="w-3 h-3" />
					</button>
					<button type="button" onClick={() => onDelete(index)}
						className="h-6 w-6 flex items-center justify-center rounded text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">
						<Trash className="w-3 h-3" />
					</button>
				</div>
			</div>
			<div>
				<label className="text-[10px] text-muted-foreground/70 mb-1 block">Keys (+ separated)</label>
				<input
					value={keysText}
					onChange={(e) => setKeysText(e.target.value)}
					onBlur={handleKeysBlur}
					placeholder="Ctrl + K"
					className="w-full px-2.5 py-1.5 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
				/>
			</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<label className="text-[10px] text-muted-foreground/70 mb-1 block">Start ({formatMs(event.timeMs)})</label>
					<input type="number" value={event.timeMs} min={0} step={100}
						onChange={(e) => onUpdate(index, { ...event, timeMs: Math.max(0, Number(e.target.value)) })}
						className="w-full px-2 py-1 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
					/>
				</div>
				<div>
					<label className="text-[10px] text-muted-foreground/70 mb-1 block">Duration ({formatMs(event.durationMs)})</label>
					<input type="number" value={event.durationMs} min={100} step={100}
						onChange={(e) => onUpdate(index, { ...event, durationMs: Math.max(100, Number(e.target.value)) })}
						className="w-full px-2 py-1 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
					/>
				</div>
			</div>
		</div>
	);
}

export function KeyboardOverlaySidebar({ settings, currentTimeMs, onChange }: KeyboardOverlaySidebarProps) {
	const update = useCallback(
		(patch: Partial<KeyboardOverlaySettings>) => onChange({ ...settings, ...patch }),
		[settings, onChange],
	);

	const handleAddEvent = useCallback(() => {
		update({ events: [...settings.events, { timeMs: Math.round(currentTimeMs), durationMs: 2000, keys: ["Ctrl", "K"] }] });
	}, [currentTimeMs, settings.events, update]);

	const handleUpdateEvent = useCallback((index: number, event: KeyboardOverlayEvent) => {
		const next = [...settings.events];
		next[index] = event;
		update({ events: next });
	}, [settings.events, update]);

	const handleDeleteEvent = useCallback((index: number) => {
		update({ events: settings.events.filter((_, i) => i !== index) });
	}, [settings.events, update]);

	const handleMoveUp = useCallback((index: number) => {
		if (index === 0) return;
		const next = [...settings.events];
		[next[index - 1], next[index]] = [next[index], next[index - 1]];
		update({ events: next });
	}, [settings.events, update]);

	const handleMoveDown = useCallback((index: number) => {
		if (index >= settings.events.length - 1) return;
		const next = [...settings.events];
		[next[index], next[index + 1]] = [next[index + 1], next[index]];
		update({ events: next });
	}, [settings.events, update]);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2.5 px-4 py-3 border-b border-foreground/10 shrink-0">
				<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#2563EB]">
					<Keyboard className="w-4 h-4" />
				</div>
				<div>
					<p className="text-sm font-semibold text-foreground leading-tight">Keyboard Overlay</p>
					<p className="text-[10px] text-muted-foreground leading-tight">Cinematic shortcut HUD</p>
				</div>
				<div className="ml-auto">
					<Switch
						checked={settings.enabled}
						onCheckedChange={(v) => update({ enabled: v })}
						className="data-[state=checked]:bg-[#2563EB] scale-90"
					/>
				</div>
			</div>
			{/* Body */}
			<div className={cn(
				"flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-3 space-y-1.5 transition-opacity",
				!settings.enabled && "opacity-40 pointer-events-none",
			)}>
				<SectionLabel>Position</SectionLabel>
				<div className="grid grid-cols-3 gap-1.5">
					{POSITION_GRID.map(({ preset, label }) => (
						<button
							key={preset}
							type="button"
							onClick={() => update({ position: preset })}
							className={cn(
								"h-9 rounded-lg border text-sm font-medium transition-all",
								settings.position === preset
									? "bg-[#2563EB] border-[#2563EB] text-white"
									: "bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:bg-foreground/[0.06] hover:border-foreground/20",
							)}
						>
							{label}
						</button>
					))}
				</div>
				<button
					type="button"
					onClick={() => update({ position: "custom" })}
					className={cn(
						"w-full mt-1 h-7 rounded-lg border text-[11px] font-medium transition-all",
						settings.position === "custom"
							? "bg-[#2563EB]/15 border-[#2563EB]/50 text-[#2563EB]"
							: "bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:bg-foreground/[0.06]",
					)}
				>
					Custom Position
				</button>
				{settings.position === "custom" && (
					<div className="space-y-2 mt-1">
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[11px] text-muted-foreground">X</span>
								<span className="text-[11px] tabular-nums text-foreground/70">{Math.round((settings.positionX ?? 0.5) * 100)}%</span>
							</div>
							<Slider value={[settings.positionX ?? 0.5]} onValueChange={([v]) => update({ positionX: v })} min={0} max={1} step={0.01} className="w-full" />
						</div>
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[11px] text-muted-foreground">Y</span>
								<span className="text-[11px] tabular-nums text-foreground/70">{Math.round((settings.positionY ?? 1) * 100)}%</span>
							</div>
							<Slider value={[settings.positionY ?? 1]} onValueChange={([v]) => update({ positionY: v })} min={0} max={1} step={0.01} className="w-full" />
						</div>
					</div>
				)}

				<SectionLabel>Appearance</SectionLabel>
				<div className="mt-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Scale</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{settings.scale.toFixed(2)}×</span>
					</div>
					<Slider value={[settings.scale]} onValueChange={([v]) => update({ scale: v })} min={0.5} max={2.0} step={0.05} className="w-full" />
				</div>
				<div className="mt-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Opacity</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{Math.round(settings.opacity * 100)}%</span>
					</div>
					<Slider value={[settings.opacity]} onValueChange={([v]) => update({ opacity: v })} min={0} max={1} step={0.01} className="w-full" />
				</div>
				<ControlRow label="Glassmorphism">
					<Switch checked={settings.glassmorphism} onCheckedChange={(v) => update({ glassmorphism: v })} className="data-[state=checked]:bg-[#2563EB] scale-75" />
				</ControlRow>

				<SectionLabel>Animation</SectionLabel>
				<ControlRow label="Style">
					<Select value={settings.animationStyle} onValueChange={(v) => update({ animationStyle: v as KeyboardOverlayAnimationStyle })}>
						<SelectTrigger className="h-7 w-28 text-[11px] border-foreground/10 bg-foreground/[0.03]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-editor-surface-alt border-foreground/10 text-foreground">
							{ANIMATION_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</ControlRow>
				<div className="mt-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Fade Duration</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{settings.fadeDurationMs}ms</span>
					</div>
					<Slider value={[settings.fadeDurationMs]} onValueChange={([v]) => update({ fadeDurationMs: v })} min={0} max={600} step={10} className="w-full" />
				</div>

				<SectionLabel>Keys</SectionLabel>
				<ControlRow label="Modifier Style">
					<Select value={settings.modifierStyle} onValueChange={(v) => update({ modifierStyle: v as KeyboardOverlayModifierStyle })}>
						<SelectTrigger className="h-7 w-44 text-[11px] border-foreground/10 bg-foreground/[0.03]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-editor-surface-alt border-foreground/10 text-foreground">
							{MODIFIER_STYLE_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</ControlRow>
				<ControlRow label="Stacked Display">
					<Switch checked={settings.stackedDisplay} onCheckedChange={(v) => update({ stackedDisplay: v })} className="data-[state=checked]:bg-[#2563EB] scale-75" />
				</ControlRow>
				<div className="mt-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Max Visible</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{settings.maxVisible}</span>
					</div>
					<Slider value={[settings.maxVisible]} onValueChange={([v]) => update({ maxVisible: v })} min={1} max={6} step={1} className="w-full" />
				</div>

				<SectionLabel>Detected Shortcuts</SectionLabel>
				<p className="text-[10px] text-muted-foreground/60 leading-relaxed">
					Keyboard shortcuts are automatically detected from your recording and appear as overlays during playback and export.
				</p>
				{settings.events.length === 0 ? (
					<div className="mt-2 rounded-xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-4 py-6 text-center">
						<p className="text-[11px] text-muted-foreground/50">No keyboard events detected.</p>
						<p className="text-[10px] text-muted-foreground/35 mt-1">Record a new session to capture keyboard shortcuts automatically.</p>
					</div>
				) : (
					<>
						<p className="text-[10px] text-[#2563EB]/80 font-medium mt-1">
							{settings.events.length} shortcut{settings.events.length !== 1 ? "s" : ""} detected
						</p>
						<div className="space-y-2 mt-2">
							{settings.events.map((event, i) => (
								<EventRow
									key={i}
									event={event}
									index={i}
									onUpdate={handleUpdateEvent}
									onDelete={handleDeleteEvent}
									onMoveUp={handleMoveUp}
									onMoveDown={handleMoveDown}
									isFirst={i === 0}
									isLast={i === settings.events.length - 1}
								/>
							))}
						</div>
					</>
				)}
				<Button
					variant="outline"
					size="sm"
					onClick={handleAddEvent}
					className="w-full mt-2 gap-2 border-dashed border-foreground/20 bg-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/5 hover:border-foreground/30 transition-all text-xs h-8"
				>
					<Plus className="w-3.5 h-3.5" />
					Add Manual Shortcut at Playhead
				</Button>
				<div className="h-4" />
			</div>
		</div>
	);
}
