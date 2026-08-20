<script>
	import { Sparkles, RefreshCw, Plus, Loader2, Check } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { fetchSuggestions } from '#lib/services/ai.js';
	import { searchImages } from '#lib/services/imageSearch.js';

	/** @type {string[]} */
	let suggestions = $state([]);
	let isLoading = $state(false);
	/** @type {Record<string, 'loading' | 'added' | undefined>} */
	let itemStatus = $state({});
	let lastLoadedKey = $state('');

	// Refresh suggestions when title or context changes significantly
	$effect(() => {
		const currentKey = `${board.title}::${board.context}`.trim();
		if (currentKey && currentKey !== 'Tier List::' && currentKey !== lastLoadedKey && !isLoading) {
			const timer = setTimeout(() => {
				loadSuggestions();
			}, 600);
			return () => clearTimeout(timer);
		}
	});

	async function loadSuggestions() {
		const currentTitle = board.title.trim();
		const currentContext = board.context.trim();
		if (!currentTitle && !currentContext) return;

		isLoading = true;
		lastLoadedKey = `${board.title}::${board.context}`.trim();

		const existingNames = board.items.map((i) => i.name);
		const res = await fetchSuggestions(currentTitle, currentContext, existingNames, 8);

		isLoading = false;
		if (res.suggestions && res.suggestions.length > 0) {
			suggestions = res.suggestions;
		}
	}

	/**
	 * Adds a suggested item to the board with one click
	 * @param {string} itemName
	 */
	async function handleAddSuggestion(itemName) {
		if (itemStatus[itemName] === 'loading' || itemStatus[itemName] === 'added') return;

		itemStatus[itemName] = 'loading';

		try {
			const searchQuery = board.context
				? `${itemName} ${board.context} official art`
				: `${itemName} official art`;

			const searchRes = await searchImages(searchQuery);
			const topImg = searchRes.results?.[0];

			board.addItem(itemName, topImg?.imageUrl || '', topImg?.sourceUrl || undefined);
			itemStatus[itemName] = 'added';

			// Remove chip after brief animation
			setTimeout(() => {
				suggestions = suggestions.filter((s) => s !== itemName);
			}, 1200);
		} catch (e) {
			console.error('Failed to add suggestion:', e);
			delete itemStatus[itemName];
		}
	}
</script>

{#if suggestions.length > 0 || isLoading}
	<div class="mt-3 flex flex-wrap items-center gap-1.5 px-1 py-1 text-xs">
		<div class="flex items-center gap-1 text-[11px] font-medium text-purple-400">
			<Sparkles size={12} class="animate-pulse" />
			<span>Ideas:</span>
		</div>

		{#if isLoading && suggestions.length === 0}
			<div class="flex items-center gap-1.5 text-[11px] text-zinc-500">
				<Loader2 size={12} class="animate-spin text-purple-400" />
				<span>Finding suggestions for "{board.context || board.title}"...</span>
			</div>
		{:else}
			{#each suggestions as item (item)}
				<button
					type="button"
					disabled={itemStatus[item] === 'loading' || itemStatus[item] === 'added'}
					class="group flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition-all {itemStatus[
						item
					] === 'added'
						? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
						: 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:border-purple-500/60 hover:bg-purple-950/30 hover:text-purple-200'} disabled:pointer-events-none"
					onclick={() => handleAddSuggestion(item)}
					title="Click to instantly add to unranked cards"
				>
					{#if itemStatus[item] === 'loading'}
						<Loader2 size={10} class="animate-spin text-purple-400" />
					{:else if itemStatus[item] === 'added'}
						<Check size={10} class="text-emerald-400" />
					{:else}
						<Plus size={10} class="text-zinc-500 group-hover:text-purple-300" />
					{/if}
					<span>{item}</span>
				</button>
			{/each}

			<button
				type="button"
				disabled={isLoading}
				class="cursor-pointer rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-purple-300 disabled:opacity-40"
				onclick={loadSuggestions}
				title="Get more suggestions"
				aria-label="Refresh suggestions"
			>
				<RefreshCw size={11} class={isLoading ? 'animate-spin' : ''} />
			</button>
		{/if}
	</div>
{/if}
