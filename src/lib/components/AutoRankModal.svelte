<script>
	import { Sparkles, Loader2, AlertCircle, Check, ArrowRight } from 'lucide-svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { fetchAutoRank } from '#lib/services/ai.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';
	import ScanBand from './ambient/ScanBand.svelte';

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
			if (unrankedItems.length === 0 && allItems.length > 0) {
				targetScope = 'all';
			} else {
				targetScope = 'unranked';
			}
		}
	});

	async function handleAutoRank() {
		if (targetItems.length === 0) {
			error = 'No target cards found in selected scope.';
			return;
		}

		if (board.tiers.length === 0) {
			error = 'Initialize at least one tier row on the board first.';
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
			error = res.message || 'Auto-ranking execution failed.';
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
			class="shadow-veil relative flex max-h-[90vh] w-full max-w-lg flex-col border border-line bg-bg-elev text-text {themeStore.current ===
			'classic'
				? 'overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: ''}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={16} />
				<ScanBand active={isLoading} />
			{/if}

			<!-- Header -->
			<div
				class="flex items-center justify-between border-b border-line bg-bg-elev/90 px-5 py-3 {themeStore.current ===
				'hyv'
					? 'font-mono'
					: 'font-sans'}"
			>
				<div class="flex items-center gap-2">
					<Sparkles
						size={14}
						class={themeStore.current === 'hyv' ? 'text-accent' : 'text-purple-400'}
					/>
					<div>
						<h3
							class="text-xs text-text {themeStore.current === 'hyv'
								? 'tracking-meta uppercase'
								: 'font-bold'}"
						>
							{themeStore.current === 'hyv' ? 'AI_AUTO_RANK // MATRIX_SOLVER' : 'Auto-Rank with AI'}
						</h3>
						<p class="text-[10px] text-muted">
							{themeStore.current === 'hyv'
								? 'heuristic distribution of entities across tiers'
								: 'Smart AI distribution of cards across tiers'}
						</p>
					</div>
				</div>
				<button
					type="button"
					disabled={isLoading}
					class="cursor-pointer text-xs text-muted hover:text-text disabled:opacity-40"
					onclick={onclose}
					aria-label="Close modal"
				>
					&times;
				</button>
			</div>

			<!-- Body -->
			<div
				class="space-y-4 overflow-y-auto p-5 text-xs {themeStore.current === 'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				{#if error}
					<div
						class="flex items-center gap-2.5 border border-status-fail/40 bg-status-fail/10 p-3 text-status-fail {themeStore.current ===
						'classic'
							? 'rounded-lg'
							: ''}"
					>
						<AlertCircle size={14} class="shrink-0 text-status-fail" />
						<span>{error}</span>
					</div>
				{/if}

				<!-- Target Scope -->
				<div>
					<span
						class="mb-1.5 block text-[10px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Target Scope:
					</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							type="button"
							class="flex cursor-pointer flex-col border p-2.5 text-left transition-colors {themeStore.current ===
							'classic'
								? 'rounded-lg'
								: ''} {targetScope === 'unranked'
								? 'border-accent bg-accent/10 text-text'
								: 'border-line bg-bg text-muted hover:border-line-strong'}"
							onclick={() => (targetScope = 'unranked')}
							disabled={isLoading}
						>
							<span class="text-xs font-medium {themeStore.current === 'hyv' ? 'uppercase' : ''}">
								Unranked Cards Only
							</span>
							<span class="text-[10px] text-muted">{unrankedItems.length} cards</span>
						</button>

						<button
							type="button"
							class="flex cursor-pointer flex-col border p-2.5 text-left transition-colors {themeStore.current ===
							'classic'
								? 'rounded-lg'
								: ''} {targetScope === 'all'
								? 'border-accent bg-accent/10 text-text'
								: 'border-line bg-bg text-muted hover:border-line-strong'}"
							onclick={() => (targetScope = 'all')}
							disabled={isLoading}
						>
							<span class="text-xs font-medium {themeStore.current === 'hyv' ? 'uppercase' : ''}">
								All Cards (Re-rank)
							</span>
							<span class="text-[10px] text-muted">{allItems.length} cards total</span>
						</button>
					</div>
				</div>

				<!-- Criteria Presets -->
				<div>
					<span
						class="mb-1.5 block text-[10px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Ranking Criteria:
					</span>
					<div class="space-y-1">
						{#each PRESETS as preset (preset)}
							<button
								type="button"
								class="flex w-full cursor-pointer items-center justify-between border p-2 text-left text-xs transition-colors {themeStore.current ===
								'classic'
									? 'rounded-lg'
									: ''} {criteria === preset && !customCriteria.trim()
									? 'border-accent bg-accent/15 font-medium text-accent-strong'
									: 'border-line bg-bg text-text-soft hover:border-line-strong'}"
								onclick={() => {
									criteria = preset;
									customCriteria = '';
								}}
								disabled={isLoading}
							>
								<span>{preset}</span>
								{#if criteria === preset && !customCriteria.trim()}
									<Check size={12} class="text-accent" />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<!-- Custom Criteria Input -->
				<div>
					<label
						for="custom-criteria"
						class="mb-1 block text-[10px] text-muted-strong {themeStore.current === 'hyv'
							? 'tracking-meta uppercase'
							: 'font-medium'}"
					>
						Or custom ranking directive:
					</label>
					<input
						id="custom-criteria"
						type="text"
						bind:value={customCriteria}
						placeholder="e.g. 'rank by strategic power' or 'rank by emotional depth'..."
						class="w-full border border-line bg-bg px-3 py-1.5 text-xs text-text placeholder:text-muted-strong focus:border-accent focus:outline-none {themeStore.current ===
						'classic'
							? 'rounded-lg border-zinc-700 bg-zinc-950'
							: ''}"
						disabled={isLoading}
					/>
				</div>
			</div>

			<!-- Footer -->
			<div
				class="flex items-center justify-between border-t border-line bg-bg px-5 py-3 text-xs {themeStore.current ===
				'classic'
					? 'font-sans'
					: 'font-mono'}"
			>
				<button
					type="button"
					class="cursor-pointer border border-line bg-bg-elev px-3.5 py-1.5 text-muted transition-colors hover:text-text {themeStore.current ===
					'classic'
						? 'rounded-lg border-zinc-700 bg-zinc-800'
						: ''}"
					onclick={onclose}
					disabled={isLoading}
				>
					Cancel
				</button>
				<button
					type="button"
					disabled={targetItems.length === 0 || isLoading}
					class="flex cursor-pointer items-center gap-1.5 border border-accent bg-accent/20 px-4 py-1.5 font-medium text-accent transition-all hover:bg-accent/30 hover:text-accent-strong disabled:pointer-events-none disabled:opacity-30 {themeStore.current ===
					'classic'
						? 'rounded-lg font-semibold'
						: ''}"
					onclick={handleAutoRank}
				>
					{#if isLoading}
						<Loader2 size={12} class="animate-spin text-accent" />
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
							Ranking {targetItems.length} Cards...
						</span>
					{:else}
						<Sparkles size={12} />
						<span class={themeStore.current === 'hyv' ? 'uppercase' : ''}>
							Auto-Rank {targetItems.length} Cards
						</span>
						<ArrowRight size={12} />
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
