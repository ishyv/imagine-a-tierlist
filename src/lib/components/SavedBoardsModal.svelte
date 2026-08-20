<script>
	import {
		FolderKanban,
		Plus,
		Copy,
		Trash2,
		ArrowRight,
		Check,
		Sparkles,
		Layers
	} from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { getBoardsRegistry } from '#lib/services/persistence.js';
	import { STARTER_TEMPLATES } from '#lib/services/templates.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

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
		if (confirm('Delete this saved tier list matrix?')) {
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-label="Saved Tier Lists"
	>
		<div
			class="shadow-veil relative flex max-h-[85vh] w-full max-w-lg flex-col border border-line bg-bg-elev p-6 text-text {themeStore.current ===
			'classic'
				? 'rounded-2xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
			{/if}

			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-line pb-4 {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<div class="flex items-center gap-2">
					<FolderKanban
						size={15}
						class={themeStore.current === 'hyv' ? 'text-accent' : 'text-blue-400'}
					/>
					<div>
						<h2
							class="text-xs text-text {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-bold'}"
						>
							{themeStore.current === 'hyv' ? 'BOARD_REGISTRY // ARCHIVES' : 'Saved Tier Lists'}
						</h2>
						<p class="text-[10px] text-muted">
							{themeStore.current === 'hyv'
								? 'switch matrices or deploy starter blueprints'
								: 'Switch boards or load starter templates'}
						</p>
					</div>
				</div>

				<button
					type="button"
					class="cursor-pointer text-xs text-muted hover:text-text"
					onclick={() => {
						open = false;
						onclose?.();
					}}
					aria-label="Close"
				>
					&times;
				</button>
			</div>

			<!-- Tab Switcher -->
			<div
				class="mt-4 flex border border-line bg-bg p-1 text-xs {themeStore.current === 'classic'
					? 'rounded-lg border-zinc-800 bg-zinc-950 font-sans'
					: 'font-mono'}"
			>
				<button
					type="button"
					class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-1.5 transition-colors {themeStore.current ===
					'classic'
						? 'rounded-md'
						: ''} {activeTab === 'my-boards'
						? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
						: 'text-muted hover:text-text'}"
					onclick={() => (activeTab = 'my-boards')}
				>
					<Layers size={12} />
					<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
						Saved ({savedBoards.length})
					</span>
				</button>
				<button
					type="button"
					class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-1.5 transition-colors {themeStore.current ===
					'classic'
						? 'rounded-md'
						: ''} {activeTab === 'templates'
						? 'border border-accent/40 bg-accent/15 font-medium text-accent-strong'
						: 'text-muted hover:text-text'}"
					onclick={() => (activeTab = 'templates')}
				>
					<Sparkles size={12} class="text-accent" />
					<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
						{themeStore.current === 'hyv' ? 'Starter Blueprints' : 'Templates'} ({STARTER_TEMPLATES.length})
					</span>
				</button>
			</div>

			{#if activeTab === 'my-boards'}
				<!-- Quick Actions -->
				<div
					class="mt-4 flex items-center gap-2 text-xs {themeStore.current === 'classic'
						? 'font-sans'
						: 'font-mono'}"
				>
					<button
						type="button"
						class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 border border-accent bg-accent/15 py-1.5 font-medium text-accent transition-colors hover:bg-accent/25 hover:text-accent-strong {themeStore.current ===
						'classic'
							? 'rounded-lg'
							: ''}"
						onclick={handleCreateNew}
					>
						<Plus size={12} />
						<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>
							{themeStore.current === 'hyv' ? 'Initialize Blank Matrix' : 'New Board'}
						</span>
					</button>

					<button
						type="button"
						class="flex cursor-pointer items-center justify-center gap-1.5 border border-line bg-bg px-3 py-1.5 text-text-soft transition-colors hover:border-line-strong hover:text-text {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-800'
							: ''}"
						onclick={handleDuplicate}
						title="Duplicate the active board"
					>
						<Copy size={12} />
						<span class={themeStore.current === 'hyv' ? 'tracking-wide uppercase' : ''}>Clone</span>
					</button>
				</div>

				<!-- Boards List -->
				<div
					class="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 text-xs {themeStore.current ===
					'classic'
						? 'font-sans'
						: 'font-mono'}"
				>
					{#if savedBoards.length === 0}
						<div class="py-8 text-center text-xs text-muted">No additional saved boards found.</div>
					{:else}
						{#each savedBoards as item (item.id)}
							<div
								class="group flex items-center justify-between border p-3 transition-all {themeStore.current ===
								'classic'
									? 'rounded-xl'
									: ''} {item.id === board.id
									? 'border-accent bg-accent/10 text-text'
									: 'border-line bg-bg/60 text-muted hover:border-line-strong hover:text-text'}"
							>
								<!-- Board Info -->
								<button
									type="button"
									class="flex flex-1 cursor-pointer flex-col text-left"
									onclick={() => handleSelectBoard(item.id)}
								>
									<div class="flex items-center gap-2">
										<span class="font-medium text-text">{item.title}</span>
										{#if item.id === board.id}
											<span
												class="py-0.2 border border-accent bg-accent/20 px-1 text-[9px] text-accent {themeStore.current ===
												'classic'
													? 'rounded-md font-semibold'
													: 'uppercase'}"
											>
												Active
											</span>
										{/if}
									</div>

									<div class="mt-1 flex items-center gap-2 text-[10px] text-muted">
										{#if item.context}
											<span class="text-text-soft">"{item.context}"</span>
											<span>&bull;</span>
										{/if}
										<span>{item.cardCount} cards</span>
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
											class="cursor-pointer border border-transparent p-1.5 text-muted transition-colors hover:border-status-fail hover:text-status-fail {themeStore.current ===
											'classic'
												? 'rounded-md hover:bg-red-500/10'
												: ''}"
											onclick={() => handleDeleteBoard(item.id)}
											title="Delete saved board"
											aria-label="Delete board"
										>
											<Trash2 size={12} />
										</button>

										<button
											type="button"
											class="flex cursor-pointer items-center gap-1 border border-line bg-bg px-2.5 py-1 text-xs text-text transition-colors hover:border-accent hover:text-accent-strong {themeStore.current ===
											'classic'
												? 'rounded-lg border-zinc-700 bg-zinc-800'
												: ''}"
											onclick={() => handleSelectBoard(item.id)}
										>
											<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Open</span>
											<ArrowRight size={10} />
										</button>
									{:else}
										<div class="flex items-center gap-1 px-2 text-[10px] text-accent">
											<Check size={11} />
											<span class={themeStore.current === 'hyv' ? 'uppercase' : 'font-semibold'}>
												Loaded
											</span>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{:else}
				<!-- Templates List -->
				<div
					class="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 text-xs {themeStore.current ===
					'classic'
						? 'font-sans'
						: 'font-mono'}"
				>
					{#each STARTER_TEMPLATES as template (template.id)}
						<div
							class="flex items-center justify-between border border-line bg-bg/60 p-3 transition-all hover:border-accent {themeStore.current ===
							'classic'
								? 'rounded-xl'
								: ''}"
						>
							<div class="flex items-center gap-3">
								<img
									src={template.thumbnail}
									alt=""
									referrerpolicy="no-referrer"
									class="h-10 w-10 shrink-0 border border-line bg-bg object-contain p-1 {themeStore.current ===
									'classic'
										? 'rounded-lg'
										: ''}"
								/>
								<div>
									<h4 class="font-medium text-text">{template.title}</h4>
									<p class="mt-0.5 line-clamp-1 text-[10px] text-muted">
										{template.description}
									</p>
									<div class="mt-1 flex items-center gap-2 text-[9px] text-muted">
										<span
											class="py-0.2 border border-line bg-bg px-1 text-text-soft {themeStore.current ===
											'classic'
												? 'rounded-sm'
												: ''}"
										>
											{template.tiers.length} tiers
										</span>
										<span
											class="py-0.2 border border-line bg-bg px-1 text-text-soft {themeStore.current ===
											'classic'
												? 'rounded-sm'
												: ''}"
										>
											{template.items.length} starter cards
										</span>
									</div>
								</div>
							</div>

							<button
								type="button"
								class="flex shrink-0 cursor-pointer items-center gap-1 border border-accent bg-accent/15 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent/25 hover:text-accent-strong {themeStore.current ===
								'classic'
									? 'rounded-lg'
									: ''}"
								onclick={() => handleLoadTemplate(template)}
							>
								<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>Load</span>
								<ArrowRight size={11} />
							</button>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Footer -->
			<div
				class="mt-4 border-t border-line pt-3 text-right text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				<button
					type="button"
					class="cursor-pointer border border-line bg-bg px-4 py-1.5 text-muted transition-colors hover:text-text {themeStore.current ===
					'classic'
						? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
						: ''}"
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
