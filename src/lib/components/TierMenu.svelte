<script>
	import { ArrowUp, ArrowDown, Plus, Trash2, Eraser, Check } from 'lucide-svelte';
	import {
		board,
		CLASSIC_COLOR_PALETTE,
		HYV_COLOR_PALETTE,
		getTierColor
	} from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

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
	let color = $state(getTierColor(tier, themeStore.current));
	/* svelte-ignore state_referenced_locally */
	let imageUrl = $state(tier.imageUrl || '');

	const activePalette = $derived(
		themeStore.current === 'hyv' ? HYV_COLOR_PALETTE : CLASSIC_COLOR_PALETTE
	);

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
		board.addTierAbove(tier.id, 'NEW', themeStore.current === 'hyv' ? '#0070DD' : '#3b82f6');
		onclose();
	}

	function handleAddBelow() {
		board.addTierBelow(tier.id, 'NEW', themeStore.current === 'hyv' ? '#0070DD' : '#3b82f6');
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
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
	role="dialog"
	aria-modal="true"
	aria-label="Edit Tier"
>
	<div
		class="shadow-veil relative w-full max-w-sm border border-line bg-bg-elev p-5 text-text {themeStore.current ===
		'classic'
			? 'overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
			: ''}"
	>
		{#if themeStore.current === 'hyv'}
			<CornerBrackets size={14} />
		{/if}

		<div
			class="flex items-center justify-between border-b border-line pb-3 {themeStore.current ===
			'hyv'
				? 'font-mono'
				: 'font-sans'}"
		>
			<h3
				class="text-xs text-text {themeStore.current === 'hyv'
					? 'tracking-meta uppercase'
					: 'font-bold'}"
			>
				{themeStore.current === 'hyv' ? `CONFIG // TIER_${tier.label}` : `Edit Tier: ${tier.label}`}
			</h3>
			<button
				type="button"
				class="cursor-pointer text-xs text-muted transition-colors hover:text-text"
				onclick={onclose}
				aria-label="Close"
			>
				&times;
			</button>
		</div>

		<div
			class="mt-4 space-y-4 text-xs {themeStore.current === 'classic' ? 'font-sans' : 'font-mono'}"
		>
			<!-- Tier Label -->
			<div>
				<label
					for="tier-label-input"
					class="mb-1.5 block text-[11px] text-muted-strong {themeStore.current === 'hyv'
						? 'tracking-meta uppercase'
						: 'font-medium'}"
				>
					Tier Label
				</label>
				<input
					id="tier-label-input"
					type="text"
					bind:value={label}
					maxlength="15"
					class="w-full border border-line bg-bg px-3 py-1.5 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
					'classic'
						? 'rounded-lg border-zinc-700 bg-zinc-950'
						: ''}"
					placeholder="e.g. S, A, God Tier"
				/>
			</div>

			<!-- Color Selection -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<span
						class="text-[11px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Tier Color
					</span>
					<div class="flex items-center gap-1.5">
						<input
							type="color"
							bind:value={color}
							class="h-4 w-4 cursor-pointer border-0 bg-transparent"
							title="Custom color"
						/>
						<span class="text-[10px] text-muted">{color}</span>
					</div>
				</div>

				<div class="grid grid-cols-5 gap-1.5">
					{#each activePalette as paletteColor (paletteColor)}
						<button
							type="button"
							class="relative flex h-6 cursor-pointer items-center justify-center border transition-all {themeStore.current ===
							'classic'
								? 'rounded-md'
								: ''} {color.toLowerCase() === paletteColor.toLowerCase()
								? 'border-accent ring-1 ring-accent'
								: 'border-transparent hover:border-line-strong'}"
							style="background-color: {paletteColor}"
							onclick={() => (color = paletteColor)}
							aria-label={`Select color ${paletteColor}`}
						>
							{#if color.toLowerCase() === paletteColor.toLowerCase()}
								<Check size={12} class="text-white drop-shadow-xs" />
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Tier Image / Badge Icon -->
			<div class="space-y-2 border-t border-line pt-3">
				<div class="flex items-center justify-between">
					<span
						class="text-[11px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Custom Badge Icon (Optional)
					</span>
					{#if imageUrl}
						<button
							type="button"
							class="cursor-pointer text-[10px] text-status-fail hover:underline"
							onclick={() => (imageUrl = '')}
						>
							remove
						</button>
					{/if}
				</div>

				<input
					type="url"
					bind:value={imageUrl}
					placeholder="Paste badge icon URL..."
					class="w-full border border-line bg-bg px-3 py-1 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
					'classic'
						? 'rounded-lg border-zinc-700 bg-zinc-950'
						: ''}"
				/>

				<!-- Preset Badges -->
				<div>
					<span
						class="text-[9px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Gaming Badge Presets
					</span>
					<div class="mt-1 flex flex-wrap gap-1">
						{#each BADGE_PRESETS as preset (preset.name)}
							<button
								type="button"
								class="flex cursor-pointer items-center gap-1 border px-1.5 py-0.5 text-[9px] text-text-soft transition-colors hover:border-accent {themeStore.current ===
								'classic'
									? 'rounded-md'
									: ''} {imageUrl === preset.url
									? 'border-accent bg-accent/15 text-accent'
									: 'border-line bg-bg'}"
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
									class="h-3 w-3 object-contain"
								/>
								<span>{preset.name}</span>
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Tier Actions -->
			<div class="space-y-1.5 border-t border-line pt-2 text-xs">
				<div class="grid grid-cols-2 gap-1.5">
					<button
						type="button"
						disabled={isFirst}
						class="flex cursor-pointer items-center justify-center gap-1 border border-line bg-bg py-1.5 text-text-soft transition-colors hover:border-line-strong hover:text-text disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
							: ''}"
						onclick={handleMoveUp}
					>
						<ArrowUp size={11} />
						<span>Move Up</span>
					</button>
					<button
						type="button"
						disabled={isLast}
						class="flex cursor-pointer items-center justify-center gap-1 border border-line bg-bg py-1.5 text-text-soft transition-colors hover:border-line-strong hover:text-text disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
							: ''}"
						onclick={handleMoveDown}
					>
						<ArrowDown size={11} />
						<span>Move Down</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-1.5">
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1 border border-line bg-bg py-1.5 text-text-soft transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
							: ''}"
						onclick={handleAddAbove}
					>
						<Plus size={11} />
						<span>Add Above</span>
					</button>
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1 border border-line bg-bg py-1.5 text-text-soft transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
							: ''}"
						onclick={handleAddBelow}
					>
						<Plus size={11} />
						<span>Add Below</span>
					</button>
				</div>

				<div class="grid grid-cols-2 gap-1.5 pt-1">
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1 border border-line bg-bg py-1.5 text-muted transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
							: ''}"
						onclick={handleClearCards}
						title="Return all items in this tier to holding buffer"
					>
						<Eraser size={11} />
						<span>Clear Cards</span>
					</button>
					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1 border border-status-fail/40 bg-bg py-1.5 text-status-fail transition-colors hover:border-status-fail hover:bg-status-fail/10 {themeStore.current ===
						'classic'
							? 'rounded-lg'
							: ''}"
						onclick={handleDelete}
					>
						<Trash2 size={11} />
						<span>Delete Tier</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Footer Buttons -->
		<div
			class="mt-5 flex justify-end gap-2 text-xs {themeStore.current === 'classic'
				? 'font-sans'
				: 'font-mono'}"
		>
			<button
				type="button"
				class="cursor-pointer border border-line bg-bg px-3 py-1 text-muted transition-colors hover:text-text {themeStore.current ===
				'classic'
					? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
					: ''}"
				onclick={onclose}
			>
				Cancel
			</button>
			<button
				type="button"
				class="cursor-pointer border border-accent bg-accent/15 px-3.5 py-1 font-medium text-accent transition-colors hover:bg-accent/25 hover:text-accent-strong {themeStore.current ===
				'classic'
					? 'rounded-lg font-semibold'
					: ''}"
				onclick={handleSave}
			>
				Save Changes
			</button>
		</div>
	</div>
</div>
