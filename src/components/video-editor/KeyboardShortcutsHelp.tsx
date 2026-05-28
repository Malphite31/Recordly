import { Gear as Settings2, Question as HelpCircle } from "@phosphor-icons/react";
import { useState, useEffect } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { useShortcuts } from "@/contexts/ShortcutsContext";
import { formatBinding, SHORTCUT_ACTIONS, SHORTCUT_LABELS } from "@/lib/shortcuts";
import { formatShortcut } from "@/utils/platformUtils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export function KeyboardShortcutsHelp() {
	const { shortcuts, isMac, openConfig } = useShortcuts();
	const t = useScopedT("editor");
	const [modalOpen, setModalOpen] = useState(false);

	const [scrollLabels, setScrollLabels] = useState({
		pan: "Shift + Scroll",
		zoom: "Ctrl + Scroll",
	});

	useEffect(() => {
		Promise.all([
			formatShortcut(["shift", "Scroll"]),
			formatShortcut(["mod", "Scroll"]),
		]).then(([pan, zoom]) => setScrollLabels({ pan, zoom }));
	}, []);

	const allShortcuts = [
		...SHORTCUT_ACTIONS.map((action) => ({
			label: SHORTCUT_LABELS[action],
			binding: formatBinding(shortcuts[action], isMac),
			category: "Timeline",
		})),
		{ label: "Cycle Annotations Forward", binding: "Tab", category: "Annotations" },
		{ label: "Cycle Annotations Backward", binding: "Shift + Tab", category: "Annotations" },
		{ label: "Delete Selected (alt)", binding: "Del / ⌫", category: "Timeline" },
		{ label: "Pan Timeline", binding: scrollLabels.pan, category: "Navigation" },
		{ label: "Zoom Timeline", binding: scrollLabels.zoom, category: "Navigation" },
		{ label: "Select All Blocks", binding: isMac ? "⌘ + A" : "Ctrl + A", category: "Timeline" },
		{ label: "Undo", binding: isMac ? "⌘ + Z" : "Ctrl + Z", category: "General" },
		{ label: "Redo", binding: isMac ? "⌘ + Shift + Z" : "Ctrl + Y", category: "General" },
	];

	const categories = [...new Set(allShortcuts.map((s) => s.category))];

	return (
		<>
			<div className="relative group">
				<HelpCircle
					className="w-4 h-4 text-muted-foreground/70 hover:text-[#2563EB] transition-colors cursor-help"
					onClick={() => setModalOpen(true)}
				/>

				{/* Hover tooltip (quick reference) */}
				<div className="absolute right-0 top-full mt-2 w-64 bg-editor-dialog border border-foreground/10 rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-xl z-50">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-semibold text-foreground">
							{t("keyboardShortcuts.title")}
						</span>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => setModalOpen(true)}
								className="text-[10px] text-muted-foreground/70 hover:text-[#2563EB] transition-colors"
							>
								View all
							</button>
							<button
								type="button"
								onClick={openConfig}
								title={t("keyboardShortcuts.customizeTooltip")}
								className="flex items-center gap-1 text-[10px] text-muted-foreground/70 hover:text-[#2563EB] transition-colors"
							>
								<Settings2 className="w-3 h-3" />
								{t("keyboardShortcuts.customize")}
							</button>
						</div>
					</div>

					<div className="space-y-1.5 text-[10px]">
						{SHORTCUT_ACTIONS.slice(0, 6).map((action) => (
							<div key={action} className="flex items-center justify-between">
								<span className="text-muted-foreground">{SHORTCUT_LABELS[action]}</span>
								<kbd className="px-1 py-0.5 bg-foreground/5 border border-foreground/10 rounded text-[#2563EB] font-mono">
									{formatBinding(shortcuts[action], isMac)}
								</kbd>
							</div>
						))}

						<div className="pt-1 border-t border-foreground/5 mt-1">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">{t("keyboardShortcuts.panTimeline")}</span>
								<kbd className="px-1 py-0.5 bg-foreground/5 border border-foreground/10 rounded text-[#2563EB] font-mono">{scrollLabels.pan}</kbd>
							</div>
							<div className="flex items-center justify-between mt-1.5">
								<span className="text-muted-foreground">{t("keyboardShortcuts.zoomTimeline")}</span>
								<kbd className="px-1 py-0.5 bg-foreground/5 border border-foreground/10 rounded text-[#2563EB] font-mono">{scrollLabels.zoom}</kbd>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Full shortcuts guide modal */}
			<Dialog open={modalOpen} onOpenChange={setModalOpen}>
				<DialogContent className="bg-editor-dialog border-foreground/10 text-foreground max-w-[560px] max-h-[80vh] overflow-hidden flex flex-col">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-sm">
							<HelpCircle className="w-4 h-4 text-[#2563EB]" />
							Keyboard Shortcuts Guide
						</DialogTitle>
					</DialogHeader>

					<div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
						{categories.map((category) => (
							<div key={category} className="mb-4">
								<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
									{category}
								</p>
								<div className="space-y-0.5">
									{allShortcuts
										.filter((s) => s.category === category)
										.map((s) => (
											<div
												key={s.label}
												className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-foreground/[0.03] transition-colors"
											>
												<span className="text-sm text-muted-foreground">{s.label}</span>
												<kbd className="px-2 py-1 bg-foreground/5 border border-foreground/10 rounded text-xs font-mono text-[#2563EB] min-w-[80px] text-center">
													{s.binding}
												</kbd>
											</div>
										))}
								</div>
							</div>
						))}
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-foreground/10 mt-2">
						<p className="text-[10px] text-muted-foreground/60">
							Press <kbd className="px-1 py-0.5 bg-foreground/5 border border-foreground/10 rounded font-mono">Esc</kbd> to close
						</p>
						<button
							type="button"
							onClick={openConfig}
							className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#2563EB] transition-colors"
						>
							<Settings2 className="w-3.5 h-3.5" />
							Customize shortcuts
						</button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
