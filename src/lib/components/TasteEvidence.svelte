<script>
	import { ExternalLink, Image as ImageIcon } from 'lucide-svelte';

	/** @type {{ board: import('#lib/types.js').Board; snapshot: import('#lib/types.js').TasteProfileSnapshot; selectedIds?: string[]; title?: string }} */
	let { board, snapshot, selectedIds = [], title = 'Evidence' } = $props();

	let itemById = $derived(new Map(board.items.map((item) => [item.id, item])));
	let enrichmentById = $derived(new Map(snapshot.enrichedItems.map((item) => [item.itemId, item])));
	let ids = $derived([...new Set(selectedIds)]);
</script>

<section class="border border-line bg-bg-surface p-4" aria-label={title}>
	<h3 class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">{title}</h3>
	<div class="mt-3 grid gap-3 sm:grid-cols-2">
		{#each ids as itemId (itemId)}
			{@const item = itemById.get(itemId)}
			{@const enriched = enrichmentById.get(itemId)}
			{#if item}
				<article class="flex gap-3 border border-line/70 bg-bg p-2.5">
					<div
						class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-line bg-bg-elev"
					>
						{#if item.imageUrl}
							<img src={item.imageUrl} alt="" class="h-full w-full object-cover" loading="lazy" />
						{:else}
							<ImageIcon size={16} class="text-muted" aria-hidden="true" />
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between gap-2">
							<p class="truncate text-sm font-medium text-text">{item.name}</p>
							<span class="shrink-0 font-mono text-[10px] text-accent"
								>{board.tiers.find((tier) => tier.id === item.tierId)?.label || '?'}</span
							>
						</div>
						<p class="mt-1 text-[11px] leading-relaxed text-muted">
							{enriched?.canonicalName || 'Metadata unavailable'} · {enriched?.confidence || 'low'} confidence
						</p>
						{#if enriched?.sources?.length}
							<div class="mt-1 flex flex-wrap gap-2">
								{#each enriched.sources.slice(0, 2) as source (source.url)}
									<a
										href={source.url}
										target="_blank"
										rel="noreferrer"
										class="inline-flex items-center gap-1 text-[10px] text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-strong"
									>
										{source.label || source.provider}<ExternalLink size={10} />
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</article>
			{:else}
				<p class="text-sm text-muted">Evidence item unavailable: {itemId}</p>
			{/if}
		{:else}
			<p class="text-sm text-muted">No item-level evidence was returned for this claim.</p>
		{/each}
	</div>
</section>
