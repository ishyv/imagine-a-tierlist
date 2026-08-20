/**
 * Theme Store for Imagine a Tier List
 * Manages switching between 'hyv' (Operator / Classified instrument) and 'classic' (Modern / Zinc dark) aesthetics.
 */

/** @typedef {'hyv' | 'classic'} AppTheme */

const THEME_STORAGE_KEY = 'tierlist-theme-mode';

class ThemeStore {
	/** @type {AppTheme} */
	current = $state('hyv');

	initialized = false;

	constructor() {
		// Browser initialization runs in init()
	}

	init() {
		if (this.initialized || typeof window === 'undefined') return;

		const saved = localStorage.getItem(THEME_STORAGE_KEY);
		if (saved === 'classic' || saved === 'hyv') {
			this.current = saved;
		} else {
			this.current = 'hyv';
		}

		this.applyToDocument();
		this.initialized = true;
	}

	/**
	 * @param {AppTheme} theme
	 */
	setTheme(theme) {
		this.current = theme;
		if (typeof window !== 'undefined') {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
			this.applyToDocument();
		}
	}

	toggleTheme() {
		this.setTheme(this.current === 'hyv' ? 'classic' : 'hyv');
	}

	applyToDocument() {
		if (typeof document === 'undefined') return;
		document.documentElement.setAttribute('data-theme', this.current);
		document.body.setAttribute('data-theme', this.current);
	}
}

export const themeStore = new ThemeStore();
