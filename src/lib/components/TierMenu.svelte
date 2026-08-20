<script>
	import { ArrowUp, ArrowDown, Plus, Trash2, Eraser, X, Check } from 'lucide-svelte';
	import { board, TIER_COLOR_PALETTE } from '#lib/stores/board.svelte.js';

	/**
	 * @type {{
	 *   tier: import('#lib/types.js').Tier;
	 *   isFirst: boolean;
	 *   isLast: boolean;
	 *   onclose: () => void;
	 * }}
	 */
	let { tier, isFirst, isLast, onclose } = $props();

	/* svelte-ignore state_referenced_locally */
	let label = $state(tier.label);
	/* svelte-ignore state_referenced_locally */
	let color = $state(tier.color);

	function handleSave() {
		board.updateTier(tier.id, {
			label: label.trim() || tier.label,
			color
		});
		onclose();
	}

	function handleMoveUp() {
		board.moveTier(tier.id, 'up');
		onclose();
	}

	function handleMoveDown() {
		board.moveTier(tier.id, 'down');
		onclose();
	}

	function handleAddAbove() {
		const currentIndex = board.tiers.findIndex((/** @type {import('#lib/types.js').Tier} */ t) => t.id === tier.id);
		const prevTierId = currentIndex > 0 ? board.tiers[currentIndex - 1].id : null;
		board.addTier('NEW', '#3b82f6', prevTierId);
		onclose();
	}

	function handleAddBelow() {
		board.addTier('NEW', '#3b82f6', tier.id);
		onclose();
	}

	function handleClearCards() {
		board.clearTierCards(tier.id);
		onclose();
	}

	function handleDelete() {
		board.deleteTier(tier.id);
		onclose();
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape') onclose();
		if (e.key === 'Enter') handleSave();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
	role="dialog"
	aria-modal="true"
>
	<div
		class="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden p-5 text-zinc-100 animate-in fade-in zoom-in-95 duration-150"
	>
		<div class="flex items-center justify-between pb-3 border-b border-zinc-800">
			<h3 class="text-base font-semibold text-zinc-100">Edit Tier</h3>
			<button
				type="button"
				class="text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
				onclick={onclose}
				aria-label="Close"
			>
				<X size={18} />
			</button>
		</div>

		<div class="mt-4 space-y-4">
			<!-- Tier Label -->
			<div>
				<label for="tier-label-input" class="block text-xs font-medium text-zinc-400 mb-1.5">Tier Label</label>
				<input
					id="tier-label-input"
					type="text"
					bind:value={label}
					maxlength="15"
					class="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
					placeholder="e.g. S, A, God Tier"
				/>
			</div>

			<!-- Color Selection -->
			<div>
				<div class="flex items-center justify-between mb-1.5">
					<span class="text-xs font-medium text-zinc-400">Color</span>
					<div class="flex items-center gap-1.5">
						<input
							type="color"
							bind:value={color}
							class="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
							title="Custom color"
						/>
						<span class="text-[11px] font-mono text-zinc-500">{color}</span>
					</div>
				</div>

				<div class="grid grid-cols-6 gap-2">
					{#each TIER_COLOR_PALETTE as paletteColor (paletteColor)}
						<button
							type="button"
							class="relative h-7 rounded-md transition-transform hover:scale-105 cursor-pointer flex items-center justify-center border {color.toLowerCase() ===
							paletteColor.toLowerCase()
								? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 border-white'
								: 'border-transparent'}"
							style="background-color: {paletteColor}"
							onclick={() => (color = paletteColor)}
							aria-label={`Select color ${paletteColor}`}
						>
							{#if color.toLowerCase() === paletteColor.toLowerCase()}
								<Check size={14} class="text-white drop-shadow-sm" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Tier Actions -->
			<div class="pt-2 border-t border-zinc-800 space-y-1.5">
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						disabled={isFirst}
						class="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleMoveUp}
					>
						<ArrowUp size={13} />
						<span>Move Up</span>
					</button>
					<button
						type="button"
						disabled={isLast}
						class="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleMoveDown}
					>
						<ArrowDown size={13} />
						<span>Move Down</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						class="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleAddAbove}
					>
						<Plus size={13} />
						<span>Add Above</span>
					</button>
					<button
						type="button"
						class="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleAddBelow}
					>
						<Plus size={13} />
						<span>Add Below</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2 pt-1">
					<button
						type="button"
						class="px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleClearCards}
						title="Return all items in this tier to Unranked"
					>
						<Eraser size={13} />
						<span>Clear Row</span>
					</button>
					<button
						type="button"
						class="px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
						onclick={handleDelete}
					>
						<Trash2 size={13} />
						<span>Delete Tier</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Footer Buttons -->
		<div class="mt-6 flex justify-end gap-2">
			<button
				type="button"
				class="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
				onclick={onclose}
			>
				Cancel
			</button>
			<button
				type="button"
				class="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
				onclick={handleSave}
			>
				Save Changes
			</button>
		</div>
	</div>
</div>
