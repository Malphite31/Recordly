import {
	ImageSquare as ImageIcon,
	Stamp,
	TextT as Type,
	UploadSimple as Upload,
} from "@phosphor-icons/react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
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
	WatermarkAnimationStyle,
	WatermarkPosition,
	WatermarkSettings,
} from "./types";

interface WatermarkSidebarProps {
	settings: WatermarkSettings;
	onChange: (settings: WatermarkSettings) => void;
}

const ANIMATION_OPTIONS: Array<{ value: WatermarkAnimationStyle; label: string }> = [
	{ value: "none", label: "None" },
	{ value: "pulse", label: "Pulse" },
	{ value: "fade-in-out", label: "Fade In/Out" },
];

const POSITION_GRID: Array<{ preset: Exclude<WatermarkPosition, "custom">; label: string }> = [
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

const FONT_OPTIONS = [
	{ value: '"SF Pro Display", "SF Pro Text", Helvetica, sans-serif', label: "SF Pro" },
	{ value: "Georgia, serif", label: "Georgia" },
	{ value: "Arial, sans-serif", label: "Arial" },
	{ value: "Courier New, monospace", label: "Courier" },
	{ value: "Impact, Arial Black, sans-serif", label: "Impact" },
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

export function WatermarkSidebar({ settings, onChange }: WatermarkSidebarProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);

	const update = useCallback(
		(patch: Partial<WatermarkSettings>) => onChange({ ...settings, ...patch }),
		[settings, onChange],
	);

	const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
		if (!validTypes.includes(file.type)) {
			toast.error("Unsupported image format. Use PNG, JPG, GIF, WebP, or SVG.");
			e.target.value = "";
			return;
		}
		const reader = new FileReader();
		reader.onload = (ev) => {
			const dataUrl = ev.target?.result as string;
			if (dataUrl) {
				update({ imageDataUrl: dataUrl, type: "image" });
				toast.success("Watermark image uploaded.");
			}
		};
		reader.readAsDataURL(file);
		e.target.value = "";
	}, [update]);

	return (
		<div className="flex flex-col h-full overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2.5 px-4 py-3 border-b border-foreground/10 shrink-0">
				<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB]/15 text-[#2563EB]">
					<Stamp className="w-4 h-4" />
				</div>
				<div>
					<p className="text-sm font-semibold text-foreground leading-tight">Watermark</p>
					<p className="text-[10px] text-muted-foreground leading-tight">Brand your videos</p>
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
				{/* ── Type ───────────────────────────────────────────────── */}
				<SectionLabel>Type</SectionLabel>

				<div className="grid grid-cols-2 gap-2">
					<button
						type="button"
						onClick={() => update({ type: "text" })}
						className={cn(
							"flex items-center justify-center gap-2 h-10 rounded-xl border text-[11px] font-medium transition-all",
							settings.type === "text"
								? "bg-[#2563EB] border-[#2563EB] text-white"
								: "bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:bg-foreground/[0.06]",
						)}
					>
						<Type className="w-3.5 h-3.5" />
						Text
					</button>
					<button
						type="button"
						onClick={() => update({ type: "image" })}
						className={cn(
							"flex items-center justify-center gap-2 h-10 rounded-xl border text-[11px] font-medium transition-all",
							settings.type === "image"
								? "bg-[#2563EB] border-[#2563EB] text-white"
								: "bg-foreground/[0.03] border-foreground/10 text-muted-foreground hover:bg-foreground/[0.06]",
						)}
					>
						<ImageIcon className="w-3.5 h-3.5" />
						Image
					</button>
				</div>

				{/* ── Content ─────────────────────────────────────────────── */}
				{settings.type === "text" ? (
					<>
						<SectionLabel>Text</SectionLabel>
						<input
							value={settings.text}
							onChange={(e) => update({ text: e.target.value })}
							placeholder="© My Brand"
							className="w-full px-3 py-2 bg-foreground/5 border border-foreground/10 rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
						/>

						<ControlRow label="Font">
							<Select value={settings.fontFamily} onValueChange={(v) => update({ fontFamily: v })}>
								<SelectTrigger className="h-7 w-28 text-[11px] border-foreground/10 bg-foreground/[0.03]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-editor-surface-alt border-foreground/10 text-foreground">
									{FONT_OPTIONS.map((f) => (
										<SelectItem key={f.value} value={f.value} className="text-[11px]" style={{ fontFamily: f.value }}>
											{f.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</ControlRow>

						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[11px] text-muted-foreground">Font Size</span>
								<span className="text-[11px] tabular-nums text-foreground/70">{settings.fontSize}px</span>
							</div>
							<Slider value={[settings.fontSize]} onValueChange={([v]) => update({ fontSize: v })} min={12} max={96} step={2} className="w-full" />
						</div>

						<ControlRow label="Color">
							<div className="flex items-center gap-2">
								<input
									type="color"
									value={settings.color}
									onChange={(e) => update({ color: e.target.value })}
									className="w-7 h-6 rounded border border-foreground/10 cursor-pointer bg-transparent"
								/>
								<span className="text-[11px] font-mono text-muted-foreground">{settings.color}</span>
							</div>
						</ControlRow>
					</>
				) : (
					<>
						<SectionLabel>Image</SectionLabel>
						<input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
						<Button
							onClick={() => fileInputRef.current?.click()}
							variant="outline"
							className="w-full gap-2 bg-foreground/5 text-foreground border-foreground/10 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] transition-all py-6"
						>
							<Upload className="w-4 h-4" />
							Upload Image (PNG, SVG, JPG)
						</Button>
						{settings.imageDataUrl && (
							<div className="rounded-lg border border-foreground/10 overflow-hidden bg-foreground/5 p-2">
								<img src={settings.imageDataUrl} alt="Watermark preview" className="w-full h-auto max-h-24 object-contain rounded" />
							</div>
						)}
					</>
				)}

				{/* ── Position ─────────────────────────────────────────────── */}
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
								<span className="text-[11px] tabular-nums text-foreground/70">{Math.round(settings.positionX * 100)}%</span>
							</div>
							<Slider value={[settings.positionX]} onValueChange={([v]) => update({ positionX: v })} min={0} max={1} step={0.01} className="w-full" />
						</div>
						<div>
							<div className="flex items-center justify-between mb-1">
								<span className="text-[11px] text-muted-foreground">Y</span>
								<span className="text-[11px] tabular-nums text-foreground/70">{Math.round(settings.positionY * 100)}%</span>
							</div>
							<Slider value={[settings.positionY]} onValueChange={([v]) => update({ positionY: v })} min={0} max={1} step={0.01} className="w-full" />
						</div>
					</div>
				)}

				{/* ── Appearance ─────────────────────────────────────────── */}
				<SectionLabel>Appearance</SectionLabel>

				<div>
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Scale</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{settings.scale.toFixed(2)}×</span>
					</div>
					<Slider value={[settings.scale]} onValueChange={([v]) => update({ scale: v })} min={0.1} max={3.0} step={0.05} className="w-full" />
				</div>

				<div>
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Opacity</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{Math.round(settings.opacity * 100)}%</span>
					</div>
					<Slider value={[settings.opacity]} onValueChange={([v]) => update({ opacity: v })} min={0} max={1} step={0.01} className="w-full" />
				</div>

				<div>
					<div className="flex items-center justify-between mb-1">
						<span className="text-[11px] text-muted-foreground">Padding</span>
						<span className="text-[11px] tabular-nums text-foreground/70">{settings.padding}px</span>
					</div>
					<Slider value={[settings.padding]} onValueChange={([v]) => update({ padding: v })} min={0} max={120} step={4} className="w-full" />
				</div>

				{/* ── Animation ──────────────────────────────────────────── */}
				<SectionLabel>Animation</SectionLabel>

				<ControlRow label="Style">
					<Select value={settings.animationStyle} onValueChange={(v) => update({ animationStyle: v as WatermarkAnimationStyle })}>
						<SelectTrigger className="h-7 w-32 text-[11px] border-foreground/10 bg-foreground/[0.03]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="bg-editor-surface-alt border-foreground/10 text-foreground">
							{ANIMATION_OPTIONS.map((o) => (
								<SelectItem key={o.value} value={o.value} className="text-[11px]">{o.label}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</ControlRow>

				<div className="h-4" />
			</div>
		</div>
	);
}
