/**
 * Standard tier color maps for Classic and Hyv themes
 */

/** @type {Record<string, string>} */
export const CLASSIC_TIER_COLORS = {
	S: '#ef4444', // Red
	A: '#f97316', // Orange
	B: '#eab308', // Yellow
	C: '#84cc16', // Lime
	D: '#06b6d4', // Cyan
	F: '#64748b' // Slate
};

/** @type {Record<string, string>} */
export const HYV_TIER_COLORS = {
	S: '#FFD000', // Mythic Gold
	A: '#A335EE', // Amethyst Purple
	B: '#0070DD', // Cerulean Blue
	C: '#1EFF00', // Jade Green
	D: '#CD7F32', // Weathered Bronze
	F: '#808080' // Slate Iron
};

export const CLASSIC_COLOR_PALETTE = [
	'#ef4444', // Red
	'#f97316', // Orange
	'#eab308', // Yellow
	'#84cc16', // Lime
	'#10b981', // Emerald
	'#06b6d4', // Cyan
	'#3b82f6', // Blue
	'#8b5cf6', // Purple
	'#ec4899', // Pink
	'#64748b', // Slate
	'#27272a' // Dark Zinc
];

export const HYV_COLOR_PALETTE = [
	'#FFD000', // Mythic Gold (Transcendent / Artifact)
	'#A335EE', // Amethyst Purple (Epic / Master)
	'#0070DD', // Cerulean Blue (Rare / Adept)
	'#1EFF00', // Jade Green (Uncommon)
	'#CD7F32', // Weathered Bronze (Common)
	'#808080', // Slate Iron (Poor / Junk)
	'#FF8000', // Legendary Orange
	'#E6CC80', // Heirloom Cream
	'#E53935', // Crimson Hazard
	'#22272E' // Dark Obsidian
];

export const TIER_COLOR_PALETTE = HYV_COLOR_PALETTE;

/**
 * Resolves the theme-appropriate display color for any tier
 * @param {import('#lib/types.js').Tier | { label?: string; color?: string } | null | undefined} tier
 * @param {'hyv' | 'classic' | string} [theme]
 * @returns {string}
 */
export function getTierColor(tier, theme = 'hyv') {
	if (!tier) return theme === 'classic' ? '#3b82f6' : '#0070DD';

	const label = (tier.label || '').trim().toUpperCase();
	const color = (tier.color || '').trim().toLowerCase();

	if (theme === 'classic') {
		// If standard S-F label and matching either default classic or default hyv color
		if (label in CLASSIC_TIER_COLORS) {
			const classicDefault =
				CLASSIC_TIER_COLORS[/** @type {keyof typeof CLASSIC_TIER_COLORS} */ (label)];
			const hyvDefault =
				HYV_TIER_COLORS[/** @type {keyof typeof HYV_TIER_COLORS} */ (label)]?.toLowerCase();
			if (!color || color === classicDefault.toLowerCase() || color === hyvDefault) {
				return classicDefault;
			}
		}

		// Direct color mapping from Hyv prestige to Classic
		if (color === '#ffd000') return '#ef4444';
		if (color === '#a335ee') return '#f97316';
		if (color === '#0070dd' && (label === 'B' || label === 'NEW')) return '#eab308';
		if (color === '#1eff00') return '#84cc16';
		if (color === '#cd7f32') return '#06b6d4';
		if (color === '#808080') return '#64748b';

		return tier.color || '#3b82f6';
	}

	// Hyv theme
	if (label in HYV_TIER_COLORS) {
		const hyvDefault = HYV_TIER_COLORS[/** @type {keyof typeof HYV_TIER_COLORS} */ (label)];
		const classicDefault =
			CLASSIC_TIER_COLORS[/** @type {keyof typeof CLASSIC_TIER_COLORS} */ (label)]?.toLowerCase();
		if (!color || color === hyvDefault.toLowerCase() || color === classicDefault) {
			return hyvDefault;
		}
	}

	return tier.color || '#0070DD';
}
