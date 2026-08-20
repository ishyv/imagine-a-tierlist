<script>
	import { Plus, Sparkles, Loader2, Library } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { buildSearchQuery } from '#lib/services/imageSearch.js';
	import { fetchDisambiguation } from '#lib/services/ai.js';
	import ImagePicker from './ImagePicker.svelte';
	import BulkAddModal from './BulkAddModal.svelte';
	import AiSuggestionsBar from './AiSuggestionsBar.svelte';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

	let inputQuery = $state('');
	let isRefining = $state(false);
	let pickerOpen = $state(false);
	let pickerQuery = $state('');
	let pickerItemName = $state('');
	let bulkModalOpen = $state(false);
	/** @type {HTMLInputElement | null} */
	let searchInput = $state(null);

	/**
	 * @param {SubmitEvent} e
	 */
	async function handleSubmit(e) {
		e.preventDefault();
		const name = inputQuery.trim();
		if (!name) return;

		pickerItemName = name;
		pickerQuery = buildSearchQuery(name, board.context);
		pickerOpen = true;
	}

	/**
	 * Disambiguates and improves the query using AI
	 */
	async function handleSmartRefine() {
		const name = inputQuery.trim();
		if (!name || isRefining) return;

		isRefining = true;
		const refined = await fetchDisambiguation(name, board.context);
		isRefining = false;

		if (refined) {
			inputQuery = refined.canonicalName || name;
			pickerItemName = refined.canonicalName || name;
			pickerQuery = refined.searchQuery || buildSearchQuery(name, board.context);
			pickerOpen = true;
		}
	}

	/**
	 * @param {{ name: string; imageUrl: string; sourceUrl?: string }} result
	 */
	function handleCardSelected(result) {
		board.addItem(result.name, result.imageUrl, result.sourceUrl);

		// Automatically index into global card stash
		cardStash.addCard({
			name: result.name,
			imageUrl: result.imageUrl,
			sourceUrl: result.sourceUrl,
			context: board.context
		});

		inputQuery = '';
		pickerOpen = false;
	}

	/**
	 * Direct creation without image
	 */
	function handleAddDirect() {
		const name = inputQuery.trim();
		if (!name) return;

		board.addItem(name, '');
		inputQuery = '';
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleWindowKeydown(e) {
		// '/' shortcut to quickly focus command input when not in another input
		if (
			e.key === '/' &&
			document.activeElement?.tagName !== 'INPUT' &&
			document.activeElement?.tagName !== 'TEXTAREA'
		) {
			e.preventDefault();
			searchInput?.focus();
		}
	}
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<section
	class="mx-auto w-full max-w-6xl space-y-3 {themeStore.current === 'hyv'
		? 'font-mono text-xs'
		: 'font-sans text-sm'}"
