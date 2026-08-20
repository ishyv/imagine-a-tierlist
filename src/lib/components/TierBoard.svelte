<script>
	import TierRow from './TierRow.svelte';
	import ItemPool from './ItemPool.svelte';
	import ImagePicker from './ImagePicker.svelte';
	import CardZoomModal from './CardZoomModal.svelte';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import GlyphMark from './ambient/GlyphMark.svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { buildSearchQuery } from '#lib/services/imageSearch.js';
	import { Plus } from 'lucide-svelte';

	let changeImageModalOpen = $state(false);
	/** @type {import('#lib/types.js').Item | null} */
	let itemToChangeImage = $state(null);
	let changeImageQuery = $state('');

	/**
	 * @param {import('#lib/types.js').Item} item
	 */
	function handleChangeImage(item) {
		itemToChangeImage = item;
		changeImageQuery = buildSearchQuery(item.name, board.context);
		changeImageModalOpen = true;
	}

	/**
	 * @param {{ name: string; imageUrl: string; sourceUrl?: string }} result
	 */
	function handleImageSelected(result) {
		if (itemToChangeImage) {
			board.updateItem(itemToChangeImage.id, {
				imageUrl: result.imageUrl,
				sourceUrl: result.sourceUrl
			});
		}
		itemToChangeImage = null;
		changeImageModalOpen = false;
	}

	function handleClosePicker() {
		itemToChangeImage = null;
		changeImageModalOpen = false;
	}
</script>

<div class="relative mx-auto w-full max-w-6xl space-y-10">
	<!-- Tier Rows Container -->
	<div
		class="shadow-veil relative border border-line bg-bg-surface {themeStore.current === 'classic'
			? 'overflow-hidden rounded-xl border-zinc-800 bg-zinc-900 shadow-2xl'
			: ''}"
	>
		{#if themeStore.current === 'hyv'}
			<!-- Structural Ornaments -->
			<CornerBrackets size={18} color="var(--line-strong)" />

			<!-- Cartographic Marks -->
			<div class="pointer-events-none absolute -top-3 -right-3 z-10 hidden sm:block">
				<GlyphMark variant="reticle" size={20} color="var(--accent)" />
			</div>
			<div class="pointer-events-none absolute -bottom-3 -left-3 z-10 hidden sm:block">
				<GlyphMark variant="coord" size={20} color="var(--line-cyan)" />
			</div>
		{/if}

		{#if board.tiers.length === 0}
			<div
				class="p-16 text-center {themeStore.current === 'hyv'
					? 'font-mono'
					: 'font-sans text-zinc-300'}"
			>
				<p
					class="text-xs text-muted-strong {themeStore.current === 'hyv'
						? 'tracking-meta uppercase'
						: 'font-semibold'}"
				>
					{themeStore.current === 'hyv' ? '// MATRIX_UNINITIALIZED' : 'No Tiers Created'}
				</p>
				<p class="mt-2 text-sm text-text-soft">
					{themeStore.current === 'hyv'
						? 'No classification tiers initialized on board.'
						: 'Add a tier row to start organizing your cards.'}
				</p>
				<button
					type="button"
					class="mt-5 inline-flex cursor-pointer items-center gap-1.5 border px-4 py-2 text-xs font-medium transition-colors {themeStore.current ===
					'hyv'
						? 'border-accent bg-accent/15 text-accent hover:bg-accent/25 hover:text-accent-strong'
						: 'rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500'}"
					onclick={() => board.addTier('S', themeStore.current === 'hyv' ? '#FFD000' : '#ef4444')}
				>
					<Plus size={13} />
					<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
						{themeStore.current === 'hyv' ? 'INITIALIZE FIRST TIER' : 'Add First Tier'}
					</span>
				</button>
			</div>
		{:else}
			{#each board.tiers as tier, index (tier.id)}
				<TierRow
					{tier}
					index={index + 1}
					isFirst={index === 0}
					isLast={index === board.tiers.length - 1}
					onchangeimage={handleChangeImage}
				/>
			{/each}
		{/if}
	</div>

	<!-- Unranked Pool -->
	<ItemPool onchangeimage={handleChangeImage} />
</div>

<!-- Change Image Picker Modal -->
<ImagePicker
	open={changeImageModalOpen}
	initialQuery={changeImageQuery}
	itemName={itemToChangeImage?.name || ''}
	mode="change"
	onselect={handleImageSelected}
	onclose={handleClosePicker}
/>

<!-- Global Card Zoom / Inspection Modal -->
<CardZoomModal onchangeimage={handleChangeImage} />
