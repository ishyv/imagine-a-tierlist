<script>
	import { HelpCircle } from 'lucide-svelte';

	/** @type {{ dimensions?: import('#lib/types.js').TasteVectorDimension[]; onwhy?: (dimension: import('#lib/types.js').TasteVectorDimension) => void }} */
	let { dimensions = [], onwhy } = $props();
</script>

<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
	{#each dimensions as dimension (dimension.id)}
		<article class="border border-line bg-bg-surface p-4 shadow-xs">
			<div class="flex items-start justify-between gap-3">
				<div>
					<h3 class="font-mono text-xs font-semibold tracking-wide text-text uppercase">
						{dimension.name}
					</h3>
					<p class="mt-1 font-mono text-[10px] text-muted-strong uppercase">
						{dimension.confidence} confidence
					</p>
				</div>
				<div class="flex items-center gap-2">
					<span class="font-mono text-2xl font-semibold text-accent"
						>{dimension.score}<span class="text-sm text-muted-strong">/10</span></span
					>
					<button
						type="button"
						class="cursor-pointer rounded-full border border-line p-1 text-muted transition-colors hover:border-accent hover:text-accent focus:ring-2 focus:ring-accent/50 focus:outline-none"
						onclick={() => onwhy?.(dimension)}
						title={`Why ${dimension.name}?`}
						aria-label={`Show evidence for ${dimension.name}`}
					>
						<HelpCircle size={13} />
					</button>
				</div>
			</div>
			<div class="mt-3 h-1.5 overflow-hidden bg-bg">
				<div
					class="h-full bg-accent transition-all"
					style={`width: ${dimension.score * 10}%`}
				></div>
			</div>
			<p class="mt-3 text-sm leading-relaxed text-text-soft">{dimension.summary}</p>
		</article>
	{:else}
		<p class="border border-dashed border-line p-5 text-sm text-muted">
			No vector dimensions met the evidence threshold.
		</p>
	{/each}
</div>