>
	<!-- Command Ingress Search Bar -->
	<form onsubmit={handleSubmit} class="relative flex items-center">
		<!-- Inner Frame -->
		<div
			class="shadow-card relative flex flex-1 items-center border border-line bg-bg-surface p-1 transition-all duration-200 focus-within:border-accent {themeStore.current ===
			'hyv'
				? 'focus-within:shadow-[0_0_24px_rgba(199,156,87,0.18)]'
				: 'rounded-xl border-zinc-700 bg-zinc-900 focus-within:border-blue-500'}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={10} color="var(--line)" />
			{/if}

			<!-- Command Prompt Indicator -->
			{#if themeStore.current === 'hyv'}
				<span class="pr-2 pl-3 font-mono text-sm font-semibold text-accent select-none">&gt;</span>
			{:else}
				<span class="pr-1 pl-3 font-sans text-base font-semibold text-zinc-500 select-none">🔍</span
				>
			{/if}

			<input
				bind:this={searchInput}
				type="text"
				bind:value={inputQuery}
				placeholder={themeStore.current === 'hyv'
					? 'query entity to generate card (e.g. jinx, ferrari f40, hollow knight)...'
					: 'Type any item name to search image (e.g. Pikachu, Dark Souls, Pizza)...'}
				class="w-full bg-transparent py-2.5 pr-2 {themeStore.current === 'hyv'
					? 'font-mono text-xs'
					: 'font-sans text-sm'} text-text placeholder:text-muted-strong focus:outline-none"
			/>

			<!-- Key shortcut hint -->
			{#if !inputQuery}
				<div class="mr-2 hidden items-center text-[10px] text-muted-strong sm:flex">
					<kbd
						class="border border-line bg-bg px-1.5 py-0.5 {themeStore.current === 'classic'
							? 'rounded-md text-zinc-400'
							: ''}">/</kbd
					>
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="flex items-center gap-1.5 pr-1">
				<!-- Smart AI Refine Button -->
				<button
					type="button"
					disabled={isRefining || !inputQuery.trim()}
					class="hidden cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-xs transition-all duration-150 disabled:pointer-events-none disabled:opacity-30 sm:flex {themeStore.current ===
					'hyv'
						? 'border-accent/40 bg-bg text-accent hover:border-accent hover:bg-accent/15 hover:text-accent-strong'
						: 'rounded-lg border-amber-500/30 bg-amber-500/10 font-semibold text-amber-300 hover:bg-amber-500/20'}"
					onclick={handleSmartRefine}
					title="Disambiguate entity and refine search query with AI"
				>
					{#if isRefining}
						<Loader2
							size={12}
							class="animate-spin {themeStore.current === 'hyv' ? 'text-accent' : 'text-amber-400'}"
						/>
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Refining...</span>
					{:else}
						<Sparkles
							size={12}
							class={themeStore.current === 'hyv' ? 'text-accent' : 'text-amber-400'}
						/>
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Refine</span>
					{/if}
				</button>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={!inputQuery.trim()}
					class="flex cursor-pointer items-center gap-1 border px-3.5 py-1.5 text-xs font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
					'hyv'
						? 'border-accent bg-accent/20 text-accent hover:border-accent-strong hover:bg-accent/30 hover:text-accent-strong'
						: 'rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500'}"
				>
					<Plus size={13} />
					<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
						{themeStore.current === 'hyv' ? 'Deploy' : 'Add Card'}
					</span>
				</button>
			</div>
		</div>

		<!-- Direct Text Only Add (Small fallback) -->
		{#if inputQuery.trim()}
			<button
				type="button"
				class="ml-2 cursor-pointer border border-line bg-bg-surface px-2.5 py-2 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-text sm:text-xs {themeStore.current ===
				'classic'
					? 'rounded-lg border-zinc-700 bg-zinc-800'
					: ''}"
				onclick={handleAddDirect}
				title="Add card as text-only badge without searching images"
			>
				Text Only
			</button>
		{/if}

		<!-- Bulk Add Modal Trigger -->
		<button
			type="button"
			class="ml-2 flex shrink-0 cursor-pointer items-center gap-1 border border-line bg-bg-surface px-3 py-2 text-xs text-text shadow-xs transition-all duration-150 hover:border-accent hover:text-accent-strong {themeStore.current ===
			'classic'
				? 'rounded-xl border-zinc-700 bg-zinc-900 font-medium'
				: ''}"
			onclick={() => (bulkModalOpen = true)}
			title="Bulk generate cards using AI entity lists"
		>
			<Library size={12} class={themeStore.current === 'hyv' ? 'text-accent' : 'text-purple-400'} />
			<span class="hidden sm:inline {themeStore.current === 'hyv' ? 'uppercase' : ''}">
				{themeStore.current === 'hyv' ? 'BULK INGRESS' : 'Bulk Add'}
			</span>
			<span class="sm:hidden {themeStore.current === 'hyv' ? 'uppercase' : ''}">Bulk</span>
		</button>
	</form>

	<!-- AI Next-Item Suggestions -->
	<AiSuggestionsBar />
</section>

<!-- Image Picker Modal -->
<ImagePicker
	open={pickerOpen}
	initialQuery={pickerQuery}
	itemName={pickerItemName}
	mode="create"
	onselect={handleCardSelected}
	onclose={() => (pickerOpen = false)}
/>

<!-- Bulk Add Modal -->
<BulkAddModal open={bulkModalOpen} onclose={() => (bulkModalOpen = false)} />
