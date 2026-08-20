<script>
	import { Sparkles, X, Loader2, AlertCircle, Check, ArrowRight } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { fetchAutoRank } from '#lib/services/ai.js';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   onclose: () => void;
	 * }}
	 */
	let { open = false, onclose } = $props();

	let criteria = $state('Overall Quality & Critical Acclaim');
	let customCriteria = $state('');
	/** @type {'unranked' | 'all'} */
	let targetScope = $state('unranked');
	let isLoading = $state(false);
	let error = $state('');

	const PRESETS = [
		'Overall Quality & Critical Acclaim',
		'Popularity & Fan Favorites',
		'Power Level & Competitive Meta',
		'Historical Significance & Iconic Status',
		'Funniest / Most Memorable'
	];

	let unrankedItems = $derived(board.getItemsForTier(null));
	let allItems = $derived(board.items);
	let targetItems = $derived(targetScope === 'unranked' ? unrankedItems : allItems);

	$effect(() => {
		if (open) {
			error = '';
			isLoading = false;
			// Default to all if unranked is empty
			if (unrankedItems.length === 0 && allItems.length > 0) {
				targetScope = 'all';
			} else {
				targetScope = 'unranked';
			}
		}
	});

	async function handleAutoRank() {
		if (targetItems.length === 0) {
			error = 'No items found in the selected scope to rank.';
			return;
		}

		if (board.tiers.length === 0) {
			error = 'Please add at least one tier to your board first.';
			return;
		}

		isLoading = true;
		error = '';

		const activeCriteria = customCriteria.trim() || criteria;
		const itemsToRank = targetItems.map((i) => ({ id: i.id, name: i.name }));
		const tiersList = board.tiers.map((t) => ({ id: t.id, label: t.label, order: t.order }));

		const res = await fetchAutoRank(
			itemsToRank,
			tiersList,
			activeCriteria,
			board.context || board.title
		);
		isLoading = false;

		if (res.error || !res.rankings || res.rankings.length === 0) {
			error = res.message || 'Auto-ranking failed. Please try again.';
			return;
		}

		board.applyRankings(res.rankings);
		onclose();
	}

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open && !isLoading) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
		aria-label="Auto-Rank with AI"
	>
		<div
			class="animate-in fade-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-2xl duration-150"
		>
			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-5 py-3.5"
			>
				<div class="flex items-center gap-2">
					<div class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5 text-amber-400">
						<Sparkles size={18} />
					</div>
					<div>
						<h3 class="text-base font-semibold text-zinc-100">Auto-Rank with AI</h3>
						<p class="text-xs text-zinc-400">
							Distribute cards across tiers automatically as an initial debate draft.
						</p>
					</div>
				</div>
				<button
					type="button"
					disabled={isLoading}
					class="cursor-pointer rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
					onclick={onclose}
					aria-label="Close auto rank modal"
				>
					<X size={18} />
				</button>
			</div>

			<!-- Body -->
			<div class="space-y-4 overflow-y-auto p-5">
				{#if error}
					<div
						class="flex items-center gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300"
					>
						<AlertCircle size={16} class="shrink-0 text-red-400" />
						<span>{error}</span>
					</div>
				{/if}

				<!-- Target Scope -->
				<div>
					<span class="mb-1.5 block text-xs font-semibold text-zinc-300">Items to Rank:</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							class="flex cursor-pointer flex-col rounded-xl border p-2.5 text-left transition-colors {targetScope ===
							'unranked'
								? 'border-amber-500 bg-amber-500/10 text-zinc-100'
								: 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800/60'}"
							onclick={() => (targetScope = 'unranked')}
							disabled={isLoading}
						>
							<span class="text-xs font-semibold">Unranked Pool Only</span>
							<span class="text-[11px] text-zinc-500">{unrankedItems.length} cards</span>
						</button>

						<button
							type="button"
							class="flex cursor-pointer flex-col rounded-xl border p-2.5 text-left transition-colors {targetScope ===
							'all'
								? 'border-amber-500 bg-amber-500/10 text-zinc-100'
								: 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800/60'}"
							onclick={() => (targetScope = 'all')}
							disabled={isLoading}
						>
							<span class="text-xs font-semibold">Entire Board (Re-rank)</span>
							<span class="text-[11px] text-zinc-500">{allItems.length} cards total</span>
						</button>
					</div>
				</div>

				<!-- Criteria Presets -->
				<div>
					<span class="mb-1.5 block text-xs font-semibold text-zinc-300">Ranking Criteria:</span>
					<div class="space-y-1.5">
						{#each PRESETS as preset (preset)}
							<button
								type="button"
								class="flex w-full cursor-pointer items-center justify-between rounded-lg border p-2 text-left text-xs transition-colors {criteria ===
									preset && !customCriteria.trim()
									? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
									: 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'}"
								onclick={() => {
									criteria = preset;
									customCriteria = '';
								}}
								disabled={isLoading}
							>
								<span>{preset}</span>
								{#if criteria === preset && !customCriteria.trim()}
									<Check size={14} class="text-amber-400" />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Custom Criteria Input -->
				<div>
					<label for="custom-criteria" class="mb-1 block text-[11px] font-medium text-zinc-400">
						Or define custom criteria / prompt:
					</label>
					<input
						id="custom-criteria"
						type="text"
						bind:value={customCriteria}
						placeholder="e.g. 'Rank by spice level' or 'Rank by nostalgic value'..."
						class="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
						disabled={isLoading}
					/>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-5 py-3">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
					onclick={onclose}
					disabled={isLoading}
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={targetItems.length === 0 || isLoading}
					class="flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-zinc-950 shadow-md transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
					onclick={handleAutoRank}
				>
					{#if isLoading}
						<Loader2 size={13} class="animate-spin" />
						<span>Ranking {targetItems.length} Cards...</span>
					{:else}
						<Sparkles size={13} />
						<span>Auto-Rank {targetItems.length} Cards</span>
						<ArrowRight size={13} />
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
