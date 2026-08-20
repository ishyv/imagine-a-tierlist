<script>
	import { Search, Link, Loader2, AlertCircle, ExternalLink, Image, Sparkles } from 'lucide-svelte';
	import { searchImages } from '#lib/services/imageSearch.js';
	import { fetchDisambiguation } from '#lib/services/ai.js';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import ScanBand from './ambient/ScanBand.svelte';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   initialQuery?: string;
	 *   itemName?: string;
	 *   mode?: 'create' | 'change';
	 *   onselect: (result: { name: string; imageUrl: string; sourceUrl?: string }) => void;
	 *   onclose: () => void;
	 * }}
	 */
	let {
		open = false,
		initialQuery = '',
		itemName = '',
		mode = 'create',
		onselect,
		onclose
	} = $props();

	let query = $state('');
	let manualUrl = $state('');
	let isLoading = $state(false);
	let isRefining = $state(false);
	/** @type {import('#lib/types.js').ImageSearchResult[]} */
	let results = $state([]);
	let error = $state('');
	let activeTab = $state('search'); // 'search' | 'url'

	// Synchronize and auto-search on opening with a new query
	$effect(() => {
		if (open) {
			query = initialQuery || itemName;
			manualUrl = '';
			activeTab = 'search';
			if (query) {
				performSearch(query);
			} else {
				results = [];
				error = '';
			}
		}
	});

	/**
	 * Disambiguates and improves the query using AI
	 */
	async function handleAiRefine() {
		const target = query.trim() || itemName;
		if (!target || isRefining) return;

		isRefining = true;
		const refined = await fetchDisambiguation(target, board.context);
		isRefining = false;

		if (refined?.searchQuery) {
			query = refined.searchQuery;
			performSearch(refined.searchQuery);
		}
	}

	/**
	 * @param {string} searchQuery
	 */
	async function performSearch(searchQuery) {
		if (!searchQuery.trim()) return;
		isLoading = true;
		error = '';
		results = [];

		const res = await searchImages(searchQuery);
		isLoading = false;

		if (res.error) {
			error = res.message || 'Image search query failed.';
		} else if (res.results.length === 0) {
			error =
				'No matching visual candidates found. Refine search keywords or input direct image URL.';
		} else {
			results = res.results;
		}
	}

	/**
	 * @param {SubmitEvent} [e]
	 */
	function handleSearchSubmit(e) {
		e?.preventDefault();
		performSearch(query);
	}

	/**
	 * @param {import('#lib/types.js').ImageSearchResult} item
	 */
	function handleSelect(item) {
		onselect({
			name: itemName || query,
			imageUrl: item.imageUrl,
			sourceUrl: item.sourceUrl
		});
		onclose();
	}

	/**
	 * @param {SubmitEvent} [e]
	 */
	function handleManualSubmit(e) {
		e?.preventDefault();
		if (!manualUrl.trim()) return;

		onselect({
			name: itemName || 'Custom Image',
			imageUrl: manualUrl.trim(),
			sourceUrl: manualUrl.trim()
		});
		onclose();
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="shadow-veil relative flex max-h-[90vh] w-full max-w-2xl flex-col border border-line bg-bg-elev text-text {themeStore.current ===
			'classic'
				? 'overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
				<ScanBand active={isLoading || isRefining} />
			{/if}

			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-line bg-bg-elev/90 px-5 py-3 {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<div>
					<h3
						class="text-xs text-text {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-bold'}"
					>
						{mode === 'change' ? `Select Visual: "${itemName}"` : `Add Card: "${itemName}"`}
					</h3>
					<p class="mt-0.5 text-[10px] text-muted">
						{themeStore.current === 'hyv'
							? 'select visual candidate to bind entity card'
							: 'Pick an image candidate or enter a direct image URL'}
					</p>
				</div>
				<button
					type="button"
					class="cursor-pointer text-xs text-muted hover:text-text"
					onclick={onclose}
					aria-label="Close image picker"
				>
					&times;
				</button>
			</div>

			<!-- Search and Mode Controls -->
			<div
				class="space-y-3 border-b border-line bg-bg/50 p-4 text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				<div class="flex items-center justify-between gap-3">
					<!-- Tabs -->
					<div
						class="flex border border-line bg-bg p-0.5 {themeStore.current === 'classic'
							? 'rounded-lg border-zinc-800'
							: ''}"
					>
						<button
							type="button"
							class="cursor-pointer px-3 py-1 text-xs transition-colors {themeStore.current ===
							'classic'
								? 'rounded-md'
								: ''} {activeTab === 'search'
								? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
								: 'text-muted hover:text-text'}"
							onclick={() => (activeTab = 'search')}
						>
							<span
								class="flex items-center gap-1.5 {themeStore.current === 'hyv' ? 'uppercase' : ''}"
							>
								<Search size={11} />
								<span>Search Web</span>
							</span>
						</button>
						<button
							type="button"
							class="cursor-pointer px-3 py-1 text-xs transition-colors {themeStore.current ===
							'classic'
								? 'rounded-md'
								: ''} {activeTab === 'url'
								? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
								: 'text-muted hover:text-text'}"
							onclick={() => (activeTab = 'url')}
						>
							<span
								class="flex items-center gap-1.5 {themeStore.current === 'hyv' ? 'uppercase' : ''}"
							>
								<Link size={11} />
								<span>Direct URL</span>
							</span>
						</button>
					</div>
				</div>

				{#if activeTab === 'search'}
					<!-- Search Form -->
					<form onsubmit={handleSearchSubmit} class="flex gap-2">
						<div class="relative flex-1">
							<Search size={12} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
							<input
								type="text"
								bind:value={query}
								placeholder="Search query keywords..."
								class="w-full border border-line bg-bg py-1.5 pr-3 pl-8 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
								'classic'
									? 'rounded-lg border-zinc-700 bg-zinc-950'
									: ''}"
							/>
						</div>
						<button
							type="button"
							disabled={isRefining || !query.trim()}
							class="flex shrink-0 cursor-pointer items-center gap-1 border border-accent/40 bg-bg px-2.5 py-1.5 text-xs text-accent transition-colors hover:border-accent hover:bg-accent/15 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
							'classic'
								? 'rounded-lg'
								: ''}"
							onclick={handleAiRefine}
							title="Fix typos and find canonical search keywords with AI"
						>
							{#if isRefining}
								<Loader2 size={11} class="animate-spin text-accent" />
							{:else}
								<Sparkles size={11} />
							{/if}
							<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Refine</span>
						</button>
						<button
							type="submit"
							disabled={isLoading || !query.trim()}
							class="flex shrink-0 cursor-pointer items-center gap-1 border border-accent bg-accent/20 px-3.5 py-1.5 font-medium text-accent transition-colors hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
							'classic'
								? 'rounded-lg font-semibold'
								: ''}"
						>
							{#if isLoading}
								<Loader2 size={11} class="animate-spin text-accent" />
								<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Searching...</span>
							{:else}
								<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Search</span>
							{/if}
						</button>
					</form>
				{:else}
					<!-- Manual URL Form -->
					<form onsubmit={handleManualSubmit} class="flex gap-2">
						<div class="relative flex-1">
							<Link size={12} class="absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
							<input
								type="url"
								bind:value={manualUrl}
								placeholder="https://example.com/image.png"
								class="w-full border border-line bg-bg py-1.5 pr-3 pl-8 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
								'classic'
									? 'rounded-lg border-zinc-700 bg-zinc-950'
									: ''}"
							/>
						</div>
						<button
							type="submit"
							disabled={!manualUrl.trim()}
							class="shrink-0 cursor-pointer border border-accent bg-accent/20 px-3.5 py-1.5 font-medium text-accent transition-colors hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
							'classic'
								? 'rounded-lg font-semibold'
								: 'uppercase'}"
						>
							{mode === 'change' ? 'Apply Image' : 'Create Card'}
						</button>
					</form>
				{/if}
			</div>

			<!-- Candidate Grid & States -->
			<div
				class="min-h-64 flex-1 overflow-y-auto p-5 text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				{#if activeTab === 'url'}
					<div class="flex flex-col items-center justify-center p-6 text-center">
						{#if manualUrl}
							<div
								class="mb-3 h-36 w-36 border border-line bg-bg {themeStore.current === 'classic'
									? 'overflow-hidden rounded-xl border-zinc-800'
									: ''}"
							>
								<img
									src={manualUrl}
									alt="Preview"
									class="h-full w-full object-cover"
									onerror={(e) => {
										// @ts-ignore
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
							<p class="text-xs text-muted">Click "Apply Image" to bind this URL.</p>
						{:else}
							<div
								class="mb-3 border border-line bg-bg p-3 text-muted {themeStore.current ===
								'classic'
									? 'rounded-xl'
									: ''}"
							>
								<Image size={24} />
							</div>
							<p class="text-xs font-medium text-text">Paste direct web image URL</p>
							<p class="mt-1 max-w-sm text-[10px] text-muted">
								Supports direct JPG, PNG, WebP, or SVG resources from any public link.
							</p>
						{/if}
					</div>
				{:else if isLoading}
					<!-- Skeleton Candidate Grid -->
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
							<div
								class="flex aspect-square animate-pulse flex-col justify-end border border-line bg-bg/80 p-2 {themeStore.current ===
								'classic'
									? 'rounded-xl border-zinc-800'
									: ''}"
							>
								<div class="mb-1 h-2.5 w-3/4 bg-line-strong"></div>
								<div class="h-2 w-1/2 bg-line"></div>
							</div>
						{/each}
					</div>
				{:else if error}
					<!-- Error or No Results State -->
					<div class="flex flex-col items-center justify-center px-4 py-10 text-center">
						<div
							class="mb-2 border border-line p-2 text-status-warn {themeStore.current === 'classic'
								? 'rounded-lg'
								: ''}"
						>
							<AlertCircle size={20} />
						</div>
						<h4
							class="text-xs text-text {themeStore.current === 'hyv'
								? 'uppercase'
								: 'font-semibold'}"
						>
							{themeStore.current === 'hyv' ? '// NO_RESULTS' : 'No Results Found'}
						</h4>
						<p class="mt-1 max-w-md text-[10px] text-muted">
							{error}
						</p>
						<button
							type="button"
							class="mt-3 cursor-pointer border border-line bg-bg px-3 py-1 text-xs text-text transition-colors hover:border-accent hover:text-accent-strong {themeStore.current ===
							'classic'
								? 'rounded-lg border-zinc-700 bg-zinc-800'
								: 'uppercase'}"
							onclick={() => (activeTab = 'url')}
						>
							Paste Direct Image URL
						</button>
					</div>
				{:else if results.length > 0}
					<!-- Candidate Results Grid -->
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each results as item (item.id)}
							<button
								type="button"
								class="group relative flex aspect-square cursor-pointer flex-col justify-end border border-line bg-bg text-left transition-all hover:border-accent {themeStore.current ===
								'classic'
									? 'overflow-hidden rounded-xl border-zinc-800 bg-zinc-950 hover:shadow-lg'
									: ''}"
								onclick={() => handleSelect(item)}
								title={item.title}
							>
								<!-- Thumbnail -->
								<img
									src={item.thumbnailUrl || item.imageUrl}
									alt={item.title}
									loading="lazy"
									decoding="async"
									referrerpolicy="no-referrer"
									class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
								/>

								<!-- Gradient Overlay & Caption -->
								<div
									class="relative z-10 w-full bg-gradient-to-t from-bg via-bg/80 to-transparent p-2 {themeStore.current ===
									'hyv'
										? 'font-mono'
										: 'font-sans'}"
								>
									<p
										class="truncate text-[10px] text-text drop-shadow-xs {themeStore.current ===
										'hyv'
											? 'lowercase'
											: 'font-medium'}"
									>
										{item.title}
									</p>
									{#if item.sourceUrl}
										<div class="mt-0.5 flex items-center gap-1 truncate text-[8px] text-muted">
											<ExternalLink size={8} />
											<span class="truncate">
												{(() => {
													try {
														return new URL(item.sourceUrl).hostname.replace(/^www\./, '');
													} catch {
														return 'source';
													}
												})()}
											</span>
										</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer Note -->
			<div
				class="flex items-center justify-between border-t border-line bg-bg px-5 py-2.5 text-[10px] text-muted {themeStore.current ===
				'hyv'
					? 'tracking-meta font-mono uppercase'
					: 'font-sans'}"
			>
				<span>Powered by Google Images API</span>
				<span>Esc to Close</span>
			</div>
		</div>
	</div>
{/if}
