/**
 * Tier List PNG Export Service
 * Renders the active tier list into a crisp, high-resolution PNG image on an HTML5 Canvas.
 * Synchronized with the hyvui operator aesthetic (near-black palette, IBM Plex Mono & Serif typography).
 */

import { getTierColor } from '#lib/services/tierColors.js';

/**
 * Calculates luminance of a hex color to determine text color
 * @param {string} hexColor
 * @returns {'#ffffff' | '#08090b'}
 */
export function getContrastTextColor(hexColor) {
	if (!hexColor) return '#ffffff';
	const hex = hexColor.replace('#', '');
	if (hex.length !== 6 && hex.length !== 3) return '#ffffff';

	let r, g, b;
	if (hex.length === 3) {
		r = parseInt(hex[0] + hex[0], 16);
		g = parseInt(hex[1] + hex[1], 16);
		b = parseInt(hex[2] + hex[2], 16);
	} else {
		r = parseInt(hex.slice(0, 2), 16);
		g = parseInt(hex.slice(2, 4), 16);
		b = parseInt(hex.slice(4, 6), 16);
	}

	// Relative luminance calculation per ITU-R BT.709
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.62 ? '#08090b' : '#ffffff';
}

/**
 * Helper to load an HTMLImageElement from a source URL
 * @param {string} src
 * @param {boolean} useCors
 * @returns {Promise<HTMLImageElement | null>}
 */
function loadToElement(src, useCors) {
	return new Promise((resolve) => {
		const img = new window.Image();
		if (useCors) {
			img.crossOrigin = 'anonymous';
		}
		img.referrerPolicy = 'no-referrer';

		let settled = false;
		const timer = setTimeout(() => {
			if (!settled) {
				settled = true;
				resolve(null);
			}
		}, 6000);

		img.onload = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				resolve(img);
			}
		};

		img.onerror = () => {
			if (!settled) {
				settled = true;
				clearTimeout(timer);
				resolve(null);
			}
		};

		img.src = src;
	});
}

/**
 * Loads an image from a URL into an HTMLImageElement safely for canvas export.
 * Employs direct CORS fetch and transparent server-side proxy fallback (/api/images/proxy)
 * to avoid canvas tainting and CORS rejection across external CDNs.
 *
 * @param {string} url
 * @returns {Promise<{ img: HTMLImageElement; cleanup?: () => void } | null>}
 */
async function loadImageSafe(url) {
	if (!url || typeof url !== 'string') return null;

	const trimmed = url.trim();
	if (!trimmed) return null;

	// 1. Data URLs and Blob URLs can be loaded directly without CORS headers
	if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
		const directImg = await loadToElement(trimmed, false);
		return directImg ? { img: directImg } : null;
	}

	// 2. Relative URLs (same-origin static assets)
	if (trimmed.startsWith('/')) {
		const directImg = await loadToElement(trimmed, false);
		return directImg ? { img: directImg } : null;
	}

	// 3. Attempt direct fetch with CORS (fastest path when remote server provides CORS headers)
	try {
		const directFetchRes = await fetch(trimmed, {
			mode: 'cors',
			credentials: 'omit',
			headers: { Accept: 'image/*,*/*' }
		});

		if (directFetchRes.ok) {
			const blob = await directFetchRes.blob();
			if (blob && blob.size > 0) {
				const objectUrl = URL.createObjectURL(blob);
				const directImg = await loadToElement(objectUrl, false);
				if (directImg) {
					return {
						img: directImg,
						cleanup: () => URL.revokeObjectURL(objectUrl)
					};
				}
				URL.revokeObjectURL(objectUrl);
			}
		}
	} catch {
		// Fall through to direct image / proxy fallback
	}

	// 4. Try loading direct HTMLImageElement with crossOrigin='anonymous'
	const directImg = await loadToElement(trimmed, true);
	if (directImg) {
		return { img: directImg };
	}

	// 5. Fallback: Fetch via server-side image proxy to bypass CORS restrictions & hotlink blockers
	try {
		const proxyUrl = `/api/images/proxy?url=${encodeURIComponent(trimmed)}`;
		const proxyRes = await fetch(proxyUrl);

		if (proxyRes.ok) {
			const blob = await proxyRes.blob();
			if (blob && blob.size > 0) {
				const objectUrl = URL.createObjectURL(blob);
				const proxiedImg = await loadToElement(objectUrl, false);
				if (proxiedImg) {
					return {
						img: proxiedImg,
						cleanup: () => URL.revokeObjectURL(objectUrl)
					};
				}
				URL.revokeObjectURL(objectUrl);
			}
		}
	} catch (e) {
		console.warn(`[exportImage] Failed to load image via proxy for ${trimmed}:`, e);
	}

	return null;
}

