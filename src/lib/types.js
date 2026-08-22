/**
 * @typedef {Object} Tier
 * @property {string} id - Unique identifier for the tier
 * @property {string} label - Display label (e.g. S, A, B, C, D, F)
 * @property {string} color - Hex color code (e.g. #ef4444)
 * @property {number} order - Ordering index in the tier list
 * @property {string} [imageUrl] - Optional image / badge URL for the tier header
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
 * @property {TasteProfileSnapshot} [tasteProfile] - Optional generated taste analysis snapshot
 */

/**
 * @typedef {Object} ImageSearchResult
 * @property {string} id - Unique identifier
 * @property {string} title - Title or description of the image
 * @property {string} thumbnailUrl - Scaled down thumbnail URL
 * @property {string} imageUrl - Full resolution image URL
 * @property {string} sourceUrl - Source website URL
 */

/** @typedef {'games' | 'movies' | 'music' | 'books' | 'general'} JudgeProfileId */

/** @typedef {'low' | 'medium' | 'high' | 'very_high'} ConfidenceLevel */

/** @typedef {'matched' | 'ambiguous' | 'unavailable' | 'fallback'} EnrichmentStatus */

/**
 * @typedef {Object} TasteProfileSource
 * @property {string} provider
 * @property {string} url
 * @property {string} [label]
 */

/**
 * @typedef {Object} EnrichedItem
 * @property {string} itemId
 * @property {string} canonicalName
 * @property {string} domain
 * @property {string} entityKind
 * @property {EnrichmentStatus} status
 * @property {ConfidenceLevel} confidence
 * @property {Record<string, unknown>} metadata
 * @property {TasteProfileSource[]} sources
 * @property {string} [message]
 */

/**
 * @typedef {Object} JudgeProfile
 * @property {JudgeProfileId} id
 * @property {number} version
 * @property {string} label
 * @property {string} description
 * @property {string[]} detectionTerms
 * @property {string[]} comparableDimensions
 * @property {string[]} emergentDimensionExamples
 * @property {string[]} evidenceRules
 * @property {string[]} forbiddenClaims
 * @property {string} promptGuidance
 */

/**
 * @typedef {Object} TasteProfileSection
 * @property {string} id
 * @property {string} title
 * @property {string} thesis
 * @property {string} analysis
 * @property {string[]} evidenceItemIds
 * @property {string[]} counterEvidenceItemIds
 * @property {ConfidenceLevel} confidence
 */

/**
 * @typedef {Object} TasteVectorDimension
 * @property {string} id
 * @property {string} name
 * @property {number} score
 * @property {ConfidenceLevel} confidence
 * @property {string} summary
 * @property {string[]} evidenceItemIds
 * @property {string[]} counterEvidenceItemIds
 */

/**
 * @typedef {Object} MindsetContrast
 * @property {string} left
 * @property {string} right
 * @property {string} leansToward
 * @property {number} strength
 * @property {string} explanation
 * @property {string[]} evidenceItemIds
 */

/**
 * @typedef {Object} TasteProfileSnapshot
 * @property {string} boardFingerprint
 * @property {string} generatedAt
 * @property {JudgeProfileId} judgeProfileId
 * @property {number} judgeProfileVersion
 * @property {string} language
 * @property {{ title: string; summary: string; confidence: ConfidenceLevel }} profile
 * @property {TasteProfileSection[]} sections
 * @property {MindsetContrast[]} mindset
 * @property {TasteVectorDimension[]} tasteVector
 * @property {string[]} limitations
 * @property {string} closingSummary
 * @property {EnrichedItem[]} enrichedItems
 * @property {{ provider: string; status: string; matchedCount: number; failedCount: number; message?: string }[]} enrichmentReport
 */

/**
 * @typedef {Object} BulkGeneratedItem
 * @property {string} name - Entity display name
 * @property {string} searchQuery - Search query optimized for finding official entity image
 */

/**
 * @typedef {Object} DisambiguationResult
 * @property {string} canonicalName - Normalized entity name
 * @property {string} searchQuery - Search query for character/entity art
 * @property {string} [category] - Entity category or franchise
 */

/**
 * @typedef {Object} AutoRankEntry
 * @property {string} itemId - Item ID
 * @property {string} tierId - Target tier ID
 * @property {string} [reason] - Rationale for tier placement
 */

export {};
