<script>
	import { Sparkles, RefreshCw, Plus, Loader2, Check } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
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
			}, 1000);
		} catch (e) {
			console.error('Failed to add suggestion:', e);
			delete itemStatus[itemName];
		}
	}
</script>

{#if suggestions.length > 0 || isLoading}
	<div
		class="mt-3 flex flex-wrap items-center gap-1.5 {themeStore.current === 'hyv'
			? 'font-mono text-[11px]'
			: 'font-sans text-xs'}"
	>
		<div
			class="flex items-center gap-1 text-muted-strong {themeStore.current === 'hyv'
				? 'tracking-meta uppercase'
				: 'font-medium'}"
		>
			<Sparkles size={11} class={themeStore.current === 'hyv' ? 'text-accent' : 'text-amber-400'} />
			<span>{themeStore.current === 'hyv' ? 'SUGGESTED:' : 'Suggestions:'}</span>
		</div>

		{#if isLoading && suggestions.length === 0}
			<div class="flex items-center gap-1.5 text-muted">
				<Loader2
					size={11}
					class="animate-spin {themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'}"
				/>
				<span>querying candidates for "{board.context || board.title}"...</span>
			</div>
		{:else}
			{#each suggestions as item (item)}
				<button
					type="button"
					disabled={itemStatus[item] === 'loading' || itemStatus[item] === 'added'}
					class="group flex cursor-pointer items-center gap-1 border px-2 py-0.5 transition-all duration-150 {themeStore.current ===
					'classic'
						? 'rounded-full border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700'
						: 'border-line bg-bg-elev text-text-soft hover:border-accent hover:text-accent-strong'} {itemStatus[
						item
					] === 'added'
						? 'border-signal bg-signal/10 text-signal'
						: ''} disabled:pointer-events-none"
					onclick={() => handleAddSuggestion(item)}
					title="Click to generate card immediately"
				>
					{#if itemStatus[item] === 'loading'}
						<Loader2
							size={9}
							class="animate-spin {themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'}"
						/>
					{:else if itemStatus[item] === 'added'}
						<Check size={9} class="text-signal" />
					{:else}
						<Plus size={9} class="text-muted group-hover:text-accent" />
					{/if}
					<span class={themeStore.current === 'hyv' ? 'lowercase' : ''}>{item}</span>
				</button>
			{/each}

			<button
				type="button"
				disabled={isLoading}
				class="cursor-pointer border border-transparent p-1 text-muted transition-colors hover:text-accent disabled:opacity-40 {themeStore.current ===
				'classic'
					? 'rounded-full hover:bg-zinc-800'
					: ''}"
				onclick={loadSuggestions}
				title="Get more suggestions"
				aria-label="Refresh suggestions"
			>
				<RefreshCw size={10} class={isLoading ? 'animate-spin' : ''} />
			</button>
		{/if}
	</div>
{/if}
