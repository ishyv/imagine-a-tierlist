<script>
	import {
		ImageOff,
		MoreVertical,
		Pencil,
		Trash2,
		RefreshCw,
		ExternalLink,
		X
	} from 'lucide-svelte';
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

	// Reset image error state whenever image URL updates
	$effect(() => {
		if (item.imageUrl) {
			imageError = false;
		}
	});

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
	class="group relative flex h-24 w-24 cursor-grab flex-col justify-end rounded-md border border-zinc-800/80 bg-zinc-950 shadow-md transition-transform select-none focus-within:ring-2 focus-within:ring-blue-500/80 hover:scale-[1.02] hover:border-zinc-600 active:cursor-grabbing sm:h-26 sm:w-26 md:h-28 md:w-28 {showMenu
		? 'z-40'
		: 'z-0'}"
	role="group"
	aria-label={item.name}
>
	<!-- Inner Image Container with rounded overflow hidden -->
	<div class="absolute inset-0 overflow-hidden rounded-md">
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
				decoding="async"
				referrerpolicy="no-referrer"
				class="pointer-events-none absolute inset-0 h-full w-full object-cover"
				onerror={handleImageError}
				onload={handleImageLoad}
			/>
		{/if}

		<!-- Bottom Name Label (unless renaming) -->
		{#if !isRenaming}
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-1.5 py-1"
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

	<!-- Top Action Buttons (Hover / Focus visible) -->
	<div
		class="absolute inset-x-1 top-1 z-20 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 {showMenu
			? 'opacity-100'
			: ''}"
	>
		<!-- Menu Options Trigger -->
		<button
			type="button"
			class="cursor-pointer rounded-md bg-black/75 p-1 text-zinc-300 shadow-md backdrop-blur-xs transition-colors hover:bg-black hover:text-white"
			onclick={toggleMenu}
			title="Card options"
			aria-label="Card options"
		>
			<MoreVertical size={13} />
		</button>

		<!-- Direct 1-Click Delete Button -->
		<button
			type="button"
			class="cursor-pointer rounded-md bg-black/75 p-1 text-zinc-400 shadow-md backdrop-blur-xs transition-colors hover:bg-red-600 hover:text-white"
			onclick={handleDelete}
			title="Delete card"
			aria-label="Delete card"
		>
			<X size={13} />
		</button>
	</div>

	<!-- Floating Context Menu (Renders above and outside card boundaries) -->
	{#if showMenu}
		<div
			class="animate-in fade-in zoom-in-95 absolute -top-1 left-full z-50 ml-1.5 w-40 rounded-xl border border-zinc-700 bg-zinc-900/98 p-1 text-xs text-zinc-200 shadow-2xl backdrop-blur-md duration-100 sm:top-8 sm:right-0 sm:left-auto sm:ml-0"
			role="menu"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div
				class="truncate border-b border-zinc-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-400"
			>
				{item.name}
			</div>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-800 hover:text-white"
				onclick={startRename}
			>
				<Pencil size={12} class="text-blue-400" />
				<span>Rename Card</span>
			</button>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-zinc-800 hover:text-white"
				onclick={handleChangeImage}
			>
				<RefreshCw size={12} class="text-purple-400" />
				<span>Change Image</span>
			</button>

			{#if item.sourceUrl}
				<a
					href={item.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
					onclick={() => (showMenu = false)}
				>
					<ExternalLink size={12} class="text-zinc-400" />
					<span>View Source</span>
				</a>
			{/if}

			<div class="my-1 border-t border-zinc-800/80"></div>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
				onclick={handleDelete}
			>
				<Trash2 size={12} />
				<span>Delete Card</span>
			</button>
		</div>
	{/if}

	<!-- Inline Rename Input Overlay -->
	{#if isRenaming}
		<div
			class="absolute inset-x-0 bottom-0 z-30 flex gap-1 bg-black/95 p-1.5 backdrop-blur-md"
			role="none"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<input
				bind:this={renameInput}
				bind:value={editName}
				placeholder="Card name..."
				class="w-full rounded border border-blue-500 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-white focus:outline-hidden"
				onkeydown={(e) => {
					if (e.key === 'Enter') saveRename(e);
					if (e.key === 'Escape') cancelRename(e);
				}}
				onblur={saveRename}
			/>
		</div>
	{/if}
</div>
