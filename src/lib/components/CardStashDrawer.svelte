<script>
	import { Layers, Search, Plus, Trash2, Check, Download, Upload, Maximize2 } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

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
		class="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-xs"
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
			class="shadow-veil relative flex h-full w-full max-w-lg flex-col border-l border-line bg-bg-elev p-6 text-text sm:max-w-md {themeStore.current ===
			'classic'
				? 'border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
			{/if}

			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-line pb-4 {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<div class="flex items-center gap-2">
					<Layers
						size={15}
						class={themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'}
					/>
					<div>
						<h2
							class="text-xs text-text {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-bold'}"
						>
							{themeStore.current === 'hyv' ? 'ASSET_ARCHIVE // GLOBAL_STASH' : 'Global Card Stash'}
						</h2>
						<p class="text-[10px] text-muted">
							{cardStash.cards.length} indexed {cardStash.cards.length === 1 ? 'card' : 'cards'}
						</p>
					</div>
				</div>

				<button
					type="button"
					class="cursor-pointer text-xs text-muted hover:text-text"
					onclick={onclose}
					aria-label="Close"
				>
					&times;
				</button>
			</div>

			<!-- Search & Filter Controls -->
			<div
				class="mt-4 space-y-3 text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				<div class="relative">
					<Search size={12} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Filter archived cards..."
						class="w-full border border-line bg-bg py-1.5 pr-3 pl-8 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-950'
							: ''}"
					/>
					{#if searchQuery}
						<button
							type="button"
							class="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-text"
							onclick={() => (searchQuery = '')}
						>
							&times;
						</button>
					{/if}
				</div>

				<div class="flex items-center justify-between text-[11px]">
					<div class="flex items-center gap-1 text-muted">
						<span class={themeStore.current === 'hyv' ? 'tracking-meta uppercase' : 'font-medium'}>
							Sort:
						</span>
						<select
							bind:value={sortBy}
							class="cursor-pointer border border-line bg-bg px-2 py-0.5 text-[11px] text-text-soft focus:border-accent focus:outline-none {themeStore.current ===
							'classic'
								? 'rounded-md border-zinc-700 bg-zinc-800'
								: ''}"
						>
							<option value="recent">Recently Indexed</option>
							<option value="usage">Most Deployed</option>
							<option value="name">Alphabetical</option>
						</select>
					</div>

					{#if filteredCards.length > 0}
						<button
							type="button"
							class="cursor-pointer text-accent hover:text-accent-strong hover:underline"
							onclick={handleAddAllFiltered}
						>
							+ add all ({filteredCards.length})
						</button>
					{/if}
				</div>
			</div>

			<!-- Cards List -->
			<div class="mt-4 flex-1 overflow-y-auto pr-1">
				{#if cardStash.cards.length === 0}
					<div
						class="flex h-64 flex-col items-center justify-center text-center {themeStore.current ===
						'hyv'
							? 'font-mono'
							: 'font-sans'}"
					>
						<p
							class="text-xs text-muted-strong {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-semibold'}"
						>
							{themeStore.current === 'hyv' ? '// ARCHIVE_EMPTY' : 'No Cards Stashed'}
						</p>
						<p class="mt-2 max-w-xs text-xs text-muted">
							All cards generated via search, direct URL, or AI bulk add persist here automatically
							for instant deployment across boards.
						</p>
					</div>
				{:else if filteredCards.length === 0}
					<div
						class="flex h-48 flex-col items-center justify-center text-center text-xs text-muted {themeStore.current ===
						'hyv'
							? 'font-mono'
							: 'font-sans'}"
					>
						<p>No cards match "{searchQuery}"</p>
					</div>
				{:else}
					<div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
						{#each filteredCards as card (card.id)}
							<div
								class="group relative flex aspect-square flex-col justify-end border border-line bg-bg transition-all hover:border-accent {themeStore.current ===
								'classic'
									? 'overflow-hidden rounded-xl border-zinc-800 bg-zinc-950'
									: ''}"
							>
								<!-- Thumbnail -->
								<img
									src={card.thumbnailUrl || card.imageUrl}
									alt={card.name}
									loading="lazy"
									decoding="async"
									referrerpolicy="no-referrer"
									class="pointer-events-none absolute inset-0 h-full w-full object-cover"
								/>

								<!-- Top action overlay buttons -->
								<div
									class="absolute top-1 right-1 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
								>
									<button
										type="button"
										class="cursor-pointer border border-line bg-bg/90 p-1 text-muted hover:border-accent hover:text-accent-strong {themeStore.current ===
										'classic'
											? 'rounded-md'
											: ''}"
										onclick={() => {
											const existing = board.items.find(
												(i) => i.name.toLowerCase() === card.name.toLowerCase()
											);
											if (existing) {
												board.openZoom(existing);
											} else {
												const tempItem = {
													id: card.id,
													name: card.name,
													imageUrl: card.imageUrl,
													sourceUrl: card.sourceUrl,
													tierId: null,
													order: 0
												};
												board.openZoom(tempItem);
											}
										}}
										title="Inspect / Zoom card"
										aria-label="Inspect card"
									>
										<Maximize2 size={10} />
									</button>
									<button
										type="button"
										class="cursor-pointer border border-line bg-bg/90 p-1 text-muted hover:border-status-fail hover:text-status-fail {themeStore.current ===
										'classic'
											? 'rounded-md'
											: ''}"
										onclick={() => cardStash.removeCard(card.id)}
										title="Purge card from stash"
										aria-label="Delete card"
									>
										<Trash2 size={10} />
									</button>
								</div>

								<!-- Bottom Action Banner -->
								<div
									class="relative z-10 w-full bg-gradient-to-t from-bg via-bg/85 to-transparent p-2 {themeStore.current ===
									'hyv'
										? 'font-mono'
										: 'font-sans'}"
								>
									<p
										class="truncate text-[10px] text-text {themeStore.current === 'hyv'
											? 'lowercase'
											: 'font-medium'}"
									>
										{card.name}
									</p>
									{#if card.context}
										<p class="truncate text-[8px] text-muted">{card.context}</p>
									{/if}

									<button
										type="button"
										class="mt-1 flex w-full cursor-pointer items-center justify-center gap-1 border py-0.5 text-[9px] transition-all {themeStore.current ===
										'classic'
											? 'rounded-md font-semibold'
											: 'uppercase'} {addedFeedback[card.id]
											? 'border-signal bg-signal/20 text-signal'
											: 'border-accent/40 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20 hover:text-accent-strong'}"
										onclick={() => handleAddCard(card)}
									>
										{#if addedFeedback[card.id]}
											<Check size={9} />
											<span>Added!</span>
										{:else}
											<Plus size={9} />
											<span>Deploy</span>
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
				class="mt-4 flex items-center justify-between border-t border-line pt-3 text-[10px] text-muted {themeStore.current ===
				'hyv'
					? 'tracking-meta font-mono'
					: 'font-sans'}"
			>
				<div class="flex items-center gap-3">
					<button
						type="button"
						class="flex cursor-pointer items-center gap-1 hover:text-text"
						onclick={handleExportStash}
						title="Export stash JSON backup"
					>
						<Download size={10} />
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Export</span>
					</button>

					<button
						type="button"
						class="flex cursor-pointer items-center gap-1 hover:text-text"
						onclick={() => fileInput?.click()}
						title="Import stash JSON backup"
					>
						<Upload size={10} />
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Import</span>
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
						class="cursor-pointer hover:text-status-fail {themeStore.current === 'hyv'
							? 'uppercase'
							: ''}"
						onclick={() => {
							if (confirm('Purge entire Global Card Stash? This cannot be undone.')) {
								cardStash.clearStash();
							}
						}}
					>
						{themeStore.current === 'hyv' ? 'PURGE_STASH' : 'Clear Stash'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
