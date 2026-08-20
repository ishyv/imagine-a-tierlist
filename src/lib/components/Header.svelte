<script>
	import {
		RotateCcw,
		Plus,
		Download,
		Upload,
		Sparkles,
		FolderKanban,
		Library,
		Image as ImageIcon,
		Loader2,
		Check,
		Palette
	} from 'lucide-svelte';
	import { board, TIER_COLOR_PALETTE } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { exportBoardAsPng } from '#lib/services/exportImage.js';
	import StatusDot from './ambient/StatusDot.svelte';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import GlyphMark from './ambient/GlyphMark.svelte';
	import ConfirmModal from './ConfirmModal.svelte';
	import AutoRankModal from './AutoRankModal.svelte';
	import CardStashDrawer from './CardStashDrawer.svelte';
	import SavedBoardsModal from './SavedBoardsModal.svelte';

	let isResetConfirmOpen = $state(false);
	let isImportModalOpen = $state(false);
	let isAutoRankModalOpen = $state(false);
	let isCardStashOpen = $state(false);
	let isSavedBoardsOpen = $state(false);
	let isExportingPng = $state(false);
	let pngExportSuccess = $state(false);
	let importText = $state('');
	let importError = $state('');
	/** @type {HTMLInputElement | null} */
	let jsonFileInput = $state(null);

	function handleResetConfirm() {
		board.resetBoard();
		isResetConfirmOpen = false;
	}

	function handleAddTier() {
		const nextColor =
			TIER_COLOR_PALETTE[board.tiers.length % TIER_COLOR_PALETTE.length] || '#0070DD';
		board.addTier('NEW', nextColor);
	}

	function handleExportJson() {
		const json = board.exportJson();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${board.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tierlist.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function handleExportPng() {
		if (isExportingPng) return;
		isExportingPng = true;
		pngExportSuccess = false;

		const success = await exportBoardAsPng(board);
		isExportingPng = false;

		if (success) {
			pngExportSuccess = true;
			setTimeout(() => {
				pngExportSuccess = false;
			}, 2000);
		}
	}

	function handleImport() {
		importError = '';
		if (!importText.trim()) return;

		const success = board.importJson(importText.trim());
		if (success) {
			isImportModalOpen = false;
			importText = '';
		} else {
			importError = 'invalid json data structure. check formatting.';
		}
	}

	/**
	 * @param {Event} e
	 */
	function handleJsonFileUpload(e) {
		const target = /** @type {HTMLInputElement} */ (e.target);
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const content = ev.target?.result;
			if (typeof content === 'string') {
				importText = content;
				handleImport();
			}
		};
		reader.readAsText(file);
		target.value = '';
	}
</script>

<header class="relative w-full border-b border-line pb-6">
	<!-- Top Index & Telemetry Bar with Theme Toggle -->
	<div
		class="tracking-meta mb-3 flex items-center justify-between font-mono text-[10px] text-muted-strong uppercase"
	>
		<div class="flex items-center gap-2">
			{#if themeStore.current === 'hyv'}
				<GlyphMark variant="plus" size={10} color="var(--accent)" />
				<span class="text-accent">01 // MATRIX</span>
				<span class="text-line-strong">/</span>
				<span>IMAGINE_A_TIERLIST</span>
			{:else}
				<span class="font-semibold text-zinc-300">IMAGINE A TIER LIST</span>
				<span class="text-zinc-600">/</span>
				<span class="text-zinc-400">CLASSIC VIEW</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 sm:gap-3">
			<!-- Aesthetic Theme Switcher Toggle -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] transition-all duration-150 {themeStore.current ===
				'hyv'
					? 'border-accent/40 bg-accent/10 text-accent hover:border-accent hover:bg-accent/20'
					: 'rounded-md border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'}"
				onclick={() => themeStore.toggleTheme()}
				title={`Switch design: currently active ${themeStore.current === 'hyv' ? 'Hyv Operator' : 'Classic Dark'}`}
			>
				<Palette size={11} class={themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'} />
				<span>THEME: <strong>{themeStore.current === 'hyv' ? 'HYV' : 'CLASSIC'}</strong></span>
			</button>

			<!-- Buffer Synced / Local Save Status -->
			<div
				class="hidden items-center gap-2 sm:flex"
				title={`auto-saved locally at ${new Date(board.lastSavedAt).toLocaleTimeString()}`}
			>
				<StatusDot status="ok" size={5} />
				<span>{themeStore.current === 'hyv' ? 'BUFFER_SYNCED' : 'SAVED'}</span>
			</div>
		</div>
	</div>

	<!-- Main Header Row -->
	<div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
		<!-- Left: Title & Subtitle -->
		<div class="space-y-1.5">
			<div class="flex items-baseline gap-2">
				<input
					type="text"
					value={board.title}
					oninput={(e) => board.setTitle(e.currentTarget.value)}
					placeholder={themeStore.current === 'hyv' ? 'untitled tier list...' : 'Tier List Title'}
					class="border-b border-transparent bg-transparent {themeStore.current === 'hyv'
						? 'font-body text-3xl font-normal sm:text-4xl lg:text-5xl'
						: 'font-sans text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl'} text-text transition-all duration-150 placeholder:text-muted-strong placeholder:italic hover:border-line focus:border-accent focus:text-text focus:outline-none"
					style="
						line-height: 1.05;
						text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
					"
				/>
			</div>
			<p
				class="{themeStore.current === 'hyv'
					? 'font-mono text-[11px]'
					: 'font-sans text-xs'} tracking-wide text-muted"
			>
				{#if themeStore.current === 'hyv'}
					instant visual entity ranking without file uploads &middot; <span
						class="text-muted-strong italic">classified matrix</span
					>
				{:else}
					AI-powered on-demand visual tier list creator & auto-ranking engine
				{/if}
			</p>
		</div>

		<!-- Right: Context Scope & Action Triggers -->
		<div
			class="flex flex-wrap items-center gap-2 {themeStore.current === 'hyv'
				? 'font-mono text-xs'
				: 'font-sans text-xs'}"
		>
			<!-- Context Input Field -->
			<div
				class="relative flex items-center border border-line bg-bg-surface px-2.5 py-1.5 shadow-xs transition-colors focus-within:border-accent {themeStore.current ===
				'classic'
					? 'rounded-lg border-zinc-700/80 bg-zinc-900'
					: ''}"
			>
				<span
					class="tracking-meta mr-2 text-[10px] uppercase {themeStore.current === 'hyv'
						? 'text-accent'
						: 'text-zinc-400'}"
				>
					{themeStore.current === 'hyv' ? 'SCOPE:' : 'Context:'}
				</span>
				<input
					type="text"
					value={board.context}
					oninput={(e) => board.setContext(e.currentTarget.value)}
					placeholder={themeStore.current === 'hyv'
						? 'context (e.g. arcane)'
						: 'Context (e.g. Arcane)'}
					title="Context appended to search queries to disambiguate results"
					class="w-36 bg-transparent text-xs text-text placeholder:text-muted-strong focus:outline-none sm:w-44"
				/>
			</div>

			<!-- Card Stash Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs transition-all duration-150 active:translate-y-px {themeStore.current ===
				'hyv'
					? 'border-line bg-bg-surface text-text shadow-xs hover:border-accent hover:text-accent-strong'
					: 'rounded-lg border-purple-500/30 bg-purple-500/10 font-semibold text-purple-300 hover:bg-purple-500/20 hover:text-purple-200'}"
				onclick={() => (isCardStashOpen = true)}
				title="View your permanent global card stash"
			>
				<Library
					size={12}
					class={themeStore.current === 'hyv' ? 'text-accent' : 'text-purple-400'}
				/>
				<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
					{themeStore.current === 'hyv' ? 'STASH' : 'Card Stash'}
				</span>
				{#if cardStash.cards.length > 0}
					<span
						class="py-0.2 border border-line px-1 text-[10px] {themeStore.current === 'hyv'
							? 'bg-bg text-accent'
							: 'rounded-full bg-purple-500/30 text-purple-200'}"
					>
						{cardStash.cards.length}
					</span>
				{/if}
			</button>

			<!-- Saved Boards Switcher -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs transition-all duration-150 active:translate-y-px {themeStore.current ===
				'hyv'
					? 'border-line bg-bg-surface text-text shadow-xs hover:border-accent hover:text-accent-strong'
					: 'rounded-lg border-zinc-800 bg-zinc-900 font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'}"
				onclick={() => (isSavedBoardsOpen = true)}
				title="Manage boards and explore starter templates"
			>
				<FolderKanban
					size={12}
					class={themeStore.current === 'hyv' ? 'text-signal' : 'text-blue-400'}
				/>
				<span
					class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
				>
					{themeStore.current === 'hyv' ? 'ARCHIVES' : 'Templates & Boards'}
				</span>
				<span class="sm:hidden {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}">
					{themeStore.current === 'hyv' ? 'BOARDS' : 'Boards'}
				</span>
			</button>

			<!-- Auto-Rank with AI Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:translate-y-px {themeStore.current ===
				'hyv'
					? 'border-accent/50 bg-accent/10 text-accent shadow-xs hover:border-accent-strong hover:bg-accent/20 hover:text-accent-strong'
					: 'rounded-lg border-amber-500/30 bg-amber-500/10 font-semibold text-amber-300 hover:bg-amber-500/20 hover:text-amber-200'}"
				onclick={() => (isAutoRankModalOpen = true)}
				title="Automatically rank cards with AI"
			>
				<Sparkles
					size={12}
					class={themeStore.current === 'hyv' ? 'text-accent' : 'text-amber-400'}
				/>
				<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
					{themeStore.current === 'hyv' ? 'AUTO-RANK' : 'Auto-Rank'}
				</span>
			</button>

			<!-- Add Tier Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1 border px-3 py-1.5 text-xs transition-all duration-150 active:translate-y-px {themeStore.current ===
				'hyv'
					? 'border-line bg-bg-surface text-text shadow-xs hover:border-line-strong hover:text-text-soft'
					: 'rounded-lg border-zinc-800 bg-zinc-900 font-medium text-zinc-300 hover:bg-zinc-800'}"
				onclick={handleAddTier}
				title="Add new tier row"
			>
				<Plus size={12} />
				<span
					class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
				>
					{themeStore.current === 'hyv' ? '+ TIER' : 'Add Tier'}
				</span>
			</button>

			<!-- Export PNG Image Button -->
			<button
				type="button"
				disabled={isExportingPng}
				class="flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-medium transition-all duration-150 active:translate-y-px disabled:opacity-40 {themeStore.current ===
				'hyv'
					? 'border-signal/50 bg-signal/10 text-signal shadow-xs hover:border-signal hover:bg-signal/20'
					: 'rounded-lg border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200'}"
				onclick={handleExportPng}
				title="Export tier list as high-resolution PNG image"
				aria-label="Export tier list as high-resolution PNG image"
			>
				{#if isExportingPng}
					<Loader2
						size={12}
						class="animate-spin {themeStore.current === 'hyv' ? 'text-signal' : 'text-emerald-400'}"
					/>
					<span
						class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
					>
						{themeStore.current === 'hyv' ? 'RENDERING...' : 'Exporting...'}
					</span>
				{:else if pngExportSuccess}
					<Check
						size={12}
						class={themeStore.current === 'hyv' ? 'text-signal' : 'text-emerald-400'}
					/>
					<span
						class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
					>
						{themeStore.current === 'hyv' ? 'DOWNLOADED' : 'Downloaded!'}
					</span>
				{:else}
					<ImageIcon
						size={12}
						class={themeStore.current === 'hyv' ? 'text-signal' : 'text-emerald-400'}
					/>
					<span
						class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
					>
						{themeStore.current === 'hyv' ? 'EXPORT PNG' : 'Export PNG'}
					</span>
				{/if}
			</button>

			<!-- Export JSON -->
			<button
				type="button"
				class="cursor-pointer border border-line bg-bg-surface p-1.5 text-xs text-muted shadow-xs transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
				'classic'
					? 'rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200'
					: ''}"
				onclick={handleExportJson}
				title="Export board data as JSON"
				aria-label="Export board data as JSON"
			>
				<Download size={13} />
			</button>

			<!-- Import JSON -->
			<button
				type="button"
				class="cursor-pointer border border-line bg-bg-surface p-1.5 text-xs text-muted shadow-xs transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
				'classic'
					? 'rounded-lg border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:text-zinc-200'
					: ''}"
				onclick={() => {
					importError = '';
					importText = '';
					isImportModalOpen = true;
				}}
				title="Import board JSON"
				aria-label="Import board JSON"
			>
				<Upload size={13} />
			</button>

			<!-- Reset Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1 border px-2.5 py-1.5 text-xs shadow-xs transition-colors {themeStore.current ===
				'hyv'
					? 'border-status-fail/30 bg-bg-surface text-status-fail hover:border-status-fail hover:bg-status-fail/15'
					: 'rounded-lg border-red-500/20 bg-red-500/10 font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300'}"
				onclick={() => (isResetConfirmOpen = true)}
				title="Reset to default S-F tiers"
			>
				<RotateCcw size={12} />
				<span
					class="hidden sm:inline {themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}"
				>
					{themeStore.current === 'hyv' ? 'RESET' : 'Reset'}
				</span>
			</button>
		</div>
	</div>
