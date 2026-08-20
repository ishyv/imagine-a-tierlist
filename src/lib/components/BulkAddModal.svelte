<script>
	import {
		Sparkles,
		X,
		Loader2,
		AlertCircle,
		CheckSquare,
		Square,
		ArrowRight,
		Layers,
		FileText,
		Search
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { fetchBulkItems, resolveBatchImages } from '#lib/services/ai.js';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   onclose: () => void;
	 * }}
	 */
	let { open = false, onclose } = $props();

	/** @type {'ai' | 'text'} */
	let inputMode = $state('ai');
	let prompt = $state('');
	let rawTextList = $state('');
	let count = $state(30);
	let filterQuery = $state('');
	/** @type {'input' | 'generating' | 'review' | 'fetching_images'} */
	let step = $state('input');
	/** @type {Array<{ name: string; searchQuery: string; selected: boolean }>} */
	let candidateItems = $state([]);
	let error = $state('');
	let progress = $state({ current: 0, total: 0, currentItemName: '' });

	const PRESETS = [
		'All 160+ League of Legends champions',
		'All 151 Gen 1 Pokémon',
		'Top 30 Anime of All Time',
		'Every Quentin Tarantino film',
		'Top 25 Fast Food Chains',
		'All Super Smash Bros Ultimate Characters',
		'MCU Phase 1-4 Heroes & Villains'
	];

	const COUNT_OPTIONS = [15, 30, 50, 100, 150];

	// Reset state when opening
	$effect(() => {
		if (open) {
			step = 'input';
			error = '';
			candidateItems = [];
			filterQuery = '';
			progress = { current: 0, total: 0, currentItemName: '' };
			if (!prompt && board.context) {
				prompt = `All major characters in ${board.context}`;
			}
		}
	});

	const filteredCandidates = $derived.by(() => {
		const q = filterQuery.toLowerCase().trim();
		if (!q) return candidateItems;
		return candidateItems.filter((i) => i.name.toLowerCase().includes(q));
	});

	const selectedCount = $derived.by(() => {
		return candidateItems.filter((i) => i.selected).length;
	});

	/**
	 * Step 1A: Call AI to generate list of items
	 */
	async function handleGenerateList() {
		const trimmed = prompt.trim();
		if (!trimmed) return;

		step = 'generating';
		error = '';

		const existingNames = board.items.map((i) => i.name);
		const res = await fetchBulkItems(trimmed, board.context, existingNames, count);

		if (res.error || !res.items || res.items.length === 0) {
			error = res.message || 'Failed to generate items. Please try a different prompt.';
			step = 'input';
			return;
		}

		candidateItems = res.items.map((item) => ({
			name: item.name,
			searchQuery: item.searchQuery,
			selected: true
		}));

		step = 'review';
	}

	/**
	 * Step 1B: Parse plain text lines into candidate items
	 */
	function handleParseTextList() {
		const lines = rawTextList
			.split(/\r?\n/)
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		if (lines.length === 0) {
			error = 'Please paste or type at least one item (one per line).';
			return;
		}

		const uniqueNames = Array.from(new Set(lines));
		candidateItems = uniqueNames.slice(0, 200).map((name) => ({
			name,
			searchQuery: board.context ? `${name} ${board.context} official art` : `${name} official art`,
			selected: true
		}));

		step = 'review';
	}

	function handleSelectAll() {
		candidateItems = candidateItems.map((item) => ({ ...item, selected: true }));
	}

	function handleDeselectAll() {
		candidateItems = candidateItems.map((item) => ({ ...item, selected: false }));
	}

	/**
	 * @param {string} name
	 */
	function toggleItemByName(name) {
		const item = candidateItems.find((i) => i.name === name);
		if (item) item.selected = !item.selected;
	}

	/**
	 * Step 2: Fetch images and add to board
	 */
	async function handleAddSelectedItems() {
		const selected = candidateItems.filter((i) => i.selected);
		if (selected.length === 0) return;

		step = 'fetching_images';
		error = '';
		progress = { current: 0, total: selected.length, currentItemName: '' };

		try {
			const resolved = await resolveBatchImages(selected, (p) => {
				progress = p;
			});

			board.addMultipleItems(resolved);

			// Done! Close modal
			onclose();
		} catch (e) {
			console.error('Failed to batch resolve images:', e);
			error = 'An error occurred while fetching images. Some cards may not have been created.';
			step = 'review';
		}
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open && step !== 'fetching_images') {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-label="Bulk Add with AI"
	>
		<div
			class="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl duration-150"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-5 py-3.5"
			>
				<div class="flex items-center gap-2">
					<div
						class="rounded-lg border border-purple-500/20 bg-purple-500/10 p-1.5 text-purple-400"
					>
						<Sparkles size={18} />
					</div>
					<div>
						<h3 class="text-base font-semibold text-zinc-100">Bulk Add Cards</h3>
						<p class="text-xs text-zinc-400">
							Generate massive rosters with AI or paste a plain text list of items.
						</p>
					</div>
				</div>
				{#if step !== 'fetching_images'}
					<button
						type="button"
						class="cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
						onclick={onclose}
						aria-label="Close bulk add modal"
					>
						<X size={18} />
					</button>
				{/if}
			</div>

			<!-- Body -->
			<div class="flex-1 overflow-y-auto p-5">
				{#if error}
					<div
						class="mb-4 flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
					>
						<AlertCircle size={16} class="shrink-0 text-red-400" />
						<span>{error}</span>
					</div>
				{/if}

				{#if step === 'input' || step === 'generating'}
					<!-- Mode Switcher Tabs -->
					<div class="mb-4 flex rounded-lg border border-zinc-800 bg-zinc-950 p-1">
						<button
							type="button"
							class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-colors {inputMode ===
							'ai'
								? 'bg-purple-600 text-white'
								: 'text-zinc-400 hover:text-zinc-200'}"
							onclick={() => (inputMode = 'ai')}
						>
							<Sparkles size={13} />
							<span>AI Generator</span>
						</button>
						<button
							type="button"
							class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md py-1.5 text-xs font-semibold transition-colors {inputMode ===
							'text'
								? 'bg-purple-600 text-white'
								: 'text-zinc-400 hover:text-zinc-200'}"
							onclick={() => (inputMode = 'text')}
						>
							<FileText size={13} />
							<span>Paste Text List</span>
						</button>
					</div>

					{#if inputMode === 'ai'}
						<div class="space-y-4">
							<div>
								<label for="bulk-prompt" class="mb-1.5 block text-xs font-semibold text-zinc-300">
									What roster or items would you like to generate?
								</label>
								<textarea
									id="bulk-prompt"
									bind:value={prompt}
									rows="3"
									disabled={step === 'generating'}
									placeholder="e.g. 'All 160+ League of Legends champions' or 'All Gen 1 Pokémon'..."
									class="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden disabled:opacity-50"
								></textarea>
							</div>

							<!-- Count selector -->
							<div class="flex items-center justify-between">
								<span class="text-xs text-zinc-400">Target quantity:</span>
								<div class="flex flex-wrap gap-1.5">
									{#each COUNT_OPTIONS as option (option)}
										<button
											type="button"
											class="cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium transition-colors {count ===
											option
												? 'border-purple-500 bg-purple-500/20 text-purple-300'
												: 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}"
											onclick={() => (count = option)}
											disabled={step === 'generating'}
										>
											{option} items
										</button>
									{/each}
								</div>
							</div>

							<!-- Presets -->
							<div>
								<p class="mb-2 text-[11px] font-medium text-zinc-400">Popular rosters & ideas:</p>
								<div class="flex flex-wrap gap-1.5">
									{#each PRESETS as preset (preset)}
										<button
											type="button"
											class="cursor-pointer rounded-full border border-zinc-800 bg-zinc-800/80 px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-purple-500/50 hover:bg-purple-950/30 hover:text-purple-200"
											onclick={() => {
												prompt = preset;
												if (preset.includes('160') || preset.includes('151')) count = 150;
												else if (preset.includes('Smash')) count = 100;
											}}
											disabled={step === 'generating'}
										>
											{preset}
										</button>
									{/each}
								</div>
							</div>
						</div>
					{:else}
						<!-- Plain Text List Input -->
						<div class="space-y-3">
							<div>
								<label
									for="bulk-text-list"
									class="mb-1.5 block text-xs font-semibold text-zinc-300"
								>
									Paste item names (one per line):
								</label>
								<textarea
									id="bulk-text-list"
									bind:value={rawTextList}
									rows="8"
									placeholder="Aatrox&#10;Ahri&#10;Akali&#10;Akshan&#10;Alistar&#10;Amumu&#10;Anivia&#10;Annie..."
									class="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-white placeholder-zinc-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-hidden"
								></textarea>
							</div>
							<p class="text-[11px] text-zinc-400">
								Tip: You can copy lists directly from Wikipedia or character guides. Each line will
								automatically be searched on the web to find its official image!
							</p>
						</div>
					{/if}
				{:else if step === 'review'}
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="text-xs text-zinc-400">
								Review {candidateItems.length} candidate items:
							</p>
							<div class="flex items-center gap-2 text-xs">
								<button
									type="button"
									class="cursor-pointer text-purple-400 hover:underline"
									onclick={handleSelectAll}
								>
									Select All
								</button>
								<span class="text-zinc-600">&bull;</span>
								<button
									type="button"
									class="cursor-pointer text-zinc-400 hover:underline"
									onclick={handleDeselectAll}
								>
									Clear All
								</button>
							</div>
						</div>

						<!-- Quick Filter Input for large lists -->
						{#if candidateItems.length > 15}
							<div class="relative">
								<Search size={13} class="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
								<input
									type="text"
									bind:value={filterQuery}
									placeholder={`Filter ${candidateItems.length} items...`}
									class="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pr-3 pl-8 text-xs text-zinc-200 placeholder-zinc-500 focus:border-purple-500 focus:outline-hidden"
								/>
							</div>
						{/if}

						<!-- Candidate Item Checkbox List -->
						<div
							class="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-2.5"
						>
							{#each filteredCandidates as item (item.name)}
								<button
									type="button"
									class="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 text-left text-xs transition-colors hover:bg-zinc-800/60 {item.selected
										? 'text-zinc-100'
										: 'text-zinc-500 line-through'}"
									onclick={() => toggleItemByName(item.name)}
								>
									<div class="flex items-center gap-2.5">
										{#if item.selected}
											<CheckSquare size={16} class="shrink-0 text-purple-400" />
										{:else}
											<Square size={16} class="shrink-0 text-zinc-600" />
										{/if}
										<span class="font-medium">{item.name}</span>
									</div>
									<span class="truncate pl-2 text-[10px] text-zinc-500">{item.searchQuery}</span>
								</button>
							{/each}
						</div>
					</div>
				{:else if step === 'fetching_images'}
					<!-- Progress State -->
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<div
							class="mb-4 rounded-full border border-purple-500/20 bg-purple-500/10 p-4 text-purple-400"
						>
							<Loader2 size={32} class="animate-spin" />
						</div>
						<h4 class="text-base font-semibold text-zinc-100">
							Finding Images & Creating Cards...
						</h4>
						<p class="mt-1 text-xs text-zinc-400">
							Searching best image for: <strong class="text-purple-300"
								>{progress.currentItemName || 'card...'}</strong
							>
						</p>

						<!-- Progress Bar -->
						<div class="mt-5 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-zinc-800">
							<div
								class="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
								style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
							></div>
						</div>
						<p class="mt-2 text-[11px] text-zinc-400">
							{progress.current} of {progress.total} cards ready ({Math.round(
								(progress.current / (progress.total || 1)) * 100
							)}%)
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 py-3">
				{#if step === 'input' || step === 'generating'}
					<button
						type="button"
						class="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						onclick={onclose}
					>
						Cancel
					</button>

					{#if inputMode === 'ai'}
						<button
							type="button"
							disabled={!prompt.trim() || step === 'generating'}
							class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
							onclick={handleGenerateList}
						>
							{#if step === 'generating'}
								<Loader2 size={13} class="animate-spin" />
								<span>Generating Roster...</span>
							{:else}
								<Sparkles size={13} />
								<span>Generate {count} Items</span>
							{/if}
						</button>
					{:else}
						<button
							type="button"
							disabled={!rawTextList.trim()}
							class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-purple-500 disabled:pointer-events-none disabled:opacity-40"
							onclick={handleParseTextList}
						>
							<ArrowRight size={13} />
							<span>Review List</span>
						</button>
					{/if}
				{:else if step === 'review'}
					<button
						type="button"
						class="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
						onclick={() => (step = 'input')}
					>
						Back
					</button>
					<button
						type="button"
						disabled={selectedCount === 0}
						class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:pointer-events-none disabled:opacity-40"
						onclick={handleAddSelectedItems}
					>
						<Layers size={13} />
						<span>
							Add {selectedCount} Cards to Unranked
						</span>
						<ArrowRight size={13} />
					</button>
				{:else if step === 'fetching_images'}
					<div class="w-full text-center text-xs text-zinc-500">
						Processing web image lookups in high-speed batches...
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