/**
 * Exports board as high-resolution PNG file download
 * @param {import('#lib/types.js').Board} board
 * @param {(progress: number) => void} [onProgress]
 * @param {'hyv' | 'classic' | string} [theme]
 * @returns {Promise<boolean>}
 */
export async function exportBoardAsPng(board, onProgress, theme = 'hyv') {
	if (typeof window === 'undefined') return false;

	const tiers = board.tiers || [];
	if (tiers.length === 0) return false;

	// Calculate layout dimensions (scale 2 for retina sharpness)
	const scale = 2;
	const boardWidth = 1000;
	const padding = 24;
	const headerHeight = 76;
	const footerHeight = 40;
	const tierHeaderWidth = 110;
	const cardSize = 90;
	const cardGap = 8;
	const availableCardWidth = boardWidth - padding * 2 - tierHeaderWidth - 16;
	const cardsPerRow = Math.max(
		1,
		Math.floor((availableCardWidth + cardGap) / (cardSize + cardGap))
	);

	// Pre-calculate heights for each tier
	const tierHeights = tiers.map((tier) => {
		const items = (board.items || []).filter((i) => i && i.tierId === tier.id);
		const rows = Math.max(1, Math.ceil(items.length / cardsPerRow));
		return Math.max(cardSize + 16, rows * (cardSize + cardGap) + 16);
	});

	const totalTiersHeight = tierHeights.reduce((acc, h) => acc + h + 2, 0);
	const boardHeight = padding * 2 + headerHeight + totalTiersHeight + footerHeight;

	// Create canvas
	const canvas = document.createElement('canvas');
	canvas.width = boardWidth * scale;
	canvas.height = boardHeight * scale;

	const ctx = canvas.getContext('2d');
	if (!ctx) return false;

	ctx.scale(scale, scale);

	// 1. Render Background
	ctx.fillStyle = theme === 'classic' ? '#09090b' : '#08090b';
	ctx.fillRect(0, 0, boardWidth, boardHeight);

	// 2. Render Header
	ctx.fillStyle = '#ffffff';
	ctx.font =
		theme === 'classic'
			? 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
			: 'normal 26px "ET Book", "Iowan Old Style", "Palatino Linotype", "Georgia", serif';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.fillText(board.title || 'Tier List', padding, padding + 22);

	if (board.context) {
		ctx.fillStyle = theme === 'classic' ? '#a1a1aa' : '#9ba3af';
		ctx.font = '500 11px "IBM Plex Mono", Menlo, Consolas, monospace';
		ctx.fillText(`// CONTEXT: ${board.context.toUpperCase()}`, padding, padding + 48);
	}

	// 3. Preload all Item & Tier Badge images concurrently with live progress updates
	const rankedItems = (board.items || []).filter((i) => i && i.tierId);
	const tiersWithImages = tiers.filter((t) => t.imageUrl);
	const totalImages = rankedItems.length + tiersWithImages.length;

	let loadedCount = 0;
	const incrementProgress = () => {
		loadedCount++;
		onProgress?.(totalImages > 0 ? (loadedCount / totalImages) * 100 : 100);
	};

	/** @type {Array<() => void>} */
	const cleanupFns = [];
	const tierImageMap = new Map();
	const imageMap = new Map();

	try {
		const tierPromises = tiersWithImages.map(async (tier) => {
			if (!tier.imageUrl) return;
			const result = await loadImageSafe(tier.imageUrl);
			if (result) {
				tierImageMap.set(tier.id, result.img);
				if (result.cleanup) cleanupFns.push(result.cleanup);
			}
			incrementProgress();
		});

		const itemPromises = rankedItems.map(async (item) => {
			if (!item.imageUrl) {
				incrementProgress();
				return;
			}
			const result = await loadImageSafe(item.imageUrl);
			if (result) {
				imageMap.set(item.id, result.img);
				if (result.cleanup) cleanupFns.push(result.cleanup);
			}
			incrementProgress();
		});

		await Promise.all([...tierPromises, ...itemPromises]);

		// 4. Render Tier Rows
		let currentY = padding + headerHeight;

		for (let tIdx = 0; tIdx < tiers.length; tIdx++) {
			const tier = tiers[tIdx];
			const tHeight = tierHeights[tIdx];
			const tierColor = getTierColor(tier, theme);
			const tierItems = (board.items || [])
				.filter((i) => i && i.tierId === tier.id)
				.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

			// Row background
			ctx.fillStyle = theme === 'classic' ? '#18181b' : '#0d1014';
			ctx.fillRect(padding, currentY, boardWidth - padding * 2, tHeight);

			// Left Tier Label Block
			ctx.fillStyle = tierColor;
			ctx.fillRect(padding, currentY, tierHeaderWidth, tHeight);

			const textColor = getContrastTextColor(tierColor);
			const tierImg = tierImageMap.get(tier.id);

			// Top tier index in block
			ctx.fillStyle = textColor;
			ctx.font = '500 9px "IBM Plex Mono", Menlo, Consolas, monospace';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			ctx.fillText((tIdx + 1).toString().padStart(2, '0') + ' //', padding + 8, currentY + 6);

			if (tierImg) {
				// Draw Badge Icon centered
				const iconSize = Math.min(50, tHeight - 28);
				const iconX = padding + (tierHeaderWidth - iconSize) / 2;
				const iconY = currentY + (tHeight - iconSize) / 2 - (tier.label ? 4 : 0);

				ctx.drawImage(tierImg, iconX, iconY, iconSize, iconSize);

				if (tier.label && tier.label !== ' ') {
					ctx.fillStyle = textColor;
					ctx.font = '500 10px "IBM Plex Mono", Menlo, Consolas, monospace';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'top';
					ctx.fillText(
						tier.label,
						padding + tierHeaderWidth / 2,
						iconY + iconSize + 2,
						tierHeaderWidth - 8
					);
				}
			} else {
				// Tier Label Text
				ctx.fillStyle = textColor;
				ctx.font =
					'normal 20px "ET Book", "Iowan Old Style", "Palatino Linotype", "Georgia", serif';
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';

				const labelText = tier.label || '';
				ctx.fillText(
					labelText,
					padding + tierHeaderWidth / 2,
					currentY + tHeight / 2,
					tierHeaderWidth - 10
				);
			}

			// Draw items in tier
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';

			let cardX = padding + tierHeaderWidth + 12;
			let cardY = currentY + 8;
			let colIndex = 0;

			for (const item of tierItems) {
				const img = imageMap.get(item.id);

				// Card Box Background
				ctx.fillStyle = theme === 'classic' ? '#18181b' : '#12151a';
				ctx.fillRect(cardX, cardY, cardSize, cardSize);

				if (img) {
					ctx.save();
					ctx.beginPath();
					ctx.rect(cardX, cardY, cardSize, cardSize);
					ctx.clip();

					const aspect = img.width / img.height;
					let drawW = cardSize;
					let drawH = cardSize;
					let offsetX = 0;
					let offsetY = 0;

					if (aspect > 1) {
						drawW = cardSize * aspect;
						offsetX = -(drawW - cardSize) / 2;
					} else {
						drawH = cardSize / aspect;
						offsetY = -(drawH - cardSize) / 2;
					}

					ctx.drawImage(img, cardX + offsetX, cardY + offsetY, drawW, drawH);

					// Dark gradient overlay for text readability
					const grad = ctx.createLinearGradient(
						cardX,
						cardY + cardSize - 26,
						cardX,
						cardY + cardSize
					);
					grad.addColorStop(0, 'rgba(8,9,11,0)');
					grad.addColorStop(1, 'rgba(8,9,11,0.92)');
					ctx.fillStyle = grad;
					ctx.fillRect(cardX, cardY + cardSize - 26, cardSize, 26);

					ctx.restore();
				} else {
					// Fallback visual when card has no image or image is unavailable
					ctx.fillStyle = theme === 'classic' ? '#27272a' : '#1a1f26';
					ctx.fillRect(cardX + 4, cardY + 4, cardSize - 8, cardSize - 32);

					// Initials badge in center of fallback card
					const initials = (item.name || '?')
						.split(/\s+/)
						.map((w) => w[0])
						.filter(Boolean)
						.slice(0, 2)
						.join('')
						.toUpperCase();

					ctx.fillStyle = theme === 'classic' ? '#71717a' : '#7e7568';
					ctx.font = '600 16px "IBM Plex Mono", Menlo, Consolas, monospace';
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(initials, cardX + cardSize / 2, cardY + (cardSize - 28) / 2);
				}

				// 1px border stroke around card
				ctx.strokeStyle = theme === 'classic' ? '#27272a' : 'rgba(186, 157, 108, 0.2)';
				ctx.lineWidth = 1;
				ctx.strokeRect(cardX, cardY, cardSize, cardSize);

				// Card Name text at bottom
				ctx.fillStyle = theme === 'classic' ? '#e4e4e7' : '#f0e8da';
				ctx.font = '500 9px "IBM Plex Mono", Menlo, Consolas, monospace';
				ctx.textAlign = 'left';
				ctx.textBaseline = 'alphabetic';
				ctx.fillText(
					item.name ? item.name.toLowerCase() : '',
					cardX + 4,
					cardY + cardSize - 5,
					cardSize - 8
				);

				// Next card position
				colIndex++;
				if (colIndex >= cardsPerRow) {
					colIndex = 0;
					cardX = padding + tierHeaderWidth + 12;
					cardY += cardSize + cardGap;
				} else {
					cardX += cardSize + cardGap;
				}
			}

			currentY += tHeight + 2;
		}

		// 5. Footer Watermark
		ctx.fillStyle = '#7e7568';
		ctx.font = '500 10px "IBM Plex Mono", Menlo, Consolas, monospace';
		ctx.textAlign = 'right';
		ctx.fillText(
			'IMAGINE A TIER LIST // BY HYVNT',
			boardWidth - padding,
			boardHeight - padding + 8
		);

		// Convert canvas to blob & trigger download
		return await new Promise((resolve) => {
			try {
				canvas.toBlob((blob) => {
					if (!blob) {
						resolve(false);
						return;
					}

					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					const cleanTitle = (board.title || 'tier-list').toLowerCase().replace(/[^a-z0-9]+/g, '-');
					a.href = url;
					a.download = `${cleanTitle}-tierlist.png`;
					a.click();
					URL.revokeObjectURL(url);
					resolve(true);
				}, 'image/png');
			} catch (canvasErr) {
				console.error('[exportImage] Canvas export failed with error:', canvasErr);
				resolve(false);
			}
		});
	} finally {
		// Clean up any generated object URLs to prevent memory leaks
		for (const cleanup of cleanupFns) {
			try {
				cleanup();
			} catch {
				// Ignore cleanup error
			}
		}
	}
}
