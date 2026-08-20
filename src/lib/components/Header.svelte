<script>
	import { RotateCcw, Plus, Download, Upload, Tag, Layers } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import ConfirmModal from './ConfirmModal.svelte';

	let isResetConfirmOpen = $state(false);
	let isImportModalOpen = $state(false);
	let importText = $state('');
	let importError = $state('');

	function handleResetConfirm() {
		board.resetBoard();
		isResetConfirmOpen = false;
	}

	function handleAddTier() {
		board.addTier('NEW', '#3b82f6');
	}

	function handleExport() {
		const json = board.exportJson();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${board.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tierlist.json`;
		a.click();
		URL.revokeObjectURL(url);
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
</script>

<header class="w-full border-b border-zinc-800/80 pt-2 pb-6">
	<div class="mx-auto flex max-w-6xl flex-col justify-between gap-4 md:flex-row md:items-center">
		<!-- Left: Title & Subtitle -->
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
					class="rounded border-b border-transparent bg-transparent px-1 py-0.5 text-xl font-black text-white transition-colors hover:border-zinc-700 focus:border-blue-500 focus:outline-none sm:text-2xl"
				/>
			</div>
			<p class="pl-8 text-xs text-zinc-400">
				Create cards instantly from search queries without uploading images
			</p>
		</div>

		<!-- Right: Context & Board Controls -->
		<div class="flex flex-wrap items-center gap-2.5">
			<!-- Context Input Field -->
			<div class="relative flex items-center">
				<Tag size={13} class="pointer-events-none absolute left-2.5 text-zinc-400" />
				<input
					type="text"
					value={board.context}
					oninput={(e) => board.setContext(e.currentTarget.value)}
					placeholder="Search context (e.g. League of Legends)"
					title="Context appended to search queries to disambiguate results"
					class="w-56 rounded-lg border border-zinc-700/80 bg-zinc-900 py-1.5 pr-2.5 pl-7 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none sm:w-64"
				/>
			</div>

			<!-- Add Tier Button -->
			<button
				type="button"
				class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
				onclick={handleAddTier}
			>
				<Plus size={13} />
				<span>Add Tier</span>
			</button>

			<!-- Export JSON -->
			<button
				type="button"
				class="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900 p-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={handleExport}
				title="Export board as JSON"
				aria-label="Export board as JSON"
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
				class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
				onclick={() => (isResetConfirmOpen = true)}
			>
				<RotateCcw size={13} />
				<span>Reset</span>
			</button>
		</div>
	</div>
</header>

<!-- Reset Confirmation Modal -->
<ConfirmModal
	bind:open={isResetConfirmOpen}
	title="Reset Tier List?"
	message="This will restore default S-F tiers and remove all ranked and unranked cards. This action cannot be undone."
	confirmLabel="Reset Everything"
	danger={true}
	onconfirm={handleResetConfirm}
	oncancel={() => (isResetConfirmOpen = false)}
/>

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
			<h3 class="text-base font-semibold text-zinc-100">Import Board JSON</h3>
			<p class="mt-1 text-xs text-zinc-400">Paste previously exported tier list JSON data below:</p>

			<textarea
				bind:value={importText}
				rows="7"
				placeholder="Paste JSON here..."
				class="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-blue-500 focus:outline-none"
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
