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
	/* svelte-ignore state_referenced_locally */
	let imageUrl = $state(tier.imageUrl || '');

	const BADGE_PRESETS = [
		{
			name: 'Challenger',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/challenger.png'
		},
		{
			name: 'Grandmaster',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/grandmaster.png'
		},
		{
			name: 'Master',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/master.png'
		},
		{
			name: 'Diamond',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/diamond.png'
		},
		{
			name: 'Platinum',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/platinum.png'
		},
		{
			name: 'Gold',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/gold.png'
		},
		{
			name: 'Silver',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/silver.png'
		},
		{
			name: 'Bronze',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/bronze.png'
		},
		{
			name: 'Iron',
			url: 'https://raw.githubusercontent.com/MingCut/lol-rank-icons/main/src/assets/iron.png'
		}
	];

	function handleSave() {
		board.updateTier(tier.id, {
			label: label.trim() || tier.label,
			color,
			imageUrl: imageUrl.trim() || undefined
		});
		onclose();
	}

	function handleMoveUp() {
		board.moveTierUp(tier.id);
		onclose();
	}

	function handleMoveDown() {
		board.moveTierDown(tier.id);
		onclose();
	}

	function handleAddAbove() {
		board.addTierAbove(tier.id, 'NEW', '#3b82f6');
		onclose();
	}

	function handleAddBelow() {
		board.addTierBelow(tier.id, 'NEW', '#3b82f6');
		onclose();
	}

	function handleClearCards() {
		board.clearTier(tier.id);
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
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
	role="dialog"
	aria-modal="true"
	aria-label="Edit Tier"
>
	<div
		class="animate-in fade-in zoom-in-95 relative w-full max-w-sm overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100 shadow-2xl duration-150"
	>
		<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
			<h3 class="text-base font-semibold text-zinc-100">Edit Tier</h3>
			<button
				type="button"
				class="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={onclose}
				aria-label="Close"
			>
				<X size={18} />
			</button>
		</div>

		<div class="mt-4 space-y-4">
			<!-- Tier Label -->
			<div>
				<label for="tier-label-input" class="mb-1.5 block text-xs font-medium text-zinc-400"
					>Tier Label</label
				>
				<input
					id="tier-label-input"
					type="text"
					bind:value={label}
					maxlength="15"
					class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					placeholder="e.g. S, A, God Tier"
				/>
			</div>

			<!-- Color Selection -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-400">Color</span>
					<div class="flex items-center gap-1.5">
						<input
							type="color"
							bind:value={color}
							class="h-5 w-5 cursor-pointer rounded border-0 bg-transparent"
							title="Custom color"
						/>
						<span class="font-mono text-[11px] text-zinc-500">{color}</span>
					</div>
				</div>

				<div class="grid grid-cols-6 gap-2">
					{#each TIER_COLOR_PALETTE as paletteColor (paletteColor)}
						<button
							type="button"
							class="relative flex h-7 cursor-pointer items-center justify-center rounded-md border transition-transform hover:scale-105 {color.toLowerCase() ===
							paletteColor.toLowerCase()
								? 'border-white ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
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

			<!-- Tier Image / Badge Icon -->
			<div class="space-y-2 border-t border-zinc-800 pt-3">
				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-zinc-400">Badge Icon / Image (Optional)</span>
					{#if imageUrl}
						<button
							type="button"
							class="cursor-pointer text-[11px] text-red-400 hover:underline"
							onclick={() => (imageUrl = '')}
						>
							Remove Image
						</button>
					{/if}
				</div>

				<input
					type="url"
					bind:value={imageUrl}
					placeholder="Paste custom badge image URL..."
					class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-hidden"
				/>

				<!-- Preset Badges -->
				<div>
					<span class="text-[10px] tracking-wider text-zinc-500 uppercase">Competitive Ranks</span>
					<div class="mt-1 flex flex-wrap gap-1.5">
						{#each BADGE_PRESETS as preset (preset.name)}
							<button
								type="button"
								class="group flex cursor-pointer items-center gap-1 rounded-md border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[10px] text-zinc-300 transition-colors hover:border-blue-500/50 hover:bg-blue-950/20 {imageUrl ===
								preset.url
									? 'border-blue-500 bg-blue-500/10 text-blue-300'
									: ''}"
								onclick={() => {
									imageUrl = preset.url;
									label = preset.name;
								}}
								title={preset.name}
							>
								<img
									src={preset.url}
									alt=""
									referrerpolicy="no-referrer"
									class="h-4 w-4 object-contain"
								/>
								<span>{preset.name}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Tier Actions -->
			<div class="space-y-1.5 border-t border-zinc-800 pt-2">
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						disabled={isFirst}
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-40"
						onclick={handleMoveUp}
					>
						<ArrowUp size={13} />
						<span>Move Up</span>
					</button>
					<button
						type="button"
						disabled={isLast}
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:pointer-events-none disabled:opacity-40"
						onclick={handleMoveDown}
					>
						<ArrowDown size={13} />
						<span>Move Down</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						onclick={handleAddAbove}
					>
						<Plus size={13} />
						<span>Add Above</span>
					</button>
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						onclick={handleAddBelow}
					>
						<Plus size={13} />
						<span>Add Below</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-2 pt-1">
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						onclick={handleClearCards}
						title="Return all items in this tier to Unranked"
					>
						<Eraser size={13} />
						<span>Clear Row</span>
					</button>
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
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
				class="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-200"
				onclick={onclose}
			>
				Cancel
			</button>
			<button
				type="button"
				class="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
				onclick={handleSave}
			>
				Save Changes
			</button>
		</div>
	</div>
</div>
