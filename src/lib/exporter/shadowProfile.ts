export interface ShadowLayerProfile {
	offsetScale: number;
	alphaScale: number;
	blurScale: number;
}

export const VIDEO_SHADOW_LAYER_PROFILES: ReadonlyArray<ShadowLayerProfile> = Object.freeze([
	{ offsetScale: 8, alphaScale: 0.55, blurScale: 32 },
	{ offsetScale: 3, alphaScale: 0.35, blurScale: 12 },
	{ offsetScale: 1.5, alphaScale: 0.18, blurScale: 5 },
]);

export const WEBCAM_SHADOW_LAYER_PROFILES: ReadonlyArray<ShadowLayerProfile> = Object.freeze([
	{ offsetScale: 0.06, alphaScale: 1, blurScale: 0.22 },
]);

export function getShadowFilterPadding(blur: number, offsetY: number): number {
	return Math.ceil(Math.max(0, blur * 2 + Math.abs(offsetY)));
}
