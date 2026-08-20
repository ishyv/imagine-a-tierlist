<script>
	import {
		Layers,
		Search,
		Plus,
		Trash2,
		X,
		Check,
		Download,
		Upload,
		Sparkles
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   onclose: () => void;
	 * }}
	 */
	let { open = false, onclose } = $props();

	let searchQuery = $state('');
	let sortBy = $state('recent'); // 'recent' | 'usage' | 'name'
	/** @type {Record<string, boolean>} */
	let addedFeedback = $state({});
	let fileInput = $state(/** @type {HTMLInputElement | null} */ (null));

	const filteredCards = $derived.by(() => {
		let list = [...cardStash.cards];
		const q = searchQuery.toLowerCase().trim();

		if (q) {
			list = list.filter(
				(c) =>
					c.name.toLowerCase().includes(q) || (c.context && c.context.toLowerCase().includes(q))
			);
		}

		if (sortBy === 'recent') {
			list.sort((a, b) => (b.lastUsedAt || b.createdAt) - (a.lastUsedAt || a.createdAt));
		} else if (sortBy === 'usage') {
			list.sort((a, b) => (b.usageCount || 1) - (a.usageCount || 1));
		} else if (sortBy === 'name') {
			list.sort((a, b) => a.name.localeCompare(b.name));
		}

		return list;
	});

	/**
	 * @param {import('#lib/stores/cardStash.svelte.js').StashCard} card
	 */
	function handleAddCard(card) {
		board.addCardFromStash(card);
		addedFeedback[card.id] = true;
		setTimeout(() => {
			delete addedFeedback[card.id];
		}, 1000);
	}

	function handleAddAllFiltered() {
		for (const card of filteredCards) {
			board.addCardFromStash(card);
		}
	}

	function handleExportStash() {
		const json = cardStash.exportJson();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `card-stash-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	/**
	 * @param {Event} e
	 */
	function handleImportFile(e) {
		const target = /** @type {HTMLInputElement} */ (e.target);
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const content = ev.target?.result;
			if (typeof content === 'string') {
				cardStash.importJson(content);
			}
		};
		reader.readAsText(file);
		target.value = '';
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="animate-in fade-in fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs duration-200"
		role="dialog"
		aria-modal="true"
		aria-label="Global Card Stash"
	>
		<!-- Backdrop click -->
		<button
			type="button"
			class="h-full flex-1 cursor-default border-none bg-transparent"
			onclick={onclose}
			aria-label="Close card stash"
		></button>

		<!-- Slide-over Drawer Panel -->
		<div
			class="animate-in slide-in-from-right relative flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl duration-250 sm:max-w-md"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-zinc-800/80 pb-4">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
					>
						<Layers size={18} />
					</div>
					<div>
						<h2 class="text-base font-semibold text-zinc-100">Global Card Stash</h2>
						<p class="text-xs text-zinc-400">
							{cardStash.cards.length} saved {cardStash.cards.length === 1 ? 'card' : 'cards'} across
							all your lists
						</p>
					</div>
				</div>

				<button
					type="button"
					class="cursor-pointer rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
					onclick={onclose}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Search & Filter Controls -->
			<div class="mt-4 space-y-3">
				<div class="relative">
					<Search size={14} class="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search cards in your stash..."
						class="w-full rounded-lg border border-zinc-800 bg-zinc-900/90 py-2 pr-3 pl-9 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
					/>
					{#if searchQuery}
						<button
							type="button"
							class="absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
							onclick={() => (searchQuery = '')}
						>
							<X size={12} />
						</button>
					{/if}
				</div>

				<div class="flex items-center justify-between text-xs">
					<div class="flex items-center gap-1 text-[11px] text-zinc-400">
						<span>Sort:</span>
						<select
							bind:value={sortBy}
							class="cursor-pointer rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 focus:border-purple-500 focus:outline-hidden"
						>
							<option value="recent">Recently Used</option>
							<option value="usage">Most Used</option>
							<option value="name">Alphabetical</option>
						</select>
					</div>

					{#if filteredCards.length > 0}
						<button
							type="button"
							class="cursor-pointer text-[11px] font-medium text-purple-400 transition-colors hover:text-purple-300 hover:underline"
							onclick={handleAddAllFiltered}
						>
							+ Add all ({filteredCards.length}) to board
						</button>
					{/if}
				</div>
			</div>

			<!-- Cards List -->
			<div class="mt-4 flex-1 overflow-y-auto pr-1">
				{#if cardStash.cards.length === 0}
					<div class="flex h-64 flex-col items-center justify-center text-center">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-zinc-500"
						>
							<Sparkles size={20} />
						</div>
						<p class="mt-3 text-sm font-medium text-zinc-300">Your Card Stash is empty</p>
						<p class="mt-1 max-w-xs text-xs text-zinc-500">
							Every card you create via search, direct URL, or AI bulk add will be automatically
							saved here for 1-click re-use!
						</p>
					</div>
				{:else if filteredCards.length === 0}
					<div
						class="flex h-48 flex-col items-center justify-center text-center text-xs text-zinc-500"
					>
						<p>No cards match "{searchQuery}"</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
						{#each filteredCards as card (card.id)}
							<div
								class="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 text-left shadow-xs transition-all hover:border-purple-500/60 hover:ring-1 hover:ring-purple-500/40"
							>
								<!-- Thumbnail -->
								<img
									src={card.thumbnailUrl || card.imageUrl}
									alt={card.name}
									loading="lazy"
									decoding="async"
									referrerpolicy="no-referrer"
									class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
								/>

								<!-- Top Overlay Actions -->
								<div
									class="absolute top-1.5 right-1.5 z-20 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										type="button"
										class="cursor-pointer rounded-full bg-black/70 p-1 text-zinc-400 backdrop-blur-xs transition-colors hover:bg-red-500/80 hover:text-white"
										onclick={() => cardStash.removeCard(card.id)}
										title="Delete card from stash"
										aria-label="Delete card"
									>
										<Trash2 size={11} />
									</button>
								</div>

								<!-- Bottom Action Banner -->
								<div
									class="relative z-10 w-full bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2"
								>
									<p class="truncate text-[11px] font-medium text-white/95 drop-shadow-sm">
										{card.name}
									</p>
									{#if card.context}
										<p class="truncate text-[9px] text-zinc-400">{card.context}</p>
									{/if}

									<button
										type="button"
										class="mt-1.5 flex w-full cursor-pointer items-center justify-center gap-1 rounded-md py-1 text-[10px] font-medium transition-all {addedFeedback[
											card.id
										]
											? 'bg-emerald-500 text-white'
											: 'bg-purple-600 text-white hover:bg-purple-500'}"
										onclick={() => handleAddCard(card)}
									>
										{#if addedFeedback[card.id]}
											<Check size={10} />
											<span>Added!</span>
										{:else}
											<Plus size={10} />
											<span>Add to Board</span>
										{/if}
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer Backup Controls -->
			<div
				class="mt-4 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-500"
			>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="flex cursor-pointer items-center gap-1 text-zinc-400 hover:text-zinc-200"
						onclick={handleExportStash}
						title="Export stash JSON backup"
					>
						<Download size={12} />
						<span>Export</span>
					</button>

					<button
						type="button"
						class="flex cursor-pointer items-center gap-1 text-zinc-400 hover:text-zinc-200"
						onclick={() => fileInput?.click()}
						title="Import stash JSON backup"
					>
						<Upload size={12} />
						<span>Import</span>
					</button>
					<input
						type="file"
						accept=".json"
						bind:this={fileInput}
						class="hidden"
						onchange={handleImportFile}
					/>
				</div>

				{#if cardStash.cards.length > 0}
					<button
						type="button"
						class="cursor-pointer text-zinc-500 hover:text-red-400"
						onclick={() => {
							if (confirm('Are you sure you want to clear your entire Card Stash?')) {
								cardStash.clearStash();
							}
						}}
					>
						Clear Stash
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
