<script>
	import {
		FolderKanban,
		Plus,
		Copy,
		Trash2,
		X,
		ArrowRight,
		Check,
		Sparkles,
		Layers
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { getBoardsRegistry } from '#lib/services/persistence.js';
	import { STARTER_TEMPLATES } from '#lib/services/templates.js';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   onclose?: () => void;
	 * }}
	 */
	let { open = false, onclose } = $props();

	/** @type {'my-boards' | 'templates'} */
	let activeTab = $state('my-boards');

	/** @type {import('#lib/services/persistence.js').BoardSummary[]} */
	let savedBoards = $state([]);

	$effect(() => {
		if (open) {
			savedBoards = getBoardsRegistry();
		}
	});

	function refreshRegistry() {
		savedBoards = getBoardsRegistry();
	}

	/**
	 * @param {string} boardId
	 */
	function handleSelectBoard(boardId) {
		board.switchBoard(boardId);
		open = false;
		onclose?.();
	}

	function handleCreateNew() {
		board.createNewBoard('New Tier List', '');
		open = false;
		onclose?.();
	}

	function handleDuplicate() {
		board.duplicateCurrentBoard();
		refreshRegistry();
	}

	/**
	 * @param {string} boardId
	 */
	function handleDeleteBoard(boardId) {
		if (confirm('Are you sure you want to delete this saved tier list?')) {
			board.deleteSavedBoard(boardId);
			refreshRegistry();
		}
	}

	/**
	 * Loads a starter template
	 * @param {import('#lib/services/templates.js').StarterTemplate} template
	 */
	function handleLoadTemplate(template) {
		const newBoardId = `board-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
		board.id = newBoardId;
		board.title = template.title;
		board.context = template.context;
		board.tiers = template.tiers.map((t, idx) => ({
			id: `tier-${Date.now()}-${idx}`,
			label: t.label,
			color: t.color,
			order: t.order,
			imageUrl: t.imageUrl
		}));
		board.items = template.items.map((i, idx) => ({
			id: `item-${Date.now()}-${idx}`,
			name: i.name,
			imageUrl: i.imageUrl,
			tierId: null,
			order: idx
		}));
		board.persist();
		open = false;
		onclose?.();
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open) {
			open = false;
			onclose?.();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs duration-200"
		role="dialog"
		aria-modal="true"
		aria-label="Saved Tier Lists"
	>
		<div
			class="animate-in zoom-in-95 relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl duration-200"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-zinc-800/80 pb-4">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"
					>
						<FolderKanban size={18} />
					</div>
					<div>
						<h2 class="text-base font-semibold text-zinc-100">Board Manager</h2>
						<p class="text-xs text-zinc-400">Switch boards or load pre-built starter templates</p>
					</div>
				</div>

				<button
					type="button"
					class="cursor-pointer rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
					onclick={() => {
						open = false;
						onclose?.();
					}}
					aria-label="Close"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Tab Switcher -->
			<div class="mt-4 flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
				<button
					type="button"
					class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors {activeTab ===
					'my-boards'
						? 'bg-blue-600 text-white'
						: 'text-zinc-400 hover:text-zinc-200'}"
					onclick={() => (activeTab = 'my-boards')}
				>
					<Layers size={13} />
					<span>My Saved Boards ({savedBoards.length})</span>
				</button>
				<button
					type="button"
					class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-semibold transition-colors {activeTab ===
					'templates'
						? 'bg-blue-600 text-white'
						: 'text-zinc-400 hover:text-zinc-200'}"
					onclick={() => (activeTab = 'templates')}
				>
					<Sparkles size={13} class="text-amber-400" />
					<span>Starter Templates ({STARTER_TEMPLATES.length})</span>
				</button>
			</div>

			{#if activeTab === 'my-boards'}
				<!-- Quick Actions -->
				<div class="mt-4 flex items-center gap-2">
					<button
						type="button"
						class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-600/15 py-2 text-xs font-medium text-blue-300 transition-colors hover:bg-blue-600/25"
						onclick={handleCreateNew}
					>
						<Plus size={13} />
						<span>Start New Blank Board</span>
					</button>

					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
						onclick={handleDuplicate}
						title="Duplicate the active board"
					>
						<Copy size={13} />
						<span>Duplicate Current</span>
					</button>
				</div>

				<!-- Boards List -->
				<div class="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
					{#if savedBoards.length === 0}
						<div class="py-8 text-center text-xs text-zinc-500">
							No other saved boards yet. Start a new board anytime!
						</div>
					{:else}
						{#each savedBoards as item (item.id)}
							<div
								class="group flex items-center justify-between rounded-xl border p-3 transition-all {item.id ===
								board.id
									? 'border-blue-500/50 bg-blue-500/5 text-zinc-100 shadow-xs ring-1 ring-blue-500/30'
									: 'border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'}"
							>
								<!-- Board Info -->
								<button
									type="button"
									class="flex flex-1 cursor-pointer flex-col text-left"
									onclick={() => handleSelectBoard(item.id)}
								>
									<div class="flex items-center gap-2">
										<span class="text-xs font-medium text-zinc-100">{item.title}</span>
										{#if item.id === board.id}
											<span
												class="py-0.2 rounded bg-blue-500/20 px-1.5 text-[10px] font-medium text-blue-300"
											>
												Active
											</span>
										{/if}
									</div>

									<div class="mt-1 flex items-center gap-3 text-[10px] text-zinc-500">
										{#if item.context}
											<span class="text-zinc-400">"{item.context}"</span>
											<span>&bull;</span>
										{/if}
										<span>{item.cardCount} {item.cardCount === 1 ? 'card' : 'cards'}</span>
										<span>&bull;</span>
										<span>{item.tierCount} tiers</span>
										<span>&bull;</span>
										<span>{new Date(item.updatedAt).toLocaleDateString()}</span>
									</div>
								</button>

								<!-- Actions -->
								<div class="flex items-center gap-1.5 pl-2">
									{#if item.id !== board.id}
										<button
											type="button"
											class="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
											onclick={() => handleDeleteBoard(item.id)}
											title="Delete saved board"
											aria-label="Delete board"
										>
											<Trash2 size={13} />
										</button>

										<button
											type="button"
											class="flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-blue-600 hover:text-white"
											onclick={() => handleSelectBoard(item.id)}
										>
											<span>Open</span>
											<ArrowRight size={11} />
										</button>
									{:else}
										<div class="flex items-center gap-1 px-2 text-xs font-medium text-blue-400">
											<Check size={13} />
											<span>Loaded</span>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{:else}
				<!-- Templates List -->
				<div class="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-1">
					{#each STARTER_TEMPLATES as template (template.id)}
						<div
							class="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 transition-all hover:border-amber-500/40 hover:bg-zinc-900"
						>
							<div class="flex items-center gap-3">
								<img
									src={template.thumbnail}
									alt=""
									referrerpolicy="no-referrer"
									class="h-10 w-10 shrink-0 rounded-lg bg-zinc-950 object-contain p-1"
								/>
								<div>
									<h4 class="text-xs font-semibold text-zinc-100">{template.title}</h4>
									<p class="mt-0.5 line-clamp-1 text-[11px] text-zinc-400">
										{template.description}
									</p>
									<div class="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
										<span class="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
											{template.tiers.length} tiers
										</span>
										<span class="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
											{template.items.length} starter cards
										</span>
									</div>
								</div>
							</div>

							<button
								type="button"
								class="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/25"
								onclick={() => handleLoadTemplate(template)}
							>
								<span>Load</span>
								<ArrowRight size={12} />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div class="mt-4 border-t border-zinc-800/80 pt-3 text-right">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-zinc-800 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
					onclick={() => {
						open = false;
						onclose?.();
					}}
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}
