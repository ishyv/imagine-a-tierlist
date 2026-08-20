<script>
	import { ImageOff, MoreVertical, Pencil, Trash2, RefreshCw, ExternalLink } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';

	/**
	 * @type {{
	 *   item: import('#lib/types.js').Item;
	 *   onchangeimage?: (item: import('#lib/types.js').Item) => void;
	 * }}
	 */
	let { item, onchangeimage } = $props();

	let imageError = $state(false);
	let showMenu = $state(false);
	let isRenaming = $state(false);
	let editName = $state('');
	/** @type {HTMLInputElement | null} */
	let renameInput = $state(null);

	function handleImageError() {
		imageError = true;
	}

	function handleImageLoad() {
		imageError = false;
	}

	/**
	 * @param {MouseEvent} e
	 */
	function toggleMenu(e) {
		e.stopPropagation();
		e.preventDefault();
		showMenu = !showMenu;
	}

	/**
	 * @param {MouseEvent} e
	 */
	function startRename(e) {
		e.stopPropagation();
		showMenu = false;
		editName = item.name;
		isRenaming = true;
		setTimeout(() => renameInput?.focus(), 50);
	}

	/**
	 * @param {Event} [e]
	 */
	function saveRename(e) {
		e?.stopPropagation();
		if (editName.trim()) {
			board.updateItem(item.id, { name: editName.trim() });
		}
		isRenaming = false;
	}

	/**
	 * @param {Event} [e]
	 */
	function cancelRename(e) {
		e?.stopPropagation();
		isRenaming = false;
		editName = '';
	}

	/**
	 * @param {MouseEvent} e
	 */
	function handleDelete(e) {
		e.stopPropagation();
		showMenu = false;
		board.deleteItem(item.id);
	}

	/**
	 * @param {MouseEvent} e
	 */
	function handleChangeImage(e) {
		e.stopPropagation();
		showMenu = false;
		onchangeimage?.(item);
	}

	function handleWindowClick() {
		if (showMenu) showMenu = false;
	}
</script>

<svelte:window onclick={handleWindowClick} />

<div
	class="group relative flex h-24 w-24 cursor-grab flex-col justify-end overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950 shadow-md transition-transform select-none hover:scale-[1.02] hover:border-zinc-700 active:cursor-grabbing sm:h-26 sm:w-26 md:h-28 md:w-28"
	role="group"
	aria-label={item.name}
>
	<!-- Image or Fallback -->
	{#if imageError || !item.imageUrl}
		<div
			class="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-2 text-center text-zinc-400"
		>
			<ImageOff size={20} class="mb-1 text-zinc-500" />
			<span class="line-clamp-2 text-[10px] leading-tight text-zinc-400">{item.name}</span>
		</div>
	{:else}
		<img
			src={item.imageUrl}
			alt={item.name}
			loading="lazy"
			class="pointer-events-none absolute inset-0 h-full w-full object-cover"
			onerror={handleImageError}
			onload={handleImageLoad}
		/>
	{/if}

	<!-- Action Trigger Button (Hover / Tap) -->
	<button
		type="button"
		class="absolute top-1 right-1 z-20 cursor-pointer rounded bg-black/60 p-1 text-zinc-300 opacity-0 backdrop-blur-xs transition-opacity group-hover:opacity-100 hover:bg-black/90 hover:text-white focus:opacity-100"
		onclick={toggleMenu}
		aria-label="Item options"
	>
		<MoreVertical size={14} />
	</button>

	<!-- Context Menu Dropdown -->
	{#if showMenu}
		<div
			class="animate-in fade-in zoom-in-95 absolute top-7 right-1 z-30 w-36 rounded-lg border border-zinc-700 bg-zinc-900/95 py-1 text-xs text-zinc-200 shadow-xl backdrop-blur-md duration-100"
			role="menu"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-800"
				onclick={startRename}
			>
				<Pencil size={12} class="text-zinc-400" />
				<span>Rename</span>
			</button>
			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-800"
				onclick={handleChangeImage}
			>
				<RefreshCw size={12} class="text-zinc-400" />
				<span>Change Image</span>
			</button>
			{#if item.sourceUrl}
				<a
					href={item.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-zinc-300 transition-colors hover:bg-zinc-800"
					onclick={() => (showMenu = false)}
				>
					<ExternalLink size={12} class="text-zinc-400" />
					<span>Source</span>
				</a>
			{/if}
			<div class="my-1 border-t border-zinc-800"></div>
			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2.5 py-1.5 text-left text-red-400 transition-colors hover:bg-red-500/15"
				onclick={handleDelete}
			>
				<Trash2 size={12} />
				<span>Delete</span>
			</button>
		</div>
	{/if}

	<!-- Inline Rename Input or Bottom Label -->
	{#if isRenaming}
		<div
			class="absolute inset-x-0 bottom-0 z-20 flex gap-1 bg-black/90 p-1 backdrop-blur-xs"
			role="none"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<input
				bind:this={renameInput}
				bind:value={editName}
				class="w-full rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-[11px] text-white focus:border-blue-500 focus:outline-none"
				onkeydown={(e) => {
					if (e.key === 'Enter') saveRename(e);
					if (e.key === 'Escape') cancelRename(e);
				}}
			/>
		</div>
	{:else}
		<div
			class="pointer-events-none relative z-10 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent px-1.5 py-1"
		>
			<p
				class="truncate text-center text-[11px] leading-tight font-medium tracking-tight text-white/95 drop-shadow-md"
				title={item.name}
			>
				{item.name}
			</p>
		</div>
	{/if}
</div>
