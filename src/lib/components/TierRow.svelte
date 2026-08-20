<script>
	import { Settings } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import TierCard from './TierCard.svelte';
	import TierMenu from './TierMenu.svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { getContrastTextColor } from '#lib/services/exportImage.js';

	/**
	 * @type {{
	 *   tier: import('#lib/types.js').Tier;
	 *   index?: number;
	 *   isFirst: boolean;
	 *   isLast: boolean;
	 *   onchangeimage?: (item: import('#lib/types.js').Item) => void;
	 * }}
	 */
	let { tier, index = 1, isFirst, isLast, onchangeimage } = $props();

	let isMenuOpen = $state(false);

	/* eslint-disable svelte/prefer-writable-derived */
	/** @type {import('#lib/types.js').Item[]} */
	let tierItems = $state([]);

	// Keep tierItems synchronized with the store when not dragging
	$effect(() => {
		tierItems = board.getItemsForTier(tier.id);
	});
	/* eslint-enable svelte/prefer-writable-derived */

	const labelTextColor = $derived(getContrastTextColor(tier.color));
	const formattedIndex = $derived(index.toString().padStart(2, '0'));

	/**
	 * @param {CustomEvent<{ items: import('#lib/types.js').Item[] }>} e
	 */
	function handleConsider(e) {
		tierItems = e.detail.items;
	}

	/**
	 * @param {CustomEvent<{ items: import('#lib/types.js').Item[] }>} e
	 */
	function handleFinalize(e) {
		tierItems = e.detail.items;
		board.updateTierItems(tier.id, tierItems);
	}
</script>

<div
	class="group/row relative flex min-h-28 border-b border-line last:border-b-0 sm:min-h-30 md:min-h-32"
>
	<!-- Left Tier Classification Badge Block -->
	<div
		class="relative flex w-24 shrink-0 flex-col items-center justify-between border-r border-line/80 p-2.5 text-center select-none sm:w-28 md:w-32 {themeStore.current ===
			'classic' && isFirst
			? 'rounded-tl-xl'
			: ''} {themeStore.current === 'classic' && isLast ? 'rounded-bl-xl' : ''}"
		style="
			background:
				linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, transparent 8%),
				linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0%, transparent 12%),
				{tier.color};
		"
	>
		<!-- Top Inset Highlight & Index in Hyv mode -->
		{#if themeStore.current === 'hyv'}
			<div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25"></div>

			<div
				class="tracking-meta w-full text-left font-mono text-[9px] uppercase"
				style="color: {labelTextColor}; opacity: 0.65;"
			>
				{formattedIndex} //
			</div>
		{:else}
			<div></div>
		{/if}

		<!-- Main Label / Badge -->
		{#if tier.imageUrl}
			<div class="relative my-auto flex max-h-16 max-w-full flex-col items-center justify-center">
				<img
					src={tier.imageUrl}
					alt={tier.label}
					referrerpolicy="no-referrer"
					decoding="async"
					class="max-h-12 w-auto max-w-[76px] object-contain drop-shadow-md sm:max-h-14"
				/>
				{#if tier.label && tier.label !== ' ' && tier.label !== tier.imageUrl}
					<span
						class="mt-0.5 line-clamp-1 px-1 text-[10px] tracking-wider uppercase drop-shadow-xs sm:text-xs {themeStore.current ===
						'hyv'
							? 'font-mono'
							: 'font-sans font-bold'}"
						style="color: {labelTextColor}"
					>
						{tier.label}
					</span>
				{/if}
			</div>
		{:else}
			<span
				class="my-auto line-clamp-3 px-1 text-2xl break-words drop-shadow-xs sm:text-3xl {themeStore.current ===
				'hyv'
					? 'font-body font-normal tracking-tight'
					: 'font-sans font-bold tracking-normal'}"
				style="color: {labelTextColor}; line-height: 0.95;"
			>
				{tier.label}
			</span>
		{/if}

		<!-- Bottom Item Counter -->
		<div
			class="w-full text-right text-[9px] {themeStore.current === 'hyv'
				? 'tracking-meta font-mono'
				: 'font-sans'}"
			style="color: {labelTextColor}; opacity: 0.8;"
		>
			{#if themeStore.current === 'hyv'}
				[ {tierItems.length.toString().padStart(2, '0')} ]
			{:else}
				{tierItems.length}
			{/if}
		</div>

		<!-- Settings Button -->
		<button
			type="button"
			class="absolute top-1.5 right-1.5 cursor-pointer border p-1 opacity-0 transition-all duration-150 group-hover/row:opacity-100 focus:opacity-100 {themeStore.current ===
			'classic'
				? 'rounded-md'
				: ''}"
			style="
				color: {labelTextColor};
				border-color: {labelTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
				background-color: {labelTextColor === '#ffffff' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)'};
			"
			onclick={() => (isMenuOpen = true)}
			aria-label={`Configure tier ${tier.label}`}
		>
			<Settings size={11} />
		</button>
	</div>

	<!-- Right Droppable Zone -->
	<div
		class="relative flex min-h-[inherit] flex-1 flex-wrap content-start items-center gap-3 overflow-x-auto bg-bg-surface/90 p-3 transition-colors {themeStore.current ===
			'classic' && isFirst
			? 'rounded-tr-xl'
			: ''} {themeStore.current === 'classic' && isLast ? 'rounded-br-xl' : ''}"
		use:dndzone={{
			items: tierItems,
			flipDurationMs: 180,
			dropTargetStyle: {
				outline: '1px dashed var(--accent)',
				outlineOffset: '-2px',
				backgroundColor:
					themeStore.current === 'hyv' ? 'rgba(199, 156, 87, 0.08)' : 'rgba(59, 130, 246, 0.08)'
			}
		}}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#each tierItems as item (item.id)}
			<div animate:flip={{ duration: 180 }}>
				<TierCard {item} {onchangeimage} />
			</div>
		{/each}
	</div>
</div>

{#if isMenuOpen}
	<TierMenu {tier} {isFirst} {isLast} onclose={() => (isMenuOpen = false)} />
{/if}
