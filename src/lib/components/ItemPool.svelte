<script>
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { Trash2 } from 'lucide-svelte';
	import TierCard from './TierCard.svelte';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import GlyphMark from './ambient/GlyphMark.svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';

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
		if (
			confirm('Clear all cards from holding buffer? Ranked matrix cards will remain untouched.')
		) {
			board.items = board.items.filter((i) => i.tierId !== null);
			board.persist();
		}
	}
</script>

<div
	class="shadow-card relative border border-line bg-bg-surface {themeStore.current === 'classic'
		? 'overflow-hidden rounded-xl border-zinc-800 bg-zinc-900 shadow-xl'
		: ''}"
>
	{#if themeStore.current === 'hyv'}
		<CornerBrackets size={14} color="var(--line-strong)" />

		<div class="pointer-events-none absolute -top-2.5 right-6 z-10 hidden sm:block">
			<GlyphMark variant="plus" size={14} color="var(--line)" />
		</div>
	{/if}

	<!-- Header -->
	<div
		class="flex items-center justify-between border-b border-line bg-bg-elev px-4 py-2.5 {themeStore.current ===
		'hyv'
			? 'font-mono text-xs'
			: 'font-sans text-xs'}"
	>
		<div class="flex items-center gap-2">
			<span
				class={themeStore.current === 'hyv'
					? 'tracking-meta text-accent uppercase'
					: 'font-semibold text-zinc-300'}
			>
				{themeStore.current === 'hyv' ? '02 // HOLDING_BUFFER' : 'Unranked Pool'}
			</span>
			<span
				class="py-0.2 border border-line px-1.5 text-[10px] {themeStore.current === 'hyv'
					? 'bg-bg text-text-soft'
					: 'rounded-full bg-zinc-800 font-semibold text-zinc-400'}"
			>
				{themeStore.current === 'hyv'
					? unrankedItems.length.toString().padStart(2, '0')
					: unrankedItems.length}
			</span>
		</div>
		<div class="flex items-center gap-4">
			{#if unrankedItems.length > 0}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-1 text-[11px] transition-colors {themeStore.current ===
					'hyv'
						? 'text-muted hover:text-status-fail'
						: 'text-zinc-400 hover:text-red-400'}"
					onclick={handleClearUnranked}
					title="Remove all unranked cards"
				>
					<Trash2 size={11} />
					<span class={themeStore.current === 'hyv' ? 'lowercase' : ''}>
						{themeStore.current === 'hyv' ? 'clear buffer' : 'Clear Unranked'}
					</span>
				</button>
			{/if}
			<p
				class="hidden text-[11px] text-muted-strong sm:block {themeStore.current === 'hyv'
					? 'lowercase'
					: ''}"
			>
				{themeStore.current === 'hyv'
					? 'drag entities into tier matrix above'
					: 'Drag cards into tiers above'}
			</p>
		</div>
	</div>

	<!-- Droppable Zone -->
	<div
		class="flex min-h-36 flex-wrap content-start items-center gap-3 p-4 transition-colors sm:min-h-40 {themeStore.current ===
		'hyv'
			? 'bg-bg-cradle/70'
			: 'bg-zinc-950/40'}"
		use:dndzone={{
			items: unrankedItems,
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
		{#if unrankedItems.length === 0}
			<div
				class="pointer-events-none flex w-full flex-col items-center justify-center py-10 text-center select-none {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<p
					class="text-xs text-muted-strong {themeStore.current === 'hyv'
						? 'tracking-meta uppercase'
						: 'font-semibold'}"
				>
					{themeStore.current === 'hyv' ? '// BUFFER_EMPTY' : 'No Unranked Cards'}
				</p>
				<p class="mt-1 text-xs text-muted">
					{themeStore.current === 'hyv'
						? 'query entities above or unassign ranked cards to holding zone'
						: 'Search items above to add cards to the pool, or drag cards here to unrank them.'}
				</p>
			</div>
		{/if}

		{#each unrankedItems as item (item.id)}
			<div animate:flip={{ duration: 180 }}>
				<TierCard {item} {onchangeimage} />
			</div>
		{/each}
	</div>
</div>
