import { describe, it, expect } from 'bun:test';
import { getContrastTextColor } from '../src/lib/services/exportImage.js';

describe('exportImage service', () => {
	it('correctly calculates contrast text color for light colors', () => {
		expect(getContrastTextColor('#ffffff')).toBe('#08090b');
		expect(getContrastTextColor('#fef08a')).toBe('#08090b');
		expect(getContrastTextColor('#FFD000')).toBe('#08090b');
		expect(getContrastTextColor('#fff')).toBe('#08090b');
	});

	it('correctly calculates contrast text color for dark colors', () => {
		expect(getContrastTextColor('#000000')).toBe('#ffffff');
		expect(getContrastTextColor('#18181b')).toBe('#ffffff');
		expect(getContrastTextColor('#ef4444')).toBe('#ffffff');
		expect(getContrastTextColor('#0070DD')).toBe('#ffffff');
		expect(getContrastTextColor('#808080')).toBe('#ffffff');
	});

	it('handles invalid or empty hex values gracefully', () => {
		expect(getContrastTextColor('')).toBe('#ffffff');
		// @ts-ignore
		expect(getContrastTextColor(null)).toBe('#ffffff');
		expect(getContrastTextColor('invalid')).toBe('#ffffff');
	});
});
