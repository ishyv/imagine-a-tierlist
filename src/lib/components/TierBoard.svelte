<script>
	import TierRow from './TierRow.svelte';
	import ItemPool from './ItemPool.svelte';
	import ImagePicker from './ImagePicker.svelte';
	import { board } from '#lib/stores/board.svelte.js';
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

<div class="mx-auto w-full max-w-6xl space-y-6">
	<!-- Tier Rows Container -->
	<div class="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
		{#if board.tiers.length === 0}
			<div class="p-12 text-center text-zinc-500">
				<p class="text-base font-medium text-zinc-300">No tiers on the board</p>
				<p class="mt-1 text-xs text-zinc-500">Add a new tier to start ranking cards.</p>
				<button
					type="button"
					class="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
					onclick={() => board.addTier('S', '#ef4444')}
				>
					<Plus size={14} />
					<span>Add First Tier</span>
				</button>
			</div>
		{:else}
			{#each board.tiers as tier, index (tier.id)}
				<TierRow
					{tier}
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
