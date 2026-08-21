import { describe, it, expect } from 'bun:test';
import { getContrastTextColor } from '../src/lib/services/exportImage.js';
import {
	getTierColor,
	CLASSIC_TIER_COLORS,
	HYV_TIER_COLORS
} from '../src/lib/services/tierColors.js';

describe('tierColors and export utilities', () => {
	it('resolves contrast text color correctly for light and dark backgrounds', () => {
		expect(getContrastTextColor('#ffffff')).toBe('#08090b');
		expect(getContrastTextColor('#FFD000')).toBe('#08090b');
		expect(getContrastTextColor('#000000')).toBe('#ffffff');
		expect(getContrastTextColor('#ef4444')).toBe('#ffffff');
	});

	it('resolves tier colors for classic and hyv themes', () => {
		expect(getTierColor({ label: 'S', color: '#ef4444' }, 'classic')).toBe(CLASSIC_TIER_COLORS.S);
		expect(getTierColor({ label: 'S', color: '#FFD000' }, 'hyv')).toBe(HYV_TIER_COLORS.S);
		expect(getTierColor({ label: 'A', color: '#A335EE' }, 'classic')).toBe(CLASSIC_TIER_COLORS.A);
	});
});
