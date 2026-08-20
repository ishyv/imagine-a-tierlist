<script>
	import {
		Sparkles,
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
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { fetchBulkItems, resolveBatchImages } from '#lib/services/ai.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import ScanBand from './ambient/ScanBand.svelte';

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
			error = res.message || 'Failed to generate items. Please refine prompt.';
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
	 * Step 1B: Parse plain text list (one per line)
	 */
	function handleParseTextList() {
		const lines = rawTextList
			.split('\n')
			.map((l) => l.trim())
			.filter((l) => l.length > 0);

		if (lines.length === 0) {
			error = 'Please enter at least one item name.';
			return;
		}

		candidateItems = lines.map((name) => ({
			name,
			searchQuery: board.context ? `${name} ${board.context} official art` : `${name} official art`,
			selected: true
		}));

		step = 'review';
	}

	function handleSelectAll() {
		for (const item of candidateItems) {
			item.selected = true;
		}
	}

	function handleDeselectAll() {
		for (const item of candidateItems) {
			item.selected = false;
		}
	}

	/**
	 * @param {string} name
	 */
	function toggleItemByName(name) {
		const item = candidateItems.find((i) => i.name === name);
		if (item) {
			item.selected = !item.selected;
		}
	}

	/**
	 * Step 2: Fetch images in batch and insert to board
	 */
	async function handleIngestCards() {
		const selected = candidateItems.filter((i) => i.selected);
		if (selected.length === 0) return;

		step = 'fetching_images';
		progress = { current: 0, total: selected.length, currentItemName: '' };

		const results = await resolveBatchImages(
			selected,
			(/** @type {{ current: number; total: number; currentItemName: string }} */ prog) => {
				progress = prog;
			},
			5
		);

		// Add cards to unranked holding pool
		for (const card of results) {
			board.addItem(card.name, card.imageUrl, card.sourceUrl);
		}

		onclose();
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open && step !== 'fetching_images' && step !== 'generating') {
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
		aria-label="Bulk Add Cards"
	>
		<div
			class="shadow-veil relative flex max-h-[90vh] w-full max-w-2xl flex-col border border-line bg-bg-elev text-text {themeStore.current ===
			'classic'
				? 'overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
				<ScanBand active={step === 'generating' || step === 'fetching_images'} />
			{/if}

			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-line bg-bg-elev/90 px-6 py-4 {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<div class="flex items-center gap-2">
					<Layers
						size={16}
						class={themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'}
					/>
					<div>
						<h3
							class="text-xs text-text {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-bold'}"
						>
							{themeStore.current === 'hyv'
								? 'MASS_INGRESS // BATCH_CARD_GENERATOR'
								: 'Bulk Add Cards'}
						</h3>
						<p class="text-[10px] text-muted">
							{themeStore.current === 'hyv'
								? 'generate and populate 15 to 150+ cards with AI or custom roster'
								: 'Generate and add 15 to 150+ cards with AI or custom text'}
						</p>
					</div>
				</div>

				<button
					type="button"
					disabled={step === 'generating' || step === 'fetching_images'}
					class="cursor-pointer text-xs text-muted hover:text-text disabled:opacity-40"
					onclick={onclose}
					aria-label="Close modal"
				>
					&times;
				</button>
			</div>

			<!-- Modal Content -->
			<div
				class="space-y-5 overflow-y-auto p-6 text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				{#if error}
					<div
						class="flex items-center gap-2.5 border border-status-fail/40 bg-status-fail/10 p-3 text-status-fail {themeStore.current ===
						'classic'
							? 'rounded-lg'
							: ''}"
					>
						<AlertCircle size={14} class="shrink-0 text-status-fail" />
						<span>{error}</span>
					</div>
				{/if}

				{#if step === 'input' || step === 'generating'}
					<!-- Mode Switcher -->
					<div
						class="flex border border-line bg-bg p-1 text-xs {themeStore.current === 'classic'
							? 'rounded-lg border-zinc-800 bg-zinc-950'
							: ''}"
					>
						<button
							type="button"
							class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-1.5 transition-colors {themeStore.current ===
							'classic'
								? 'rounded-md'
								: ''} {inputMode === 'ai'
								? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
								: 'text-muted hover:text-text'}"
							onclick={() => (inputMode = 'ai')}
							disabled={step === 'generating'}
						>
							<Sparkles size={12} class="text-accent" />
							<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
								AI Auto-Roster
							</span>
						</button>

						<button
							type="button"
							class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-1.5 transition-colors {themeStore.current ===
							'classic'
								? 'rounded-md'
								: ''} {inputMode === 'text'
								? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
								: 'text-muted hover:text-text'}"
							onclick={() => (inputMode = 'text')}
							disabled={step === 'generating'}
						>
							<FileText size={12} />
							<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
								Paste Text List
							</span>
						</button>
					</div>

					{#if inputMode === 'ai'}
						<div class="space-y-4">
							<div>
								<label
									for="bulk-prompt"
									class="mb-1.5 block text-[10px] text-muted-strong {themeStore.current === 'hyv'
										? 'tracking-meta uppercase'
										: 'font-medium'}"
								>
									Roster Directive / Query
								</label>
								<textarea
									id="bulk-prompt"
									bind:value={prompt}
									rows="3"
									disabled={step === 'generating'}
									placeholder="e.g. 'All 160+ League of Legends champions' or 'All Gen 1 Pokémon'..."
									class="w-full border border-line bg-bg p-3 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none disabled:opacity-50 {themeStore.current ===
									'classic'
										? 'rounded-lg border-zinc-700 bg-zinc-950'
										: ''}"></textarea>
							</div>

							<!-- Count selector -->
							<div class="flex items-center justify-between">
								<span
									class="text-[10px] text-muted-strong {themeStore.current === 'hyv'
										? 'tracking-meta uppercase'
										: 'font-medium'}"
								>
									Quantity Target:
								</span>
								<div class="flex flex-wrap gap-1.5">
									{#each COUNT_OPTIONS as option (option)}
										<button
											type="button"
											class="cursor-pointer border px-2.5 py-1 text-xs transition-colors {themeStore.current ===
											'classic'
												? 'rounded-md'
												: ''} {count === option
												? 'border-accent bg-accent/15 font-medium text-accent-strong'
												: 'border-line bg-bg text-muted hover:border-line-strong hover:text-text'}"
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
								<p
									class="mb-2 text-[10px] text-muted-strong {themeStore.current === 'hyv'
										? 'tracking-meta uppercase'
										: 'font-medium'}"
								>
									Common Presets:
								</p>
								<div class="flex flex-wrap gap-1.5">
									{#each PRESETS as preset (preset)}
										<button
											type="button"
											class="cursor-pointer border border-line bg-bg px-2.5 py-1 text-[11px] text-text-soft transition-colors hover:border-accent hover:text-accent-strong {themeStore.current ===
											'classic'
												? 'rounded-md border-zinc-700 bg-zinc-800'
												: ''}"
											onclick={() => {
												prompt = preset;
												if (preset.includes('160') || preset.includes('151')) count = 150;
												else if (preset.includes('Smash')) count = 100;
											}}
											disabled={step === 'generating'}
										>
											<span>{preset}</span>
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
									class="mb-1.5 block text-[10px] text-muted-strong {themeStore.current === 'hyv'
										? 'tracking-meta uppercase'
										: 'font-medium'}"
								>
									Paste Entity Names (one per line):
								</label>
								<textarea
									id="bulk-text-list"
									bind:value={rawTextList}
									rows="8"
									placeholder="Aatrox&#10;Ahri&#10;Akali&#10;Akshan&#10;Alistar..."
									class="w-full border border-line bg-bg p-3 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
									'classic'
										? 'rounded-lg border-zinc-700 bg-zinc-950'
										: ''}"></textarea>
							</div>
							<p class="text-[10px] text-muted">
								Each line will automatically be resolved to its best official web visual.
							</p>
						</div>
					{/if}
				{:else if step === 'review'}
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<p class="text-xs text-text-soft">
								Reviewing {candidateItems.length} candidate items:
							</p>
							<div class="flex items-center gap-2">
								<button
									type="button"
									class="cursor-pointer text-accent hover:underline"
									onclick={handleSelectAll}
								>
									Select All
								</button>
								<span class="text-muted-strong">&bull;</span>
								<button
									type="button"
									class="cursor-pointer text-muted hover:text-text hover:underline"
									onclick={handleDeselectAll}
								>
									Clear
								</button>
							</div>
						</div>

						<!-- Quick Filter Input -->
						{#if candidateItems.length > 15}
							<div class="relative">
								<Search size={12} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
								<input
									type="text"
									bind:value={filterQuery}
									placeholder={`Filter ${candidateItems.length} items...`}
									class="w-full border border-line bg-bg py-1.5 pr-3 pl-8 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
									'classic'
										? 'rounded-lg border-zinc-700 bg-zinc-950'
										: ''}"
								/>
							</div>
						{/if}

						<!-- Candidate Item Checkbox List -->
						<div
							class="max-h-64 space-y-1 overflow-y-auto border border-line bg-bg p-2.5 {themeStore.current ===
							'classic'
								? 'rounded-xl border-zinc-800 bg-zinc-950'
								: ''}"
						>
							{#each filteredCandidates as item (item.name)}
								<button
									type="button"
									class="flex w-full cursor-pointer items-center justify-between p-1.5 text-left text-xs transition-colors hover:bg-bg-elev {themeStore.current ===
									'classic'
										? 'rounded-md'
										: ''} {item.selected ? 'text-text' : 'text-muted-strong line-through'}"
									onclick={() => toggleItemByName(item.name)}
								>
									<div class="flex items-center gap-2">
										{#if item.selected}
											<CheckSquare size={14} class="shrink-0 text-accent" />
										{:else}
											<Square size={14} class="shrink-0 text-muted-strong" />
										{/if}
										<span>{item.name}</span>
									</div>
									<span class="truncate pl-2 text-[10px] text-muted">{item.searchQuery}</span>
								</button>
							{/each}
						</div>
					</div>
				{:else if step === 'fetching_images'}
					<!-- Progress State -->
					<div class="flex flex-col items-center justify-center py-8 text-center">
						<Loader2 size={28} class="animate-spin text-accent" />
						<h4
							class="mt-3 text-xs text-text {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-bold'}"
						>
							{themeStore.current === 'hyv'
								? 'RESOLVING_WEB_VISUALS // INGRESS_ACTIVE'
								: 'Fetching High-Res Images...'}
						</h4>
						<p class="mt-1 text-xs text-muted">
							Fetching: <strong class="text-accent-strong"
								>{progress.currentItemName || 'card...'}</strong
							>
						</p>

						<!-- Progress Bar -->
						<div
							class="mt-5 h-1.5 w-full max-w-sm border border-line bg-bg {themeStore.current ===
							'classic'
								? 'overflow-hidden rounded-full'
								: ''}"
						>
							<div
								class="h-full bg-accent transition-all duration-200"
								style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
							></div>
						</div>
						<p class="mt-2 text-[10px] text-muted">
							{progress.current} of {progress.total} cards ready ({Math.round(
								(progress.current / (progress.total || 1)) * 100
							)}%)
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div
				class="flex items-center justify-between border-t border-line bg-bg px-5 py-3 text-xs {themeStore.current ===
				'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				{#if step === 'input' || step === 'generating'}
					<button
						type="button"
						class="cursor-pointer border border-line bg-bg-elev px-3.5 py-1.5 text-muted transition-colors hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800'
							: ''}"
						onclick={onclose}
					>
						Cancel
					</button>

					{#if inputMode === 'ai'}
						<button
							type="button"
							disabled={!prompt.trim() || step === 'generating'}
							class="flex cursor-pointer items-center gap-1.5 border border-accent bg-accent/20 px-4 py-1.5 font-medium text-accent transition-all hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
							'classic'
								? 'rounded-lg font-semibold'
								: ''}"
							onclick={handleGenerateList}
						>
							{#if step === 'generating'}
								<Loader2 size={12} class="animate-spin text-accent" />
								<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
									Generating Roster...
								</span>
							{:else}
								<Sparkles size={12} />
								<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
									Generate {count} Cards
								</span>
								<ArrowRight size={12} />
							{/if}
						</button>
					{:else}
						<button
							type="button"
							disabled={!rawTextList.trim()}
							class="flex cursor-pointer items-center gap-1.5 border border-accent bg-accent/20 px-4 py-1.5 font-medium text-accent transition-all hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
							'classic'
								? 'rounded-lg font-semibold'
								: ''}"
							onclick={handleParseTextList}
						>
							<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Review Cards</span>
							<ArrowRight size={12} />
						</button>
					{/if}
				{:else if step === 'review'}
					<button
						type="button"
						class="cursor-pointer border border-line bg-bg-elev px-3.5 py-1.5 text-muted transition-colors hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800'
							: ''}"
						onclick={() => (step = 'input')}
					>
						Back
					</button>

					<button
						type="button"
						disabled={selectedCount === 0}
						class="flex cursor-pointer items-center gap-1.5 border border-accent bg-accent/20 px-4 py-1.5 font-medium text-accent transition-all hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
						'classic'
							? 'rounded-lg font-semibold'
							: ''}"
						onclick={handleIngestCards}
					>
						<Layers size={12} />
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
							Deploy {selectedCount} Cards to Board
						</span>
						<ArrowRight size={12} />
					</button>
				{:else if step === 'fetching_images'}
					<div></div>
					<div class="text-[10px] text-muted">
						Resolving images in parallel (5 concurrent streams)...
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
