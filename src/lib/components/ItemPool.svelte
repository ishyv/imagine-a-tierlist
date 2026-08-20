<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { Layers, Trash2 } from 'lucide-svelte';
	import TierCard from './TierCard.svelte';
	import { board } from '#lib/stores/board.svelte.js';

	/**
	 * @type {{
	 *   onchangeimage?: (item: import('#lib/types.js').Item) => void;
	 * }}
	 */
	let { onchangeimage } = $props();

	/* eslint-disable svelte/prefer-writable-derived */
	/** @type {import('#lib/types.js').Item[]} */
	let unrankedItems = $state([]);

	$effect(() => {
		unrankedItems = board.getItemsForTier(null);
	});
	/* eslint-enable svelte/prefer-writable-derived */

	/**
	 * @param {CustomEvent<{ items: import('#lib/types.js').Item[] }>} e
	 */
	function handleConsider(e) {
		unrankedItems = e.detail.items;
	}

	/**
	 * @param {CustomEvent<{ items: import('#lib/types.js').Item[] }>} e
	 */
	function handleFinalize(e) {
		unrankedItems = e.detail.items;
		board.updateTierItems(null, unrankedItems);
	}

	function handleClearUnranked() {
		if (confirm('Clear all unranked cards? Ranked cards will remain untouched on the board.')) {
			board.items = board.items.filter((i) => i.tierId !== null);
			board.persist();
		}
	}
</script>

<div class="mt-8 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-lg">
	<!-- Header -->
	<div class="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900 px-4 py-3">
		<div class="flex items-center gap-2">
			<Layers size={16} class="text-zinc-400" />
			<h3 class="text-sm font-semibold text-zinc-200">Unranked Items</h3>
			<span
				class="rounded-full border border-zinc-700/50 bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400"
			>
				{unrankedItems.length}
			</span>
		</div>
		<div class="flex items-center gap-3">
			{#if unrankedItems.length > 0}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-red-400"
					onclick={handleClearUnranked}
					title="Remove all unranked cards"
				>
					<Trash2 size={12} />
					<span>Clear Unranked</span>
				</button>
			{/if}
			<p class="hidden text-xs text-zinc-500 sm:block">Drag items into tiers above</p>
		</div>
	</div>

	<!-- Droppable Zone -->
	<div
		class="flex min-h-32 flex-wrap content-start items-center gap-2.5 bg-zinc-950/40 p-4 transition-colors sm:min-h-36"
		use:dndzone={{
			items: unrankedItems,
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
		{#if unrankedItems.length === 0}
			<div
				class="pointer-events-none flex w-full flex-col items-center justify-center py-8 text-center text-zinc-500 select-none"
			>
				<p class="text-sm">No unranked items.</p>
				<p class="mt-1 text-xs text-zinc-600">
					Search and add something above or drag ranked cards here.
				</p>
			</div>
		{/if}

		{#each unrankedItems as item (item.id)}
			<div animate:flip={{ duration: 200 }}>
				<TierCard {item} {onchangeimage} />
			</div>
		{/each}
	</div>
</div>
