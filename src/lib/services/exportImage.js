/**
 * Tier List PNG Export Service
 * Renders the active tier list into a crisp, high-resolution PNG image on an HTML5 Canvas.
 * No heavy external dependencies; works completely client-side in all modern browsers.
 */

/**
 * Calculates luminance of a hex color to determine text color
 * @param {string} hexColor
 * @returns {'#ffffff' | '#09090b'}
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
	return luminance > 0.62 ? '#09090b' : '#ffffff';
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

		const timer = setTimeout(() => {
			resolve(null);
		}, 3500); // 3.5s timeout per image

		img.onload = () => {
			clearTimeout(timer);
			resolve(img);
		};

		img.onerror = () => {
			clearTimeout(timer);
			resolve(null);
		};

		img.src = url;
	});
}

/**
 * Draws rounded rectangle on 2D context
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function roundRect(ctx, x, y, width, height, radius) {
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
}

/**
 * Exports board as high-resolution PNG file download
 * @param {import('#lib/types.js').Board} board
 * @param {(progress: number) => void} [onProgress]
 * @returns {Promise<boolean>}
 */
export async function exportBoardAsPng(board, onProgress) {
	if (typeof window === 'undefined') return false;

	const tiers = board.tiers || [];
	if (tiers.length === 0) return false;

	// Calculate layout dimensions (at standard 1x scale, then scale to 2x for retina sharpness)
	const scale = 2;
	const boardWidth = 1000;
	const padding = 24;
	const headerHeight = 70;
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
	const boardHeight = headerHeight + totalTiersHeight + footerHeight + padding * 2;

	// Create offscreen canvas
	const canvas = document.createElement('canvas');
	canvas.width = boardWidth * scale;
	canvas.height = boardHeight * scale;

	const ctx = canvas.getContext('2d');
	if (!ctx) return false;

	ctx.scale(scale, scale);

	// 1. Background
	ctx.fillStyle = '#09090b';
	ctx.fillRect(0, 0, boardWidth, boardHeight);

	// 2. Header Title & Context
	ctx.fillStyle = '#f4f4f5';
	ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
	ctx.fillText(board.title || 'Tier List', padding, padding + 28);

	if (board.context) {
		ctx.fillStyle = '#a1a1aa';
		ctx.font = '500 13px system-ui, -apple-system, sans-serif';
		ctx.fillText(`Context: ${board.context}`, padding, padding + 48);
	}

	// 3. Preload all ranked images and tier badge images
	const rankedItems = (board.items || []).filter((i) => i && i.tierId);
	let loadedCount = 0;
	const totalImages = rankedItems.length + tiers.filter((t) => t.imageUrl).length;

	/** @type {Map<string, HTMLImageElement | null>} */
	const imageMap = new Map();
	/** @type {Map<string, HTMLImageElement | null>} */
	const tierImageMap = new Map();

	for (const tier of tiers) {
		if (tier.imageUrl) {
			const img = await loadImage(tier.imageUrl);
			tierImageMap.set(tier.id, img);
			loadedCount++;
			onProgress?.(totalImages > 0 ? (loadedCount / totalImages) * 100 : 100);
		}
	}

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
		const tierItems = (board.items || [])
			.filter((i) => i && i.tierId === tier.id)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

		// Row background
		ctx.fillStyle = '#18181b';
		ctx.fillRect(padding, currentY, boardWidth - padding * 2, tHeight);

		// Left Tier Label Block
		ctx.fillStyle = tier.color || '#3b82f6';
		ctx.fillRect(padding, currentY, tierHeaderWidth, tHeight);

		const textColor = getContrastTextColor(tier.color);
		const tierImg = tierImageMap.get(tier.id);

		if (tierImg) {
			// Draw Badge Icon centered
			const iconSize = Math.min(52, tHeight - 24);
			const iconX = padding + (tierHeaderWidth - iconSize) / 2;
			const iconY = currentY + (tHeight - iconSize) / 2 - (tier.label ? 6 : 0);

			ctx.drawImage(tierImg, iconX, iconY, iconSize, iconSize);

			if (tier.label && tier.label !== ' ') {
				ctx.fillStyle = textColor;
				ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
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
			// Tier Label Text with dynamic high-contrast color
			ctx.fillStyle = textColor;
			ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
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
			ctx.fillStyle = '#27272a';
			roundRect(ctx, cardX, cardY, cardSize, cardSize, 6);
			ctx.fill();

			if (img) {
				// Draw cropped square image
				ctx.save();
				roundRect(ctx, cardX, cardY, cardSize, cardSize, 6);
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
					cardY + cardSize - 28,
					cardX,
					cardY + cardSize
				);
				grad.addColorStop(0, 'rgba(0,0,0,0)');
				grad.addColorStop(1, 'rgba(0,0,0,0.88)');
				ctx.fillStyle = grad;
				ctx.fillRect(cardX, cardY + cardSize - 28, cardSize, 28);

				ctx.restore();
			}

			// Card Name text at bottom
			ctx.fillStyle = '#ffffff';
			ctx.font = '600 10px system-ui, -apple-system, sans-serif';
			ctx.fillText(item.name || '', cardX + 5, cardY + cardSize - 6, cardSize - 10);

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
	ctx.fillStyle = '#71717a';
	ctx.font = '500 11px system-ui, -apple-system, sans-serif';
	ctx.textAlign = 'right';
	ctx.fillText(
		'Made with Imagine a Tier List, By Hyvnt',
		boardWidth - padding,
		boardHeight - padding + 8
	);

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
