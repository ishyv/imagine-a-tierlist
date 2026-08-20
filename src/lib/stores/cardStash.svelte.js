/**
 * Persistent Global Card Stash Store
 * Saves every card ever created across sessions in localStorage.
 * Enables 1-click re-use of cards across different tier lists.
 */

const STASH_STORAGE_KEY = 'tierlist-card-stash-v1';

/**
 * @typedef {Object} StashCard
 * @property {string} id
 * @property {string} name
 * @property {string} imageUrl
 * @property {string} [thumbnailUrl]
 * @property {string} [sourceUrl]
 * @property {string} [context]
 * @property {number} createdAt
 * @property {number} lastUsedAt
 * @property {number} usageCount
 */

class CardStashStore {
	/** @type {StashCard[]} */
	cards = $state([]);
	initialized = $state(false);

	constructor() {
		// Initialization called on mount
	}

	init() {
		if (this.initialized || typeof window === 'undefined') return;

		try {
			const raw = localStorage.getItem(STASH_STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					this.cards = parsed;
				}
			}
		} catch (e) {
			console.warn('Failed to load card stash from storage:', e);
		}

		this.initialized = true;
	}

	persist() {
		if (typeof window === 'undefined') return;
		try {
			// Cap stash to 300 most recent cards to guarantee storage limits
			if (this.cards.length > 300) {
				this.cards = this.cards.slice(0, 300);
			}
			localStorage.setItem(STASH_STORAGE_KEY, JSON.stringify($state.snapshot(this.cards)));
		} catch (e) {
			console.warn('Failed to save card stash to storage:', e);
		}
	}

	/**
	 * Adds a card to the stash or increments its usage count if already present
	 * @param {Object} card
	 * @param {string} card.name
	 * @param {string} card.imageUrl
	 * @param {string} [card.thumbnailUrl]
	 * @param {string} [card.sourceUrl]
	 * @param {string} [card.context]
	 * @returns {StashCard}
	 */
	addCard({ name, imageUrl, thumbnailUrl, sourceUrl, context }) {
		this.init();

		const cleanName = (name || '').trim();
		const cleanImg = (imageUrl || '').trim();
		if (!cleanName || !cleanImg) {
			return /** @type {any} */ (null);
		}

		// Find existing card by image URL or exact name+image
		const existingIndex = this.cards.findIndex(
			(c) =>
				c.imageUrl === cleanImg ||
				(c.name.toLowerCase() === cleanName.toLowerCase() && c.imageUrl === cleanImg)
		);

		if (existingIndex >= 0) {
			const existing = this.cards[existingIndex];
			existing.usageCount = (existing.usageCount || 1) + 1;
			existing.lastUsedAt = Date.now();
			if (context && !existing.context) existing.context = context;
			// Move to front (most recently used)
			this.cards.splice(existingIndex, 1);
			this.cards.unshift(existing);
			this.persist();
			return existing;
		}

		/** @type {StashCard} */
		const newCard = {
			id: `stash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			name: cleanName,
			imageUrl: cleanImg,
			thumbnailUrl: thumbnailUrl || cleanImg,
			sourceUrl: sourceUrl?.trim() || undefined,
			context: context?.trim() || undefined,
			createdAt: Date.now(),
			lastUsedAt: Date.now(),
			usageCount: 1
		};

		this.cards.unshift(newCard);
		this.persist();
		return newCard;
	}

	/**
	 * Bulk adds multiple cards to stash
	 * @param {Array<{ name: string; imageUrl: string; thumbnailUrl?: string; sourceUrl?: string }>} items
	 * @param {string} [context]
	 */
	addBulkCards(items, context = '') {
		for (const item of items) {
			if (item && item.name && item.imageUrl) {
				this.addCard({
					name: item.name,
					imageUrl: item.imageUrl,
					thumbnailUrl: item.thumbnailUrl,
					sourceUrl: item.sourceUrl,
					context
				});
			}
		}
	}

	/**
	 * Removes a card from stash
	 * @param {string} cardId
	 */
	removeCard(cardId) {
		this.cards = this.cards.filter((c) => c.id !== cardId);
		this.persist();
	}

	/**
	 * Clears entire card stash
	 */
	clearStash() {
		this.cards = [];
		this.persist();
	}

	/**
	 * Finds matching cards in stash for quick-add in AddItem
	 * @param {string} query
	 * @param {number} [limit]
	 * @returns {StashCard[]}
	 */
	findMatches(query, limit = 4) {
		const q = (query || '').toLowerCase().trim();
		if (!q || q.length < 2) return [];

		return this.cards
			.filter(
				(c) =>
					c.name.toLowerCase().includes(q) || (c.context && c.context.toLowerCase().includes(q))
			)
			.slice(0, limit);
	}

	/**
	 * Exports entire card stash as JSON
	 * @returns {string}
	 */
	exportJson() {
		return JSON.stringify($state.snapshot(this.cards), null, 2);
	}

	/**
	 * Imports card stash from JSON
	 * @param {string} jsonString
	 * @returns {boolean}
	 */
	importJson(jsonString) {
		try {
			const parsed = JSON.parse(jsonString);
			if (Array.isArray(parsed)) {
				this.cards = parsed;
				this.persist();
				return true;
			}
		} catch (e) {
			console.warn('Failed to import card stash JSON:', e);
		}
		return false;
	}
}

export const cardStash = new CardStashStore();
