<script>
	import {
		ImageOff,
		MoreVertical,
		Pencil,
		Trash2,
		RefreshCw,
		ExternalLink,
		X,
		Maximize2
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

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

	// 3D Physical Tilt & Specular Tracking (Hyv theme)
	let cardEl = $state(/** @type {HTMLDivElement | null} */ (null));
	let rotateX = $state(0);
	let rotateY = $state(0);
	let mouseX = $state(50);
	let mouseY = $state(50);
	let isHovered = $state(false);

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
	 * @param {PointerEvent} e
	 */
	function handlePointerMove(e) {
		if (themeStore.current !== 'hyv' || !cardEl) return;
		const rect = cardEl.getBoundingClientRect();
		const x = (e.clientX - rect.left) / rect.width;
		const y = (e.clientY - rect.top) / rect.height;

		mouseX = Math.round(x * 100);
		mouseY = Math.round(y * 100);

		// Subtle 3D tilt (max 12 degrees)
		rotateX = Number(((0.5 - y) * 12).toFixed(2));
		rotateY = Number(((x - 0.5) * 12).toFixed(2));
		isHovered = true;
	}

	function handlePointerLeave() {
		rotateX = 0;
		rotateY = 0;
		isHovered = false;
	}

	/**
	 * @param {MouseEvent} e
	 */
	function handleCardClick(e) {
		const target = /** @type {HTMLElement | null} */ (e.target);
		if (
			target?.closest('button') ||
			target?.closest('input') ||
			target?.closest('a') ||
			isRenaming
		) {
			return;
		}
		board.openZoom(item);
	}

	/**
	 * @param {MouseEvent} e
	 */
	function toggleMenu(e) {
		e.stopPropagation();
		showMenu = !showMenu;
	}

	/**
	 * @param {MouseEvent} e
	 */
	function startRename(e) {
		e.stopPropagation();
		editName = item.name;
		isRenaming = true;
		showMenu = false;
		setTimeout(() => {
			renameInput?.focus();
			renameInput?.select();
		}, 20);
	}

	/**
	 * @param {Event} e
	 */
	function saveRename(e) {
		e.stopPropagation();
		if (!isRenaming) return;
		const trimmed = editName.trim();
		if (trimmed && trimmed !== item.name) {
			board.updateItem(item.id, { name: trimmed });
		}
		isRenaming = false;
		editName = '';
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function cancelRename(e) {
		e.stopPropagation();
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

	// Micro serial hash from item id
	const serial = $derived(
		(item.id || '')
			.replace(/[^a-zA-Z0-9]/g, '')
			.slice(-3)
			.toUpperCase() || '01'
	);
</script>

<svelte:window onclick={handleWindowClick} />

<div
	bind:this={cardEl}
	class="group relative h-28 w-28 cursor-grab transition-all duration-200 select-none sm:h-30 sm:w-30 md:h-32 md:w-32 {showMenu
		? 'z-40'
		: 'z-0'} {themeStore.current === 'classic' ? 'hover:-translate-y-1 hover:shadow-xl' : ''}"
	style={themeStore.current === 'hyv' ? 'perspective: 1000px;' : ''}
	onpointermove={handlePointerMove}
	onpointerleave={handlePointerLeave}
	role="group"
	aria-label={item.name}
>
	<!-- Inner Card Chassis -->
	<div
		class="relative flex h-full w-full cursor-pointer flex-col justify-between overflow-hidden border transition-all duration-150 ease-out active:cursor-grabbing {themeStore.current ===
		'hyv'
			? 'border-line bg-bg-surface'
			: 'rounded-lg border-zinc-800 bg-zinc-900 shadow-md'}"
		style={themeStore.current === 'hyv'
			? `transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${isHovered ? 'translateZ(8px)' : 'translateZ(0px)'}; box-shadow: ${isHovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)'}; border-color: ${isHovered || showMenu ? 'var(--line-strong)' : 'var(--line)'};`
			: ''}
		onclick={handleCardClick}
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				board.openZoom(item);
			}
		}}
	>
		<!-- Specular Dynamic Gleam Overlay in Hyv mode -->
		{#if themeStore.current === 'hyv' && isHovered}
			<div
				class="pointer-events-none absolute inset-0 z-30 transition-opacity duration-200"
				style="
					background: radial-gradient(circle at {mouseX}% {mouseY}%, rgba(255, 240, 200, 0.18) 0%, transparent 65%);
				"
			></div>
		{/if}

		<!-- Top Inset Specular Bevel Line in Hyv mode -->
		{#if themeStore.current === 'hyv'}
			<div
				class="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-[rgba(255,245,220,0.35)] to-transparent"
			></div>
			<!-- Corner Framing Accents -->
			<CornerBrackets size={8} color={isHovered ? 'var(--accent)' : 'var(--line)'} />
		{/if}

		<!-- Top Tactical HUD / Actions Header -->
		<div
			class="relative z-20 flex items-center justify-between px-2 pt-1.5 {themeStore.current ===
			'hyv'
				? 'tracking-meta font-mono text-[8px] text-muted-strong'
				: 'text-[10px]'}"
		>
			{#if themeStore.current === 'hyv'}
				<span class="flex items-center gap-1 font-semibold text-accent/80">
					<span class="inline-block h-1 w-1 bg-accent"></span>
					<span>#{serial}</span>
				</span>
			{:else}
				<span></span>
			{/if}

			<!-- Top Action Buttons (Hover / Focus visible) -->
			<div
				class="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 {showMenu
					? 'opacity-100'
					: ''}"
			>
				<button
					type="button"
					class="cursor-pointer p-0.5 backdrop-blur-xs transition-colors {themeStore.current ===
					'hyv'
						? 'border border-line/60 bg-bg/90 text-muted hover:border-accent hover:text-accent-strong'
						: 'rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'}"
					onclick={(e) => {
						e.stopPropagation();
						board.openZoom(item);
					}}
					title="Inspect / Zoom entity"
					aria-label="Inspect card"
				>
					<Maximize2 size={10} />
				</button>
				<button
					type="button"
					class="cursor-pointer p-0.5 backdrop-blur-xs transition-colors {themeStore.current ===
					'hyv'
						? 'border border-line/60 bg-bg/90 text-muted hover:border-accent hover:text-accent-strong'
						: 'rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white'}"
					onclick={toggleMenu}
					title="Card options"
					aria-label="Card options"
				>
					<MoreVertical size={10} />
				</button>
				<button
					type="button"
					class="cursor-pointer p-0.5 backdrop-blur-xs transition-colors {themeStore.current ===
					'hyv'
						? 'border border-line/60 bg-bg/90 text-muted hover:border-status-fail hover:text-status-fail'
						: 'rounded-md bg-zinc-800/80 text-zinc-300 hover:bg-red-600 hover:text-white'}"
					onclick={handleDelete}
					title="Delete card"
					aria-label="Delete card"
				>
					<X size={10} />
				</button>
			</div>
		</div>

		<!-- Middle: Inset Visual Display Cradle -->
		<div
			class="relative flex-1 {themeStore.current === 'hyv' ? 'my-0.5 px-1.5' : 'px-1 pt-0.5 pb-1'}"
		>
			<div
				class="relative h-full w-full overflow-hidden {themeStore.current === 'hyv'
					? 'border border-line/50 bg-bg-cradle'
					: 'rounded-md bg-zinc-950/80'}"
			>
				{#if imageError || !item.imageUrl}
					<div
						class="absolute inset-0 flex flex-col items-center justify-center p-2 text-center text-muted"
					>
						<ImageOff size={16} class="mb-1 text-muted-strong" />
						<span
							class="line-clamp-2 {themeStore.current === 'hyv'
								? 'font-mono text-[8px] lowercase'
								: 'font-sans text-[10px]'} text-muted">{item.name}</span
						>
					</div>
				{:else}
					<img
						src={item.imageUrl}
						alt={item.name}
						loading="lazy"
						decoding="async"
						referrerpolicy="no-referrer"
						class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						onerror={handleImageError}
						onload={handleImageLoad}
					/>
				{/if}

				<!-- Subtle Inner Vignette in Hyv mode -->
				{#if themeStore.current === 'hyv'}
					<div
						class="pointer-events-none absolute inset-0 shadow-[inset_0_0_12px_rgba(0,0,0,0.65)]"
					></div>
				{/if}
			</div>
		</div>

		<!-- Bottom: Tactile Etched Nameplate -->
		{#if !isRenaming}
			<div
				class="relative z-20 px-2 py-1 backdrop-blur-sm {themeStore.current === 'hyv'
					? 'border-t border-line/80 bg-bg-surface/95'
					: 'bg-zinc-950/80'}"
			>
				<p
					class="truncate font-medium {themeStore.current === 'hyv'
						? 'font-mono text-[10px] tracking-tight text-text lowercase'
						: 'font-sans text-xs text-zinc-200'}"
					title={item.name}
				>
					{item.name}
				</p>
			</div>
		{/if}

		<!-- Inline Rename Input Overlay -->
		{#if isRenaming}
			<div
				class="absolute inset-x-0 bottom-0 z-30 flex p-1 {themeStore.current === 'hyv'
					? 'border-t border-accent bg-bg-surface'
					: 'bg-zinc-950'}"
				role="none"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
			>
				<input
					bind:this={renameInput}
					bind:value={editName}
					placeholder="name..."
					class="w-full px-1.5 py-0.5 text-[10px] text-text focus:outline-none {themeStore.current ===
					'hyv'
						? 'border border-accent bg-bg font-mono'
						: 'rounded border border-blue-500 bg-zinc-900 font-sans'}"
					onkeydown={(e) => {
						if (e.key === 'Enter') saveRename(e);
						if (e.key === 'Escape') cancelRename(e);
					}}
					onblur={saveRename}
				/>
			</div>
		{/if}
	</div>

	<!-- Floating Context Menu -->
	{#if showMenu}
		<div
			class="shadow-veil absolute -top-1 left-full z-50 ml-1.5 w-44 p-1.5 text-xs text-text sm:top-8 sm:right-0 sm:left-auto sm:ml-0 {themeStore.current ===
			'hyv'
				? 'border border-line-strong bg-bg-elev font-mono'
				: 'rounded-xl border border-zinc-800 bg-zinc-900 font-sans shadow-2xl'}"
			role="menu"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={10} color="var(--accent)" />
			{/if}

			<div
				class="truncate border-b border-line px-2 py-1 text-[10px] text-muted-strong {themeStore.current ===
				'hyv'
					? 'tracking-meta font-mono uppercase'
					: 'font-semibold'}"
			>
				{themeStore.current === 'hyv' ? `ENTITY // ${item.name}` : item.name}
			</div>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-accent transition-colors hover:bg-accent/15 hover:text-accent-strong {themeStore.current ===
				'classic'
					? 'rounded-md hover:bg-zinc-800'
					: ''}"
				onclick={() => {
					showMenu = false;
					board.openZoom(item);
				}}
			>
				<Maximize2 size={11} class="text-accent" />
				<span>{themeStore.current === 'hyv' ? 'inspect dossier' : 'Inspect Card'}</span>
			</button>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-accent/15 hover:text-accent-strong {themeStore.current ===
				'classic'
					? 'rounded-md hover:bg-zinc-800'
					: ''}"
				onclick={startRename}
			>
				<Pencil size={11} class="text-accent" />
				<span>{themeStore.current === 'hyv' ? 'rename entity' : 'Rename Card'}</span>
			</button>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left transition-colors hover:bg-signal/15 hover:text-signal-strong {themeStore.current ===
				'classic'
					? 'rounded-md hover:bg-zinc-800'
					: ''}"
				onclick={handleChangeImage}
			>
				<RefreshCw size={11} class="text-signal" />
				<span>{themeStore.current === 'hyv' ? 're-bind visual' : 'Change Image'}</span>
			</button>

			{#if item.sourceUrl}
				<a
					href={item.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-muted transition-colors hover:bg-accent/10 hover:text-text {themeStore.current ===
					'classic'
						? 'rounded-md hover:bg-zinc-800'
						: ''}"
					onclick={() => (showMenu = false)}
				>
					<ExternalLink size={11} />
					<span>{themeStore.current === 'hyv' ? 'source archive' : 'View Source'}</span>
				</a>
			{/if}

			<div class="my-1 border-t border-line"></div>

			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-status-fail transition-colors hover:bg-status-fail/15 {themeStore.current ===
				'classic'
					? 'rounded-md hover:bg-red-500/10'
					: ''}"
				onclick={handleDelete}
			>
				<Trash2 size={11} />
				<span>{themeStore.current === 'hyv' ? 'purge entity' : 'Delete Card'}</span>
			</button>
		</div>
	{/if}
</div>
