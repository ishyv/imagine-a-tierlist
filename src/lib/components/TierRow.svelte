<script>
	import { Settings } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import TierCard from './TierCard.svelte';
	import TierMenu from './TierMenu.svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { getContrastTextColor } from '#lib/services/exportImage.js';

	/**
	 * @type {{
	 *   tier: import('#lib/types.js').Tier;
	 *   isFirst: boolean;
	 *   isLast: boolean;
	 *   onchangeimage?: (item: import('#lib/types.js').Item) => void;
	 * }}
	 */
	let { tier, isFirst, isLast, onchangeimage } = $props();

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
	class="group/row flex min-h-24 overflow-hidden border-b border-zinc-800/90 bg-zinc-900/40 first:rounded-t-lg last:rounded-b-lg last:border-b-0 sm:min-h-26 md:min-h-28"
>
	<!-- Left Tier Label / Badge -->
	<div
		class="relative flex w-24 shrink-0 flex-col items-center justify-center p-2 text-center shadow-inner select-none sm:w-28 md:w-32"
		style="background-color: {tier.color}"
	>
		{#if tier.imageUrl}
			<div class="relative flex max-h-16 max-w-full flex-col items-center justify-center">
				<img
					src={tier.imageUrl}
					alt={tier.label}
					referrerpolicy="no-referrer"
					decoding="async"
					class="max-h-12 w-auto max-w-[80px] object-contain drop-shadow-md sm:max-h-14"
				/>
				{#if tier.label && tier.label !== ' ' && tier.label !== tier.imageUrl}
					<span
						class="mt-0.5 line-clamp-1 px-1 text-[10px] leading-tight font-bold tracking-wider uppercase drop-shadow-xs sm:text-xs"
						style="color: {labelTextColor}"
					>
						{tier.label}
					</span>
				{/if}
			</div>
		{:else}
			<span
				class="line-clamp-3 px-1 text-base leading-tight font-bold break-words drop-shadow-xs sm:text-lg md:text-xl"
				style="color: {labelTextColor}"
			>
				{tier.label}
			</span>
		{/if}

		{#if tierItems.length > 0}
			<span
				class="py-0.2 mt-1 rounded-full px-1.5 text-[9px] font-semibold opacity-75 backdrop-blur-xs"
				style="background-color: {labelTextColor === '#ffffff'
					? 'rgba(0,0,0,0.3)'
					: 'rgba(255,255,255,0.4)'}; color: {labelTextColor}"
			>
				{tierItems.length}
			</span>
		{/if}

		<!-- Settings Button -->
		<button
			type="button"
			class="absolute top-1.5 right-1.5 cursor-pointer rounded p-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus:opacity-100"
			style="color: {labelTextColor}; background-color: {labelTextColor === '#ffffff'
				? 'rgba(0,0,0,0.25)'
				: 'rgba(255,255,255,0.3)'}"
			onclick={() => (isMenuOpen = true)}
			aria-label={`Configure tier ${tier.label}`}
		>
			<Settings size={13} />
		</button>
	</div>

	<!-- Right Droppable Zone -->
	<div
		class="flex min-h-[inherit] flex-1 flex-wrap content-start items-center gap-2 overflow-x-auto bg-zinc-900/60 p-2 transition-colors"
		use:dndzone={{
			items: tierItems,
			flipDurationMs: 200,
			dropTargetStyle: {
				outline: '2px dashed rgba(59, 130, 246, 0.6)',
				outlineOffset: '-2px',
				backgroundColor: 'rgba(59, 130, 246, 0.05)'
			}
		}}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#each tierItems as item (item.id)}
			<div animate:flip={{ duration: 200 }}>
				<TierCard {item} {onchangeimage} />
			</div>
		{/each}
	</div>
</div>

{#if isMenuOpen}
	<TierMenu {tier} {isFirst} {isLast} onclose={() => (isMenuOpen = false)} />
{/if}
