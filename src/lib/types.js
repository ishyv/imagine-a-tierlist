/**
 * @typedef {Object} Tier
 * @property {string} id - Unique identifier for the tier
 * @property {string} label - Display label (e.g. S, A, B, C, D, F)
 * @property {string} color - Hex color code (e.g. #ef4444)
 * @property {number} order - Ordering index in the tier list
 */

/**
 * @typedef {Object} Item
 * @property {string} id - Unique identifier for the item
 * @property {string} name - Display name of the item
 * @property {string} imageUrl - Direct image URL
 * @property {string} [sourceUrl] - Original web source URL
 * @property {string | null} tierId - Tier ID the item belongs to, or null if unranked
 * @property {number} order - Ordering index within the tier / unranked pool
 */

/**
 * @typedef {Object} Board
 * @property {string} id - Board ID
 * @property {string} title - Board title
 * @property {string} context - Board context used to refine image search (e.g. "League of Legends")
 * @property {Tier[]} tiers - List of tiers
 * @property {Item[]} items - List of items (ranked and unranked)
 * @property {number} version - Schema version number for persistence
 */

/**
 * @typedef {Object} ImageSearchResult
 * @property {string} id - Unique identifier
 * @property {string} title - Title or description of the image
 * @property {string} thumbnailUrl - Scaled down thumbnail URL
 * @property {string} imageUrl - Full resolution image URL
 * @property {string} sourceUrl - Source website URL
 */

export {};
