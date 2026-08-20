<script>
	import { Search, Plus, Sparkles, Loader2, Library } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';
	import { buildSearchQuery } from '#lib/services/imageSearch.js';
	import { fetchDisambiguation } from '#lib/services/ai.js';
	import ImagePicker from './ImagePicker.svelte';
	import BulkAddModal from './BulkAddModal.svelte';
	import AiSuggestionsBar from './AiSuggestionsBar.svelte';

	let itemName = $state('');
	let pickerOpen = $state(false);
	let pickerQuery = $state('');
	let activeItemName = $state('');
	let isBulkModalOpen = $state(false);
	let isDisambiguating = $state(false);
	/** @type {HTMLInputElement | null} */
	let inputEl = $state(null);

	const matchingStashCards = $derived.by(() => {
		return cardStash.findMatches(itemName, 3);
	});

	/**
	 * @param {SubmitEvent} [e]
	 */
	function handleSubmit(e) {
		e?.preventDefault();
		const trimmed = itemName.trim();
		if (!trimmed) return;

		activeItemName = trimmed;
		pickerQuery = buildSearchQuery(trimmed, board.context);
		pickerOpen = true;
	}

	/**
	 * Smart Refine / Disambiguation using AI
	 */
	async function handleSmartRefine() {
		const trimmed = itemName.trim();
		if (!trimmed || isDisambiguating) return;

		isDisambiguating = true;
		const result = await fetchDisambiguation(trimmed, board.context);
		isDisambiguating = false;

		if (result && result.canonicalName) {
			itemName = result.canonicalName;
			activeItemName = result.canonicalName;
			pickerQuery = result.searchQuery || buildSearchQuery(result.canonicalName, board.context);
			pickerOpen = true;
		}
	}

	/**
	 * @param {import('#lib/stores/cardStash.svelte.js').StashCard} stashCard
	 */
	function handleAddFromStash(stashCard) {
		board.addCardFromStash(stashCard);
		itemName = '';
		setTimeout(() => {
			inputEl?.focus();
		}, 50);
	}

	/**
	 * @param {{ name: string; imageUrl: string; sourceUrl?: string }} result
	 */
	function handleImageSelected(result) {
		board.addItem(result.name, result.imageUrl, result.sourceUrl);

		// Clear input and refocus for seamless multi-item creation
		itemName = '';
		pickerOpen = false;
		setTimeout(() => {
			inputEl?.focus();
		}, 50);
	}

	function handlePickerClose() {
		pickerOpen = false;
		setTimeout(() => {
			inputEl?.focus();
		}, 50);
	}

	/**
	 * Global shortcut: Pressing '/' focuses search input
	 * @param {KeyboardEvent} e
	 */
	function handleWindowKeydown(e) {
		if (
			e.key === '/' &&
			!pickerOpen &&
			!isBulkModalOpen &&
			document.activeElement?.tagName !== 'INPUT' &&
			document.activeElement?.tagName !== 'TEXTAREA'
		) {
			e.preventDefault();
			inputEl?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class="mx-auto my-6 w-full max-w-2xl">
	<form
		onsubmit={handleSubmit}
		class="relative flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1.5 shadow-xl backdrop-blur-md transition-all focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20"
	>
		<div class="relative flex flex-1 items-center">
			<Search size={18} class="pointer-events-none absolute left-3.5 text-zinc-400" />
			<input
				bind:this={inputEl}
				type="text"
				bind:value={itemName}
				placeholder={board.context
					? `Add something (e.g. "Ahri" in ${board.context})...`
					: 'Add something to tier list (e.g. "LeBlanc")...'}
				class="w-full bg-transparent py-2 pr-9 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-hidden"
			/>

			{#if itemName.trim()}
				<button
					type="button"
					disabled={isDisambiguating}
					class="absolute right-2.5 cursor-pointer rounded-md p-1 text-purple-400 transition-colors hover:bg-purple-500/20 hover:text-purple-300 disabled:opacity-40"
					onclick={handleSmartRefine}
					title="Smart Refine with AI: Fix typos & find exact entity"
					aria-label="Smart Refine with AI"
				>
					{#if isDisambiguating}
						<Loader2 size={15} class="animate-spin" />
					{:else}
						<Sparkles size={15} />
					{/if}
				</button>
			{/if}
		</div>

		<!-- Add Card Button -->
		<button
			type="submit"
			disabled={!itemName.trim()}
			class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
		>
			<Plus size={14} />
			<span>Add Card</span>
		</button>

		<!-- Bulk Add with AI Button -->
		<button
			type="button"
			class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20 hover:text-purple-200"
			onclick={() => (isBulkModalOpen = true)}
			title="Generate dozens of items at once with AI"
		>
			<Sparkles size={14} class="text-purple-400" />
			<span class="hidden sm:inline">Bulk Add</span>
			<span class="sm:hidden">Bulk</span>
		</button>
	</form>

	<!-- Quick-add from Global Card Stash if matches found -->
	{#if matchingStashCards.length > 0}
		<div
			class="animate-in fade-in mt-2 flex flex-wrap items-center gap-1.5 px-1 text-xs duration-150"
		>
			<span class="flex items-center gap-1 text-[11px] font-medium text-purple-400">
				<Library size={12} />
				<span>In Stash:</span>
			</span>
			{#each matchingStashCards as stashCard (stashCard.id)}
				<button
					type="button"
					class="flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-500/40 bg-purple-950/40 px-2 py-0.5 text-[11px] text-purple-200 transition-all hover:border-purple-400 hover:bg-purple-900/60"
					onclick={() => handleAddFromStash(stashCard)}
					title="Click to add immediately from your stash without searching"
				>
					<img
						src={stashCard.thumbnailUrl || stashCard.imageUrl}
						alt=""
						referrerpolicy="no-referrer"
						class="h-3.5 w-3.5 rounded-full object-cover"
					/>
					<span>{stashCard.name}</span>
					<Plus size={10} class="text-purple-400" />
				</button>
			{/each}
		</div>
	{/if}

	{#if board.context}
		<p
			class="mt-1.5 flex items-center justify-center gap-1 px-2 text-center text-[11px] text-zinc-400 sm:justify-start sm:text-left"
		>
			<span class="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
			<span
				>Searching with context: <strong class="font-medium text-zinc-300">{board.context}</strong
				></span
			>
		</p>
	{/if}

	<!-- Dynamic AI Theme Suggestions -->
	<AiSuggestionsBar />
</div>

<ImagePicker
	open={pickerOpen}
	initialQuery={pickerQuery}
	itemName={activeItemName}
	mode="create"
	onselect={handleImageSelected}
	onclose={handlePickerClose}
/>

<BulkAddModal open={isBulkModalOpen} onclose={() => (isBulkModalOpen = false)} />
