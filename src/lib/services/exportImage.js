/**
 * Tier List PNG Export Service
 * Renders the active tier list into a crisp, high-resolution PNG image on an HTML5 Canvas.
 * Synchronized with the hyvui operator aesthetic (near-black palette, IBM Plex Mono & Serif typography).
 */

import { getTierColor } from '#lib/stores/board.svelte.js';
import { themeStore } from '#lib/stores/theme.svelte.js';

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
 * Loads an image into an HTMLImageElement with CORS handling
 * @param {string} url
 * @returns {Promise<HTMLImageElement | null>}
 */
function loadImage(url) {
	return new Promise((resolve) => {
		if (!url) {
			resolve(null);
			return;
		}

		const img = new window.Image();
		img.crossOrigin = 'anonymous';

		let isSettled = false;

		const timer = setTimeout(() => {
			if (!isSettled) {
				isSettled = true;
				resolve(null);
			}
		}, 3500); // 3.5s timeout per image

		img.onload = () => {
			if (!isSettled) {
				isSettled = true;
				clearTimeout(timer);
				resolve(img);
			}
		};

		img.onerror = () => {
			if (!isSettled) {
				isSettled = true;
				clearTimeout(timer);
				resolve(null);
			}
		};

		img.src = url;
	});
}

/**
 * Exports board as high-resolution PNG file download
 * @param {import('#lib/types.js').Board} board
 * @param {(progress: number) => void} [onProgress]
 * @param {'hyv' | 'classic' | string} [theme]
 * @returns {Promise<boolean>}
 */
export async function exportBoardAsPng(board, onProgress, theme = themeStore.current) {
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

	// 3. Preload all Item & Tier Badge images safely with timeout
	const tierImageMap = new Map();
	for (const tier of tiers) {
		if (tier.imageUrl) {
			const img = await loadImage(tier.imageUrl);
			tierImageMap.set(tier.id, img);
		}
	}

	const rankedItems = (board.items || []).filter((i) => i && i.tierId);
	const totalImages = rankedItems.length + tiers.filter((t) => t.imageUrl).length;
	let loadedCount = 0;
	const imageMap = new Map();

	for (const item of rankedItems) {
		if (item.imageUrl) {
			const img = await loadImage(item.imageUrl);
			imageMap.set(item.id, img);
		}
		loadedCount++;
		onProgress?.(totalImages > 0 ? (loadedCount / totalImages) * 100 : 100);
	}

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
			ctx.font = 'normal 20px "ET Book", "Iowan Old Style", "Palatino Linotype", "Georgia", serif';
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
			ctx.fillStyle = '#12151a';
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
			}

			// 1px border stroke around card
			ctx.strokeStyle = 'rgba(186, 157, 108, 0.2)';
			ctx.lineWidth = 1;
			ctx.strokeRect(cardX, cardY, cardSize, cardSize);

			// Card Name text at bottom
			ctx.fillStyle = '#f0e8da';
			ctx.font = '500 9px "IBM Plex Mono", Menlo, Consolas, monospace';
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
	ctx.fillText('IMAGINE A TIER LIST // BY HYVNT', boardWidth - padding, boardHeight - padding + 8);

	// Convert canvas to blob & trigger download
	return new Promise((resolve) => {
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
	});
}
