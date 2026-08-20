<script>
	import { Settings } from 'lucide-svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import TierCard from './TierCard.svelte';
	import TierMenu from './TierMenu.svelte';
	import { board } from '#lib/stores/board.svelte.js';

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
	<!-- Left Tier Label -->
	<div
		class="relative flex w-24 shrink-0 items-center justify-center p-2 text-center shadow-inner select-none sm:w-28 md:w-32"
		style="background-color: {tier.color}"
	>
		<span
			class="line-clamp-3 px-1 text-base leading-tight font-bold break-words text-zinc-950 drop-shadow-xs sm:text-lg md:text-xl"
		>
			{tier.label}
		</span>

		<!-- Settings Button -->
		<button
			type="button"
			class="absolute top-1.5 right-1.5 cursor-pointer rounded bg-black/20 p-1 text-black/80 opacity-0 transition-colors group-hover/row:opacity-100 hover:bg-black/40 hover:text-black focus:opacity-100"
			onclick={() => (isMenuOpen = true)}
			aria-label={`Configure tier ${tier.label}`}
		>
			<Settings size={14} />
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
