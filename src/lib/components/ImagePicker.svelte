<script>
	import {
		Search,
		Link,
		Loader2,
		AlertCircle,
		X,
		ExternalLink,
		Image,
		Sparkles
	} from 'lucide-svelte';
	import { searchImages } from '#lib/services/imageSearch.js';
	import { fetchDisambiguation } from '#lib/services/ai.js';
	import { board } from '#lib/stores/board.svelte.js';

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
			error = res.message || 'Image search failed.';
		} else if (res.results.length === 0) {
			error = 'No images found. Try refining your search query or use a direct image URL.';
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
			sourceUrl: undefined
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl duration-150"
		>
			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-5 py-3.5"
			>
				<div>
					<h3 class="text-base font-semibold text-zinc-100">
						{mode === 'change'
							? `Change Image for "${itemName}"`
							: `Select Image for "${itemName}"`}
					</h3>
					<p class="mt-0.5 text-xs text-zinc-400">
						Click an image candidate to create your card instantly.
					</p>
				</div>
				<button
					type="button"
					class="cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
					onclick={onclose}
					aria-label="Close image picker"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Search and Mode Controls -->
			<div class="space-y-3 border-b border-zinc-800 bg-zinc-950/40 p-4">
				<div class="flex items-center justify-between gap-3">
					<!-- Tabs -->
					<div class="bg-zinc-850 flex rounded-lg border border-zinc-800 p-0.5 text-xs">
						<button
							type="button"
							class="cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors {activeTab ===
							'search'
								? 'bg-blue-600 text-white shadow-xs'
								: 'text-zinc-400 hover:text-zinc-200'}"
							onclick={() => (activeTab = 'search')}
						>
							<span class="flex items-center gap-1.5">
								<Search size={13} />
								<span>Search Web</span>
							</span>
						</button>
						<button
							type="button"
							class="cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors {activeTab ===
							'url'
								? 'bg-blue-600 text-white shadow-xs'
								: 'text-zinc-400 hover:text-zinc-200'}"
							onclick={() => (activeTab = 'url')}
						>
							<span class="flex items-center gap-1.5">
								<Link size={13} />
								<span>Direct Image URL</span>
							</span>
						</button>
					</div>
				</div>

				{#if activeTab === 'search'}
					<!-- Search Form -->
					<form onsubmit={handleSearchSubmit} class="flex gap-2">
						<div class="relative flex-1">
							<Search size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
							<input
								type="text"
								bind:value={query}
								placeholder="Search images..."
								class="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-2 pr-3 pl-9 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
						<button
							type="button"
							disabled={isRefining || !query.trim()}
							class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:pointer-events-none disabled:opacity-40"
							onclick={handleAiRefine}
							title="Fix typos and find canonical search keywords with AI"
						>
							{#if isRefining}
								<Loader2 size={13} class="animate-spin text-purple-400" />
							{:else}
								<Sparkles size={13} class="text-purple-400" />
							{/if}
							<span>AI Refine</span>
						</button>
						<button
							type="submit"
							disabled={isLoading || !query.trim()}
							class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
						>
							{#if isLoading}
								<Loader2 size={13} class="animate-spin" />
								<span>Searching...</span>
							{:else}
								<span>Search</span>
							{/if}
						</button>
					</form>
				{:else}
					<!-- Manual URL Form -->
					<form onsubmit={handleManualSubmit} class="flex gap-2">
						<div class="relative flex-1">
							<Link size={15} class="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500" />
							<input
								type="url"
								bind:value={manualUrl}
								placeholder="https://example.com/image.png"
								class="w-full rounded-lg border border-zinc-700/80 bg-zinc-900 py-2 pr-3 pl-9 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
						<button
							type="submit"
							disabled={!manualUrl.trim()}
							class="shrink-0 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-50"
						>
							{mode === 'change' ? 'Apply Image' : 'Create Card'}
						</button>
					</form>
				{/if}
			</div>

			<!-- Candidate Grid & States -->
			<div class="min-h-64 flex-1 overflow-y-auto p-5">
				{#if activeTab === 'url'}
					<div class="flex flex-col items-center justify-center p-6 text-center">
						{#if manualUrl}
							<div
								class="mb-3 h-36 w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 shadow-md"
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
							<p class="text-xs text-zinc-400">Click "Apply Image" above to use this URL.</p>
						{:else}
							<div class="mb-3 rounded-full bg-zinc-800/80 p-4 text-zinc-400">
								<Image size={28} />
							</div>
							<p class="text-sm font-medium text-zinc-300">Paste any image web link</p>
							<p class="mt-1 max-w-sm text-xs text-zinc-500">
								You can paste direct JPG, PNG, WebP, or SVG links from any website.
							</p>
						{/if}
					</div>
				{:else if isLoading}
					<!-- Skeleton Candidate Grid -->
					<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
						{#each [0, 1, 2, 3, 4, 5, 6, 7] as i (i)}
							<div
								class="flex aspect-square animate-pulse flex-col justify-end rounded-xl border border-zinc-800 bg-zinc-800/60 p-2"
							>
								<div class="mb-1 h-3 w-3/4 rounded bg-zinc-700/60"></div>
								<div class="h-2 w-1/2 rounded bg-zinc-700/40"></div>
							</div>
						{/each}
					</div>
				{:else if error}
					<!-- Error or No Results State -->
					<div class="flex flex-col items-center justify-center px-4 py-10 text-center">
						<div
							class="mb-3 rounded-full border border-amber-500/20 bg-amber-500/10 p-3 text-amber-400"
						>
							<AlertCircle size={24} />
						</div>
						<h4 class="text-sm font-semibold text-zinc-200">{error}</h4>
						<p class="mt-1.5 max-w-md text-xs text-zinc-400">
							You can edit the query above to search with different keywords, or switch to "Direct
							Image URL" to paste an image link.
						</p>
						<button
							type="button"
							class="mt-4 cursor-pointer rounded-lg border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20 hover:text-blue-300"
							onclick={() => (activeTab = 'url')}
						>
							Paste Direct Image URL Instead
						</button>
					</div>
				{:else if results.length > 0}
					<!-- Candidate Results Grid -->
					<div class="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
						{#each results as item (item.id)}
							<button
								type="button"
								class="group relative flex aspect-square cursor-pointer flex-col justify-end overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-left shadow-md transition-all hover:border-blue-500 hover:ring-2 hover:ring-blue-500/50"
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
									class="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2"
								>
									<p
										class="truncate text-[11px] leading-tight font-medium text-white/95 drop-shadow-sm"
									>
										{item.title}
									</p>
									{#if item.sourceUrl}
										<div class="mt-0.5 flex items-center gap-1 truncate text-[9px] text-zinc-400">
											<ExternalLink size={9} />
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
				class="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 py-2.5 text-[11px] text-zinc-500"
			>
				<span>Powered by Google Images & Web Search</span>
				<span>Press Escape to close</span>
			</div>
		</div>
	</div>
{/if}
