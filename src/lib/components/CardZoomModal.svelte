<script>
	import {
		ChevronLeft,
		ChevronRight,
		Pencil,
		RefreshCw,
		Trash2,
		ExternalLink,
		ImageOff,
		Check,
		Layers
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { getContrastTextColor } from '#lib/services/exportImage.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import GlyphMark from './ambient/GlyphMark.svelte';

	/**
	 * @type {{
	 *   onchangeimage?: (item: import('#lib/types.js').Item) => void;
	 * }}
	 */
	let { onchangeimage } = $props();

	let isRenaming = $state(false);
	let editName = $state('');
	/** @type {HTMLInputElement | null} */
	let renameInput = $state(null);
	let imageError = $state(false);

	const item = $derived(board.zoomedItem);
	const isOpen = $derived(item !== null);

	// Find the current tier object for the zoomed item
	const currentTier = $derived(
		item && item.tierId ? board.tiers.find((t) => t.id === item.tierId) : null
	);

	// Reset rename and error states on item change
	$effect(() => {
		if (item) {
			isRenaming = false;
			editName = item.name;
			imageError = false;
		}
	});

	function handleClose() {
		board.closeZoom();
		isRenaming = false;
	}

	function handlePrev() {
		board.prevZoomedItem();
	}

	function handleNext() {
		board.nextZoomedItem();
	}

	function startRename() {
		if (!item) return;
		editName = item.name;
		isRenaming = true;
		setTimeout(() => {
			renameInput?.focus();
			renameInput?.select();
		}, 30);
	}

	function saveRename() {
		if (!item || !isRenaming) return;
		const trimmed = editName.trim();
		if (trimmed && trimmed !== item.name) {
			board.updateItem(item.id, { name: trimmed });
		}
		isRenaming = false;
	}

	function handleDelete() {
		if (!item) return;
		const itemId = item.id;
		board.closeZoom();
		board.deleteItem(itemId);
	}

	function handleChangeImage() {
		if (!item) return;
		const currentItem = item;
		board.closeZoom();
		onchangeimage?.(currentItem);
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (!isOpen) return;

		if (e.key === 'Escape') {
			handleClose();
		} else if (e.key === 'ArrowLeft' && !isRenaming) {
			e.preventDefault();
			handlePrev();
		} else if (e.key === 'ArrowRight' && !isRenaming) {
			e.preventDefault();
			handleNext();
		}
	}

	const serial = $derived(
		(item?.id || '')
			.replace(/[^a-zA-Z0-9]/g, '')
			.slice(-4)
			.toUpperCase() || '0001'
	);

	// Total cards on the board
	const currentIndex = $derived(item ? board.items.findIndex((i) => i.id === item.id) + 1 : 0);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && item}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
		role="dialog"
		aria-modal="true"
		aria-label="Inspect Entity Card"
	>
		<!-- Backdrop Click -->
		<button
			type="button"
			class="absolute inset-0 h-full w-full cursor-default border-none bg-transparent"
			onclick={handleClose}
			aria-label="Close modal"
		></button>

		<!-- Main Showcase Chassis -->
		<div
			class="shadow-veil relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden border border-line-strong bg-bg-elev text-text lg:flex-row {themeStore.current ===
			'classic'
				? 'rounded-2xl border-zinc-800 bg-zinc-900 shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={20} color="var(--accent)" />

				<!-- Top Specular Bevel Line -->
				<div
					class="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[rgba(255,245,220,0.4)] to-transparent"
				></div>
			{/if}

			<!-- Left / Top: High-Res Visual Showcase Frame -->
			<div
				class="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden border-b border-line bg-bg-cradle p-4 sm:min-h-[380px] lg:border-r lg:border-b-0 lg:p-8"
			>
				<!-- Prev / Next Navigation Floating Arrows -->
				{#if board.items.length > 1}
					<button
						type="button"
						class="absolute top-1/2 left-3 z-30 -translate-y-1/2 cursor-pointer border border-line p-2 backdrop-blur-xs transition-all duration-150 active:scale-95 {themeStore.current ===
						'hyv'
							? 'bg-bg/90 text-muted hover:border-accent hover:text-accent-strong'
							: 'rounded-full border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700'}"
						onclick={handlePrev}
						title="Previous card (Left Arrow)"
						aria-label="Previous card"
					>
						<ChevronLeft size={18} />
					</button>

					<button
						type="button"
						class="absolute top-1/2 right-3 z-30 -translate-y-1/2 cursor-pointer border border-line p-2 backdrop-blur-xs transition-all duration-150 active:scale-95 {themeStore.current ===
						'hyv'
							? 'bg-bg/90 text-muted hover:border-accent hover:text-accent-strong'
							: 'rounded-full border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700'}"
						onclick={handleNext}
						title="Next card (Right Arrow)"
						aria-label="Next card"
					>
						<ChevronRight size={18} />
					</button>
				{/if}

				<!-- Large Image Inset Display -->
				<div
					class="relative flex h-full max-h-[480px] w-full max-w-[480px] items-center justify-center overflow-hidden border border-line bg-bg-surface {themeStore.current ===
					'classic'
						? 'rounded-xl border-zinc-800 bg-zinc-950/80 shadow-lg'
						: ''}"
				>
					{#if imageError || !item.imageUrl}
						<div class="flex flex-col items-center justify-center p-8 text-center text-muted">
							<ImageOff size={48} class="mb-3 text-muted-strong" />
							<p class="font-medium text-text-soft sm:text-lg">{item.name}</p>
							<p class="mt-1 text-xs text-muted-strong">No visual source attached</p>
						</div>
					{:else}
						<img
							src={item.imageUrl}
							alt={item.name}
							class="max-h-[480px] w-full object-contain"
							onerror={() => (imageError = true)}
						/>
					{/if}

					<!-- Deep Vignette Layer in Hyv mode -->
					{#if themeStore.current === 'hyv'}
						<div
							class="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]"
						></div>
					{/if}
				</div>

				<!-- Telemetry Position Counter -->
				{#if board.items.length > 0}
					<div
						class="absolute bottom-3 left-4 text-[10px] text-muted-strong {themeStore.current ===
						'hyv'
							? 'tracking-meta font-mono uppercase'
							: 'font-sans'}"
					>
						CARD {currentIndex} / {board.items.length}
					</div>
				{/if}
			</div>

			<!-- Right / Bottom: Technical Entity Dossier & Controls -->
			<div
				class="flex w-full flex-col justify-between p-6 lg:w-96 {themeStore.current === 'hyv'
					? 'font-mono text-xs'
					: 'font-sans text-sm'}"
			>
				<div>
					<!-- Dossier Header -->
					<div
						class="flex items-center justify-between border-b border-line pb-3 text-[10px] text-muted-strong {themeStore.current ===
						'hyv'
							? 'tracking-meta font-mono uppercase'
							: 'font-semibold'}"
					>
						<div class="flex items-center gap-2 text-accent">
							{#if themeStore.current === 'hyv'}
								<GlyphMark variant="reticle" size={12} color="var(--accent)" />
								<span>ENTITY_DOSSIER // #{serial}</span>
							{:else}
								<span>CARD DETAILS</span>
							{/if}
						</div>
						<button
							type="button"
							class="cursor-pointer text-xs text-muted hover:text-text"
							onclick={handleClose}
							aria-label="Close inspection"
						>
							&times;
						</button>
					</div>

					<!-- Entity Nameplate & Scope -->
					<div class="mt-4 space-y-1">
						{#if !isRenaming}
							<div class="flex items-baseline justify-between gap-2">
								<h2
									class="font-normal tracking-tight text-text sm:text-3xl {themeStore.current ===
									'hyv'
										? 'font-body text-2xl'
										: 'font-sans text-2xl font-bold'}"
								>
									{item.name}
								</h2>
								<button
									type="button"
									class="cursor-pointer text-[10px] text-muted uppercase hover:text-accent"
									onclick={startRename}
									title="Rename card"
								>
									Edit
								</button>
							</div>
						{:else}
							<div class="flex gap-2">
								<input
									bind:this={renameInput}
									bind:value={editName}
									class="flex-1 border border-accent bg-bg px-2.5 py-1 text-text focus:outline-none {themeStore.current ===
									'classic'
										? 'rounded-lg font-sans'
										: 'font-body'}"
									onkeydown={(e) => {
										if (e.key === 'Enter') saveRename();
										if (e.key === 'Escape') isRenaming = false;
									}}
								/>
								<button
									type="button"
									class="cursor-pointer border border-accent bg-accent/20 px-3 py-1 text-xs text-accent uppercase {themeStore.current ===
									'classic'
										? 'rounded-lg'
										: ''}"
									onclick={saveRename}
								>
									Save
								</button>
							</div>
						{/if}

						{#if board.context}
							<p class="text-[11px] text-muted">
								<span class="text-accent/80">Context:</span>
								{board.context}
							</p>
						{/if}
					</div>

					<!-- Current Classification Status -->
					<div class="mt-5 space-y-2 border-t border-line pt-4 text-xs">
						<div class="flex items-center justify-between text-[11px] text-muted-strong">
							<span class={themeStore.current === 'hyv' ? 'tracking-meta uppercase' : ''}>
								Current Status:
							</span>
						</div>

						<div class="flex items-center gap-2">
							{#if currentTier}
								<div
									class="flex items-center gap-2 border px-3 py-1 text-xs font-medium {themeStore.current ===
									'classic'
										? 'rounded-lg font-semibold'
										: ''}"
									style="
										background-color: {currentTier.color};
										color: {getContrastTextColor(currentTier.color)};
										border-color: rgba(255,255,255,0.2);
									"
								>
									<span class="text-sm font-semibold">{currentTier.label}</span>
									<span class="text-[10px] uppercase">TIER</span>
								</div>
							{:else}
								<div
									class="border border-line bg-bg px-3 py-1 text-xs text-text-soft uppercase {themeStore.current ===
									'classic'
										? 'rounded-lg font-medium'
										: ''}"
								>
									Holding Buffer (Unranked)
								</div>
							{/if}
						</div>
					</div>

					<!-- Quick Reassignment Swatch Bar -->
					<div class="mt-5 space-y-2 border-t border-line pt-4 text-xs">
						<span
							class="text-[10px] text-muted-strong {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-medium'}"
						>
							Move to Tier:
						</span>

						<div class="flex flex-wrap gap-1.5 pt-1">
							{#each board.tiers as t (t.id)}
								{@const isSelected = item.tierId === t.id}
								<button
									type="button"
									class="flex h-8 min-w-8 cursor-pointer items-center justify-center border px-2 text-xs font-semibold transition-all duration-150 active:scale-95 {themeStore.current ===
									'classic'
										? 'rounded-lg'
										: ''} {isSelected ? 'ring-2 ring-accent' : 'opacity-85 hover:opacity-100'}"
									style="
										background-color: {t.color};
										color: {getContrastTextColor(t.color)};
										border-color: rgba(255,255,255,0.2);
									"
									onclick={() => board.setZoomedItemTier(t.id)}
									title={`Move to ${t.label} Tier`}
								>
									<span>{t.label}</span>
									{#if isSelected}
										<Check size={10} class="ml-1" />
									{/if}
								</button>
							{/each}

							<!-- Unranked / Holding Buffer Button -->
							<button
								type="button"
								class="flex h-8 cursor-pointer items-center gap-1 border px-2.5 text-[10px] uppercase transition-all duration-150 {themeStore.current ===
								'classic'
									? 'rounded-lg font-medium'
									: ''} {item.tierId === null
									? 'border-accent bg-accent/20 font-semibold text-accent'
									: 'border-line bg-bg text-muted hover:border-line-strong hover:text-text'}"
								onclick={() => board.setZoomedItemTier(null)}
								title="Move to Holding Buffer"
							>
								<Layers size={10} />
								<span>Buffer</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Footer Directive Actions -->
				<div class="mt-6 space-y-2 border-t border-line pt-4 text-xs">
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							class="flex cursor-pointer items-center justify-center gap-1.5 border border-line bg-bg p-2 text-text transition-colors hover:border-accent hover:text-accent-strong {themeStore.current ===
							'classic'
								? 'rounded-lg'
								: ''}"
							onclick={handleChangeImage}
						>
							<RefreshCw size={11} class="text-accent" />
							<span class="text-[11px] {themeStore.current === 'hyv' ? 'uppercase' : ''}">
								Change Image
							</span>
						</button>

						{#if item.sourceUrl}
							<a
								href={item.sourceUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="flex cursor-pointer items-center justify-center gap-1.5 border border-line bg-bg p-2 text-muted transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
								'classic'
									? 'rounded-lg'
									: ''}"
							>
								<ExternalLink size={11} />
								<span class="text-[11px] {themeStore.current === 'hyv' ? 'uppercase' : ''}">
									Source
								</span>
							</a>
						{:else}
							<button
								type="button"
								class="flex cursor-pointer items-center justify-center gap-1.5 border border-line bg-bg p-2 text-muted transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
								'classic'
									? 'rounded-lg'
									: ''}"
								onclick={startRename}
							>
								<Pencil size={11} />
								<span class="text-[11px] {themeStore.current === 'hyv' ? 'uppercase' : ''}">
									Rename
								</span>
							</button>
						{/if}
					</div>

					<button
						type="button"
						class="flex w-full cursor-pointer items-center justify-center gap-1.5 border border-status-fail/40 bg-status-fail/10 p-2 text-[11px] text-status-fail transition-colors hover:border-status-fail hover:bg-status-fail/20 {themeStore.current ===
						'classic'
							? 'rounded-lg font-medium'
							: 'uppercase'}"
						onclick={handleDelete}
					>
						<Trash2 size={11} />
						<span>{themeStore.current === 'hyv' ? 'Purge Entity' : 'Delete Card'}</span>
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
