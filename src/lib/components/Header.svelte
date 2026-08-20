<script>
	import {
		RotateCcw,
		Plus,
		Download,
		Upload,
		Tag,
		Layers,
		Sparkles,
		FolderKanban,
		CheckCircle2,
		Library,
		Image as ImageIcon,
		Loader2,
		Check
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { cardStash } from '#lib/stores/cardStash.svelte.js';
	import { exportBoardAsPng } from '#lib/services/exportImage.js';
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
		board.addTier('NEW', '#3b82f6');
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
			importError = 'Invalid tier list JSON format. Please check the content.';
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

<header class="w-full border-b border-zinc-800/80 pt-2 pb-6">
	<div class="mx-auto flex max-w-6xl flex-col justify-between gap-4 md:flex-row md:items-center">
		<!-- Left: Title & Subtitle with Save Status -->
		<div class="space-y-1">
			<div class="flex items-center gap-2">
				<div class="rounded-lg border border-blue-500/20 bg-blue-500/10 p-1.5 text-blue-400">
					<Layers size={20} />
				</div>
				<input
					type="text"
					value={board.title}
					oninput={(e) => board.setTitle(e.currentTarget.value)}
					placeholder="Tier List Title..."
					class="rounded border-b border-transparent bg-transparent px-1 py-0.5 text-xl font-black text-white transition-colors hover:border-zinc-700 focus:border-blue-500 focus:outline-hidden sm:text-2xl"
				/>

				<!-- Auto-Save Status Badge -->
				<div
					class="ml-1 flex items-center gap-1 text-[10px] text-zinc-500"
					title={`Auto-saved locally at ${new Date(board.lastSavedAt).toLocaleTimeString()}`}
				>
					<CheckCircle2 size={11} class="text-emerald-500/80" />
					<span class="hidden sm:inline">Saved</span>
				</div>
			</div>
			<p class="pl-8 text-xs text-zinc-400">
				Create cards instantly from search queries without uploading images
			</p>
		</div>

		<!-- Right: Context & Board Controls -->
		<div class="flex flex-wrap items-center gap-2">
			<!-- Context Input Field -->
			<div class="relative flex items-center">
				<Tag size={13} class="pointer-events-none absolute left-2.5 text-zinc-400" />
				<input
					type="text"
					value={board.context}
					oninput={(e) => board.setContext(e.currentTarget.value)}
					placeholder="Context (e.g. League of Legends)"
					title="Context appended to search queries to disambiguate results"
					class="w-48 rounded-lg border border-zinc-700/80 bg-zinc-900 py-1.5 pr-2.5 pl-7 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-hidden sm:w-56"
				/>
			</div>

			<!-- Card Stash Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1.5 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20 hover:text-purple-200"
				onclick={() => (isCardStashOpen = true)}
				title="View your permanent global card stash"
			>
				<Library size={13} class="text-purple-400" />
				<span>Card Stash</span>
				{#if cardStash.cards.length > 0}
					<span
						class="py-0.2 rounded-full bg-purple-500/30 px-1.5 text-[10px] font-bold text-purple-200"
					>
						{cardStash.cards.length}
					</span>
				{/if}
			</button>

			<!-- Saved Boards Switcher -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
				onclick={() => (isSavedBoardsOpen = true)}
				title="Manage boards and explore starter templates"
			>
				<FolderKanban size={13} class="text-blue-400" />
				<span class="hidden sm:inline">Templates & Boards</span>
				<span class="sm:hidden">Boards</span>
			</button>

			<!-- Auto-Rank with AI Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:text-amber-200"
				onclick={() => (isAutoRankModalOpen = true)}
				title="Automatically rank cards with AI"
			>
				<Sparkles size={13} class="text-amber-400" />
				<span class="hidden sm:inline">Auto-Rank</span>
			</button>

			<!-- Add Tier Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
				onclick={handleAddTier}
			>
				<Plus size={13} />
				<span class="hidden sm:inline">Add Tier</span>
			</button>

			<!-- Export PNG Image Button -->
			<button
				type="button"
				disabled={isExportingPng}
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200 disabled:opacity-50"
				onclick={handleExportPng}
				title="Export tier list as high-resolution PNG image"
				aria-label="Export tier list as high-resolution PNG image"
			>
				{#if isExportingPng}
					<Loader2 size={13} class="animate-spin text-emerald-400" />
					<span class="hidden sm:inline">Exporting...</span>
				{:else if pngExportSuccess}
					<Check size={13} class="text-emerald-400" />
					<span class="hidden sm:inline">Downloaded!</span>
				{:else}
					<ImageIcon size={13} class="text-emerald-400" />
					<span class="hidden sm:inline">Export PNG</span>
				{/if}
			</button>

			<!-- Export JSON -->
			<button
				type="button"
				class="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={handleExportJson}
				title="Export board data as JSON"
				aria-label="Export board data as JSON"
			>
				<Download size={14} />
			</button>

			<!-- Import JSON -->
			<button
				type="button"
				class="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={() => {
					importError = '';
					importText = '';
					isImportModalOpen = true;
				}}
				title="Import board JSON"
				aria-label="Import board JSON"
			>
				<Upload size={14} />
			</button>

			<!-- Reset Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
				onclick={() => (isResetConfirmOpen = true)}
				title="Reset to default S-F tiers"
			>
				<RotateCcw size={13} />
				<span class="hidden sm:inline">Reset</span>
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
	title="Reset Tier List?"
	message="This will restore default S-F tiers and remove all ranked and unranked cards. Your cards will remain safely preserved in your Global Card Stash."
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="animate-in fade-in zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-zinc-100 shadow-2xl duration-150"
		>
			<div class="flex items-center justify-between border-b border-zinc-800 pb-3">
				<h3 class="text-base font-semibold text-zinc-100">Import Board JSON</h3>
				<button
					type="button"
					class="cursor-pointer rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
					onclick={() => (isImportModalOpen = false)}
				>
					&times;
				</button>
			</div>

			<p class="mt-3 text-xs text-zinc-400">
				Upload a saved JSON file or paste previously exported tier list data below:
			</p>

			<!-- Choose File Option -->
			<div class="mt-3">
				<button
					type="button"
					class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/60 p-3 text-xs text-zinc-300 transition-colors hover:border-blue-500 hover:bg-zinc-950"
					onclick={() => jsonFileInput?.click()}
				>
					<Upload size={14} class="text-blue-400" />
					<span>Upload .JSON File from Computer</span>
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
				<div class="w-full border-t border-zinc-800"></div>
				<span class="absolute bg-zinc-900 px-2 text-[10px] text-zinc-500 uppercase">Or Paste</span>
			</div>

			<textarea
				bind:value={importText}
				rows="6"
				placeholder="Paste JSON here..."
				class="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-hidden"
			></textarea>

			{#if importError}
				<p class="mt-2 text-xs text-red-400">{importError}</p>
			{/if}

			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-700"
					onclick={() => (isImportModalOpen = false)}
				>
					Cancel
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-500"
					onclick={handleImport}
				>
					Import
				</button>
			</div>
		</div>
	</div>
{/if}