</header>

<!-- Card Stash Drawer -->
<CardStashDrawer open={isCardStashOpen} onclose={() => (isCardStashOpen = false)} />

<!-- Saved Boards Modal -->
<SavedBoardsModal open={isSavedBoardsOpen} onclose={() => (isSavedBoardsOpen = false)} />

<!-- Reset Confirmation Modal -->
<ConfirmModal
	open={isResetConfirmOpen}
	title={themeStore.current === 'hyv' ? 'Reset Matrix?' : 'Reset Tier List?'}
	message={themeStore.current === 'hyv'
		? 'This restores default tiers and removes all active cards. Cards remain safely indexed in your Global Card Stash.'
		: 'This will restore default S-F tiers and remove all ranked and unranked cards. Your cards will remain safely preserved in your Global Card Stash.'}
	confirmLabel="Reset Board"
	danger={true}
	onconfirm={handleResetConfirm}
	oncancel={() => (isResetConfirmOpen = false)}
/>

<!-- Auto-Rank Modal -->
<AutoRankModal open={isAutoRankModalOpen} onclose={() => (isAutoRankModalOpen = false)} />

<!-- Import Modal -->
{#if isImportModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="shadow-veil relative w-full max-w-lg border border-line bg-bg-elev p-6 text-text {themeStore.current ===
			'classic'
				? 'rounded-xl border-zinc-800 bg-zinc-900'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
			{/if}

			<div class="flex items-center justify-between border-b border-line pb-3">
				<h3
					class="font-mono text-sm tracking-wide text-text {themeStore.current === 'hyv'
						? 'uppercase'
						: 'font-semibold'}"
				>
					{themeStore.current === 'hyv' ? 'Import Matrix JSON' : 'Import Board JSON'}
				</h3>
				<button
					type="button"
					class="cursor-pointer font-mono text-sm text-muted hover:text-text"
					onclick={() => (isImportModalOpen = false)}
				>
					&times;
				</button>
			</div>

			<p class="mt-3 text-xs text-muted">Upload a saved .json file or paste matrix payload:</p>

			<!-- Choose File Option -->
			<div class="mt-3">
				<button
					type="button"
					class="flex w-full cursor-pointer items-center justify-center gap-2 border border-dashed border-line bg-bg p-3 text-xs text-text-soft transition-colors hover:border-accent hover:text-accent-strong {themeStore.current ===
					'classic'
						? 'rounded-lg'
						: 'font-mono'}"
					onclick={() => jsonFileInput?.click()}
				>
					<Upload size={13} class="text-accent" />
					<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
						Upload .JSON File
					</span>
				</button>
				<input
					type="file"
					accept=".json"
					bind:this={jsonFileInput}
					class="hidden"
					onchange={handleJsonFileUpload}
				/>
			</div>

			<div class="relative my-3 flex items-center justify-center">
				<div class="w-full border-t border-line"></div>
				<span
					class="tracking-meta absolute bg-bg-elev px-2 font-mono text-[10px] text-muted-strong uppercase"
				>
					Or Raw Payload
				</span>
			</div>

			<textarea
				bind:value={importText}
				rows="6"
				placeholder="paste json string..."
				class="w-full border border-line bg-bg p-3 font-mono text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
				'classic'
					? 'rounded-lg'
					: ''}"></textarea>

			{#if importError}
				<p class="mt-2 font-mono text-xs text-status-fail">{importError}</p>
			{/if}

			<div class="mt-5 flex justify-end gap-2 text-xs">
				<button
					type="button"
					class="cursor-pointer border border-line bg-bg px-3.5 py-1.5 text-muted transition-colors hover:text-text {themeStore.current ===
					'classic'
						? 'rounded-lg'
						: ''}"
					onclick={() => (isImportModalOpen = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer border border-accent bg-accent/15 px-4 py-1.5 font-medium text-accent transition-colors hover:bg-accent/25 hover:text-accent-strong {themeStore.current ===
					'classic'
						? 'rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-500'
						: ''}"
					onclick={handleImport}
				>
					Import
				</button>
			</div>
		</div>
	</div>
{/if}
