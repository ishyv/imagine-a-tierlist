import {
	loadBoardFromStorage,
	saveBoardToStorage,
	CURRENT_VERSION
} from '#lib/services/persistence.js';

/**
 * @typedef {import('#lib/types.js').Tier} Tier
 * @typedef {import('#lib/types.js').Item} Item
 * @typedef {import('#lib/types.js').Board} Board
 */

export const TIER_COLOR_PALETTE = [
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

/**
 * @returns {Tier[]}
 */
export function createDefaultTiers() {
	return [
		{ id: 'tier-s', label: 'S', color: '#ef4444', order: 0 },
		{ id: 'tier-a', label: 'A', color: '#f97316', order: 1 },
		{ id: 'tier-b', label: 'B', color: '#eab308', order: 2 },
		{ id: 'tier-c', label: 'C', color: '#84cc16', order: 3 },
		{ id: 'tier-d', label: 'D', color: '#06b6d4', order: 4 },
		{ id: 'tier-f', label: 'F', color: '#64748b', order: 5 }
	];
}

/**
 * @returns {Board}
 */
export function createDefaultBoard() {
	return {
		id: 'board-default',
		title: 'Tier List',
		context: '',
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

	constructor() {
		// Initialization handled via init() in browser mount
	}

	init() {
		if (this.initialized) return;
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
		saveBoardToStorage({
			id: this.id,
			title: this.title,
			context: this.context,
			tiers: $state.snapshot(this.tiers),
			items: $state.snapshot(this.items),
			version: this.version
		});
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
		return this.items.filter((item) => item.tierId === tierId).sort((a, b) => a.order - b.order);
	}

	/**
	 * @param {string} label
	 * @param {string} color
	 * @param {string | null} [afterTierId]
	 */
	addTier(label, color, afterTierId = null) {
		const newTier = {
			id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			label: label.trim() || 'New',
			color: color || '#3b82f6',
			order: this.tiers.length
		};

		if (afterTierId) {
			const index = this.tiers.findIndex((t) => t.id === afterTierId);
			if (index !== -1) {
				this.tiers.splice(index + 1, 0, newTier);
			} else {
				this.tiers.push(newTier);
			}
		} else {
			this.tiers.push(newTier);
		}

		this.tiers.forEach((tier, idx) => {
			tier.order = idx;
		});

		this.persist();
		return newTier;
	}

	/**
	 * @param {string} tierId
	 * @param {Partial<Pick<Tier, 'label' | 'color'>>} updates
	 */
	updateTier(tierId, updates) {
		const tier = this.tiers.find((t) => t.id === tierId);
		if (!tier) return;

		if (typeof updates.label === 'string') tier.label = updates.label;
		if (typeof updates.color === 'string') tier.color = updates.color;

		this.persist();
	}

	/**
	 * Deletes a tier and safely moves all its items to Unranked (tierId: null)
	 * @param {string} tierId
	 */
	deleteTier(tierId) {
		// Preserves cards by assigning them to unranked
		for (const item of this.items) {
			if (item.tierId === tierId) {
				item.tierId = null;
			}
		}

		this.tiers = this.tiers.filter((t) => t.id !== tierId);
		this.tiers.forEach((tier, idx) => {
			tier.order = idx;
		});

		this.persist();
	}

	/**
	 * Moves a tier up or down
	 * @param {string} tierId
	 * @param {'up' | 'down'} direction
	 */
	moveTier(tierId, direction) {
		const index = this.tiers.findIndex((t) => t.id === tierId);
		if (index === -1) return;

		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (targetIndex < 0 || targetIndex >= this.tiers.length) return;

		const [moved] = this.tiers.splice(index, 1);
		this.tiers.splice(targetIndex, 0, moved);

		this.tiers.forEach((tier, idx) => {
			tier.order = idx;
		});

		this.persist();
	}

	/**
	 * Clears cards from a tier back into unranked pool
	 * @param {string} tierId
	 */
	clearTierCards(tierId) {
		for (const item of this.items) {
			if (item.tierId === tierId) {
				item.tierId = null;
			}
		}
		this.persist();
	}

	/**
	 * Adds a new item to the Unranked pool
	 * @param {string} name
	 * @param {string} imageUrl
	 * @param {string} [sourceUrl]
	 * @returns {Item}
	 */
	addItem(name, imageUrl, sourceUrl = '') {
		const unranked = this.getItemsForTier(null);
		const newItem = {
			id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			name: name.trim(),
			imageUrl: imageUrl.trim(),
			sourceUrl: sourceUrl.trim() || undefined,
			tierId: null,
			order: unranked.length
		};

		this.items.push(newItem);
		this.persist();
		return newItem;
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
		this.items = this.items.filter((i) => i.id !== itemId);
		this.persist();
	}

	/**
	 * Updates the items belonging to a given tier or unranked zone following a drag-and-drop event
	 * @param {string | null} tierId
	 * @param {Item[]} tierItems
	 */
	updateTierItems(tierId, tierItems) {
		const updatedIds = new Set(tierItems.map((i) => i.id));
		const currentTierItemsMap = new Map(
			tierItems.map((item, idx) => [item.id, { ...item, tierId, order: idx }])
		);

		// Update items in the main array
		const nextItems = [];
		for (const item of this.items) {
			if (updatedIds.has(item.id)) {
				const updated = currentTierItemsMap.get(item.id);
				if (updated) nextItems.push(updated);
			} else if (item.tierId === tierId) {
				// Item was moved out of this tier, will be accounted for in the target tier
			} else {
				nextItems.push(item);
			}
		}

		// Also make sure any newly added items to tierItems (e.g. dragged from another tier) are included
		for (const [id, item] of currentTierItemsMap.entries()) {
			if (!nextItems.some((i) => i.id === id)) {
				nextItems.push(item);
			}
		}

		this.items = nextItems;
		this.persist();
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
			if (
				parsed &&
				typeof parsed === 'object' &&
				Array.isArray(parsed.tiers) &&
				Array.isArray(parsed.items)
			) {
				this.title = parsed.title || 'Tier List';
				this.context = parsed.context || '';
				this.tiers = parsed.tiers;
				this.items = parsed.items;
				this.version = parsed.version || CURRENT_VERSION;
				this.persist();
				return true;
			}
		} catch (e) {
			console.error('Failed to parse board JSON:', e);
		}
		return false;
	}
}

export const board = new BoardStore();
