import {
	loadBoardFromStorage,
	saveBoardToStorage,
	loadBoardById,
	saveBoardToRegistry,
	deleteBoardFromRegistry,
	getBoardsRegistry,
	sanitizeBoard,
	CURRENT_VERSION
} from '#lib/services/persistence.js';
import { cardStash } from '#lib/stores/cardStash.svelte.js';

/**
 * @typedef {import('#lib/types.js').Tier} Tier
 * @typedef {import('#lib/types.js').Item} Item
 * @typedef {import('#lib/types.js').Board} Board
 */

export const TIER_COLOR_PALETTE = [
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

/**
 * @returns {Tier[]}
 */
export function createDefaultTiers() {
	return [
		{ id: 'tier-s', label: 'S', color: '#FFD000', order: 0 },
		{ id: 'tier-a', label: 'A', color: '#A335EE', order: 1 },
		{ id: 'tier-b', label: 'B', color: '#0070DD', order: 2 },
		{ id: 'tier-c', label: 'C', color: '#1EFF00', order: 3 },
		{ id: 'tier-d', label: 'D', color: '#CD7F32', order: 4 },
		{ id: 'tier-f', label: 'F', color: '#808080', order: 5 }
	];
}

/**
 * @param {string} [title]
 * @param {string} [context]
 * @returns {Board}
 */
export function createDefaultBoard(title = 'Tier List', context = '') {
	return {
		id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		title,
		context,
		tiers: createDefaultTiers(),
		items: [],
		version: CURRENT_VERSION
	};
}

class BoardStore {
	title = $state('Tier List');
	context = $state('');
	/** @type {Tier[]} */
	tiers = $state(createDefaultTiers());
	/** @type {Item[]} */
	items = $state([]);
	version = $state(CURRENT_VERSION);
	id = $state('board-default');
	initialized = $state(false);
	lastSavedAt = $state(Date.now());
	isSaved = $state(true);
	/** @type {Item | null} */
	zoomedItem = $state(null);

	constructor() {
		// Initialization handled via init() in browser mount
	}

	init() {
		if (this.initialized) return;

		cardStash.init();

		const saved = loadBoardFromStorage();
		if (saved) {
			this.id = saved.id || 'board-default';
			this.title = saved.title || 'Tier List';
			this.context = saved.context || '';
			this.tiers =
				Array.isArray(saved.tiers) && saved.tiers.length > 0 ? saved.tiers : createDefaultTiers();
			this.items = Array.isArray(saved.items) ? saved.items : [];
			this.version = saved.version || CURRENT_VERSION;
		}

		this.initialized = true;
	}

	persist() {
		this.isSaved = false;
		saveBoardToStorage({
			id: this.id,
			title: this.title,
			context: this.context,
			tiers: $state.snapshot(this.tiers),
			items: $state.snapshot(this.items),
			version: this.version
		});
		this.lastSavedAt = Date.now();
		this.isSaved = true;
	}

	/**
	 * @param {string} title
	 */
	setTitle(title) {
		this.title = title;
		this.persist();
	}

	/**
	 * @param {string} context
	 */
	setContext(context) {
		this.context = context;
		this.persist();
	}

	/**
	 * @param {string | null} tierId
	 * @returns {Item[]}
	 */
	getItemsForTier(tierId) {
		return this.items
			.filter((item) => item && typeof item === 'object' && item.tierId === tierId)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}

	/**
	 * @param {string} label
	 * @param {string} color
	 * @returns {Tier}
	 */
	addTier(label = 'NEW', color = '#3b82f6') {
		const newOrder = this.tiers.length;
		const newTier = {
			id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			label,
			color,
			order: newOrder
		};
		this.tiers.push(newTier);
		this.persist();
		return newTier;
	}

	/**
	 * Adds a new tier immediately above a reference tier
	 * @param {string} targetTierId
	 * @param {string} [label]
	 * @param {string} [color]
	 */
	addTierAbove(targetTierId, label = 'NEW', color = '#0070DD') {
		const targetIndex = this.tiers.findIndex((t) => t.id === targetTierId);
		if (targetIndex === -1) return this.addTier(label, color);

		const newTier = {
			id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			label,
			color,
			order: targetIndex
		};

		this.tiers.splice(targetIndex, 0, newTier);
		this.reindexTiers();
		this.persist();
		return newTier;
	}

	/**
	 * Adds a new tier immediately below a reference tier
	 * @param {string} targetTierId
	 * @param {string} [label]
	 * @param {string} [color]
	 */
	addTierBelow(targetTierId, label = 'NEW', color = '#0070DD') {
		const targetIndex = this.tiers.findIndex((t) => t.id === targetTierId);
		if (targetIndex === -1) return this.addTier(label, color);

		const newTier = {
			id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			label,
			color,
			order: targetIndex + 1
		};

		this.tiers.splice(targetIndex + 1, 0, newTier);
		this.reindexTiers();
		this.persist();
		return newTier;
	}

	/**
	 * @param {string} tierId
	 * @param {Partial<Pick<Tier, 'label' | 'color' | 'order' | 'imageUrl'>>} updates
	 */
	updateTier(tierId, updates) {
		const tier = this.tiers.find((t) => t.id === tierId);
		if (!tier) return;

		if (typeof updates.label === 'string') tier.label = updates.label;
		if (typeof updates.color === 'string') tier.color = updates.color;
		if (typeof updates.order === 'number') tier.order = updates.order;
		if ('imageUrl' in updates) {
			tier.imageUrl = updates.imageUrl ? updates.imageUrl.trim() : undefined;
		}

		this.persist();
	}

	/**
	 * Moves a tier up in order
	 * @param {string} tierId
	 */
	moveTierUp(tierId) {
		const index = this.tiers.findIndex((t) => t.id === tierId);
		if (index <= 0) return;

		const temp = this.tiers[index - 1];
		this.tiers[index - 1] = this.tiers[index];
		this.tiers[index] = temp;

		this.reindexTiers();
		this.persist();
	}

	/**
	 * Moves a tier down in order
	 * @param {string} tierId
	 */
	moveTierDown(tierId) {
		const index = this.tiers.findIndex((t) => t.id === tierId);
		if (index === -1 || index >= this.tiers.length - 1) return;

		const temp = this.tiers[index + 1];
		this.tiers[index + 1] = this.tiers[index];
		this.tiers[index] = temp;

		this.reindexTiers();
		this.persist();
	}

	/**
	 * Re-indexes all tier orders cleanly (0..N-1)
	 */
	reindexTiers() {
		this.tiers.forEach((tier, idx) => {
			tier.order = idx;
		});
	}

	/**
	 * Moves all items in a tier to Unranked (tierId = null)
	 * @param {string} tierId
	 */
	clearTier(tierId) {
		const unranked = this.getItemsForTier(null);
		let nextOrder = unranked.length;

		for (const item of this.items) {
			if (item.tierId === tierId) {
				item.tierId = null;
				item.order = nextOrder++;
			}
		}

		this.persist();
	}

	/**
	 * Deletes a tier and moves all contained cards safely to Unranked pool
	 * @param {string} tierId
	 */
	deleteTier(tierId) {
		this.clearTier(tierId);
		this.tiers = this.tiers.filter((t) => t.id !== tierId);
		this.reindexTiers();
		this.persist();
	}

	/**
	 * Adds a single card to Unranked pool and automatically pipes to Global Card Stash
	 * @param {string} name
	 * @param {string} imageUrl
	 * @param {string} [sourceUrl]
	 * @returns {Item}
	 */
	addItem(name, imageUrl, sourceUrl) {
		const unranked = this.getItemsForTier(null);
		const newItem = {
			id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			name: name.trim(),
			imageUrl: (imageUrl || '').trim(),
			sourceUrl: sourceUrl?.trim() || undefined,
			tierId: null,
			order: unranked.length
		};

		this.items.push(newItem);
		this.persist();

		// Auto-save to permanent Global Card Stash
		cardStash.addCard({
			name: newItem.name,
			imageUrl: newItem.imageUrl,
			sourceUrl: newItem.sourceUrl,
			context: this.context
		});

		return newItem;
	}

	/**
	 * Adds multiple items to the Unranked pool in a single batch and pipes to Card Stash
	 * @param {Array<{ name: string; imageUrl: string; sourceUrl?: string }>} itemsList
	 * @returns {Item[]}
	 */
	addMultipleItems(itemsList) {
		const unranked = this.getItemsForTier(null);
		let currentOrder = unranked.length;

		/** @type {Item[]} */
		const newItems = [];

		for (const item of itemsList) {
			const trimmedName = (item.name || '').trim();
			if (!trimmedName) continue;

			const newItem = {
				id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
				name: trimmedName,
				imageUrl: (item.imageUrl || '').trim(),
				sourceUrl: (item.sourceUrl || '').trim() || undefined,
				tierId: null,
				order: currentOrder++
			};

			newItems.push(newItem);
			this.items.push(newItem);
		}

		this.persist();

		// Auto-save batch to permanent Global Card Stash
		cardStash.addBulkCards(newItems, this.context);

		return newItems;
	}

	/**
	 * Adds a card from the global stash directly to the board
	 * @param {import('#lib/stores/cardStash.svelte.js').StashCard} stashCard
	 * @param {string | null} [targetTierId]
	 * @returns {Item}
	 */
	addCardFromStash(stashCard, targetTierId = null) {
		const existingItemsInTier = this.getItemsForTier(targetTierId);
		const newItem = {
			id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			name: stashCard.name,
			imageUrl: stashCard.imageUrl,
			sourceUrl: stashCard.sourceUrl,
			tierId: targetTierId,
			order: existingItemsInTier.length
		};

		this.items.push(newItem);
		this.persist();

		// Update usage count in stash
		cardStash.addCard({
			name: stashCard.name,
			imageUrl: stashCard.imageUrl,
			sourceUrl: stashCard.sourceUrl,
			context: this.context
		});

		return newItem;
	}

	/**
	 * Applies AI rankings to distribute items across tiers
	 * @param {Array<{ itemId: string; tierId: string; reason?: string }>} rankings
	 */
	applyRankings(rankings) {
		const rankMap = new Map(rankings.map((r) => [r.itemId, r.tierId]));

		// Count existing orders per tier to preserve stable ordering
		/** @type {Record<string, number>} */
		const tierCounters = {};
		for (const tier of this.tiers) {
			tierCounters[tier.id] = 0;
		}

		for (const item of this.items) {
			if (rankMap.has(item.id)) {
				const targetTierId = rankMap.get(item.id) || null;
				item.tierId = targetTierId;
				const currentCount = targetTierId ? tierCounters[targetTierId] || 0 : 0;
				item.order = currentCount;
				if (targetTierId) {
					tierCounters[targetTierId] = currentCount + 1;
				}
			}
		}

		this.persist();
	}

	/**
	 * @param {string} itemId
	 * @param {Partial<Pick<Item, 'name' | 'imageUrl' | 'sourceUrl' | 'tierId' | 'order'>>} updates
	 */
	updateItem(itemId, updates) {
		const item = this.items.find((i) => i.id === itemId);
		if (!item) return;

		if (typeof updates.name === 'string') item.name = updates.name.trim();
		if (typeof updates.imageUrl === 'string') item.imageUrl = updates.imageUrl.trim();
		if (typeof updates.sourceUrl !== 'undefined')
			item.sourceUrl = updates.sourceUrl?.trim() || undefined;
		if (typeof updates.tierId !== 'undefined') item.tierId = updates.tierId;
		if (typeof updates.order === 'number') item.order = updates.order;

		this.persist();
	}

	/**
	 * @param {string} itemId
	 */
	deleteItem(itemId) {
		if (this.zoomedItem?.id === itemId) {
			this.closeZoom();
		}
		this.items = this.items.filter((i) => i.id !== itemId);
		this.persist();
	}

	/**
	 * Opens global zoom / inspection modal for a card
	 * @param {Item} item
	 */
	openZoom(item) {
		this.zoomedItem = item;
	}

	/**
	 * Closes global zoom / inspection modal
	 */
	closeZoom() {
		this.zoomedItem = null;
	}

	/**
	 * Navigates to next item on the board
	 */
	nextZoomedItem() {
		if (!this.zoomedItem || this.items.length <= 1) return;
		const currentIndex = this.items.findIndex((i) => i.id === this.zoomedItem?.id);
		if (currentIndex === -1) return;
		const nextIndex = (currentIndex + 1) % this.items.length;
		this.zoomedItem = this.items[nextIndex];
	}

	/**
	 * Navigates to previous item on the board
	 */
	prevZoomedItem() {
		if (!this.zoomedItem || this.items.length <= 1) return;
		const currentIndex = this.items.findIndex((i) => i.id === this.zoomedItem?.id);
		if (currentIndex === -1) return;
		const prevIndex = (currentIndex - 1 + this.items.length) % this.items.length;
		this.zoomedItem = this.items[prevIndex];
	}

	/**
	 * Sets the tier for the currently zoomed item
	 * @param {string | null} tierId
	 */
	setZoomedItemTier(tierId) {
		if (!this.zoomedItem) return;
		const itemsInTier = this.getItemsForTier(tierId);
		this.updateItem(this.zoomedItem.id, {
			tierId,
			order: itemsInTier.length
		});
		const updated = this.items.find((i) => i.id === this.zoomedItem?.id);
		if (updated) {
			this.zoomedItem = updated;
		}
	}

	/**
	 * Updates the items belonging to a given tier or unranked zone following a drag-and-drop event
	 * @param {string | null} tierId
	 * @param {Item[]} tierItems
	 */
	updateTierItems(tierId, tierItems) {
		const validTierItems = Array.isArray(tierItems)
			? tierItems.filter((item) => item && typeof item === 'object' && typeof item.id === 'string')
			: [];
		const updatedIds = new Set(validTierItems.map((i) => i.id));
		const currentTierItemsMap = new Map(
			validTierItems.map((item, idx) => [item.id, { ...item, tierId, order: idx }])
		);

		// Build next items safely without ever dropping items that are in transition
		const nextItems = [];
		for (const item of this.items) {
			if (!item || !item.id) continue;
			if (updatedIds.has(item.id)) {
				const updated = currentTierItemsMap.get(item.id);
				if (updated) nextItems.push(updated);
			} else {
				nextItems.push(item);
			}
		}

		// Also make sure any newly added items to tierItems (e.g. dragged from another tier) are included
		for (const [id, item] of currentTierItemsMap.entries()) {
			if (!nextItems.some((i) => i && i.id === id)) {
				nextItems.push(item);
			}
		}

		this.items = nextItems;
		this.persist();
	}

	/**
	 * Starts a new blank tier list while safely preserving the current one in the registry
	 * @param {string} [title]
	 * @param {string} [context]
	 */
	createNewBoard(title = 'New Tier List', context = '') {
		// Save current board to registry
		this.persist();

		// Switch to fresh board
		this.id = `board-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		this.title = title;
		this.context = context;
		this.tiers = createDefaultTiers();
		this.items = [];
		this.persist();
	}

	/**
	 * Switches to a saved board by ID
	 * @param {string} boardId
	 */
	switchBoard(boardId) {
		if (boardId === this.id) return;

		// Save current before switching
		this.persist();

		const loaded = loadBoardById(boardId);
		if (loaded) {
			this.id = loaded.id || boardId;
			this.title = loaded.title || 'Tier List';
			this.context = loaded.context || '';
			this.tiers =
				Array.isArray(loaded.tiers) && loaded.tiers.length > 0
					? loaded.tiers
					: createDefaultTiers();
			this.items = Array.isArray(loaded.items) ? loaded.items : [];
			this.version = loaded.version || CURRENT_VERSION;
			this.persist();
		}
	}

	/**
	 * Duplicates the current board
	 */
	duplicateCurrentBoard() {
		const clone = {
			id: `board-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			title: `${this.title} (Copy)`,
			context: this.context,
			tiers: JSON.parse(JSON.stringify($state.snapshot(this.tiers))),
			items: JSON.parse(JSON.stringify($state.snapshot(this.items))),
			version: this.version
		};

		saveBoardToRegistry(clone);
		this.switchBoard(clone.id);
	}

	/**
	 * Deletes a board from the saved registry
	 * @param {string} boardId
	 */
	deleteSavedBoard(boardId) {
		deleteBoardFromRegistry(boardId);
		if (this.id === boardId) {
			const remaining = getBoardsRegistry();
			if (remaining.length > 0) {
				this.switchBoard(remaining[0].id);
			} else {
				this.resetBoard();
			}
		}
	}

	/**
	 * Resets board to default S-F tiers and removes all cards
	 */
	resetBoard() {
		this.title = 'Tier List';
		this.context = '';
		this.tiers = createDefaultTiers();
		this.items = [];
		this.persist();
	}

	/**
	 * Exports the current board as formatted JSON
	 * @returns {string}
	 */
	exportJson() {
		return JSON.stringify(
			{
				id: this.id,
				title: this.title,
				context: this.context,
				tiers: $state.snapshot(this.tiers),
				items: $state.snapshot(this.items),
				version: this.version
			},
			null,
			2
		);
	}

	/**
	 * Imports board from JSON string
	 * @param {string} jsonString
	 */
	importJson(jsonString) {
		try {
			const parsed = JSON.parse(jsonString);
			const sanitized = sanitizeBoard(parsed);
			if (sanitized) {
				this.id = sanitized.id || `board-${Date.now()}`;
				this.title = sanitized.title || 'Tier List';
				this.context = sanitized.context || '';
				this.tiers = sanitized.tiers.length > 0 ? sanitized.tiers : createDefaultTiers();
				this.items = sanitized.items;
				this.version = sanitized.version || CURRENT_VERSION;
				this.persist();

				// Also auto-pipe imported items to card stash
				cardStash.addBulkCards(this.items, this.context);

				return true;
			}
		} catch (e) {
			console.error('Failed to parse board JSON:', e);
		}
		return false;
	}
}

export const board = new BoardStore();
