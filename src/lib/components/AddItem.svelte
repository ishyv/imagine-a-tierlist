<script>
	import { Search, Plus } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { buildSearchQuery } from '#lib/services/imageSearch.js';
	import ImagePicker from './ImagePicker.svelte';

	let itemName = $state('');
	let pickerOpen = $state(false);
	let pickerQuery = $state('');
	let activeItemName = $state('');
	/** @type {HTMLInputElement | null} */
	let inputEl = $state(null);

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
</script>

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
				class="w-full bg-transparent py-2 pr-3 pl-10 text-sm text-white placeholder-zinc-500 focus:outline-none"
			/>
		</div>

		<button
			type="submit"
			disabled={!itemName.trim()}
			class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
		>
			<Plus size={14} />
			<span>Add Card</span>
		</button>
	</form>

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
</div>

<ImagePicker
	bind:open={pickerOpen}
	initialQuery={pickerQuery}
	itemName={activeItemName}
	mode="create"
	onselect={handleImageSelected}
	onclose={handlePickerClose}
/>
