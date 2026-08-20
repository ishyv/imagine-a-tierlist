<script>
	import StatusDot from './ambient/StatusDot.svelte';
	import { themeStore } from '#lib/stores/theme.svelte.js';
</script>

<footer class="relative z-10 mt-20 w-full border-t border-line pt-8 pb-12">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-2 text-muted sm:flex-row {themeStore.current ===
		'hyv'
			? 'tracking-meta font-mono text-[11px]'
			: 'font-sans text-xs'}"
	>
		<!-- App Identity & Status -->
		<div class="flex flex-wrap items-center gap-3">
			{#if themeStore.current === 'hyv'}
				<div class="flex items-center gap-1.5">
					<StatusDot status="ok" size={5} />
					<span class="text-text-soft uppercase">SYS_NOMINAL</span>
				</div>
				<span class="text-line-strong">/</span>
				<span class="text-muted lowercase">imagine a tier list</span>
				<span class="text-line-strong">/</span>
				<span class="text-muted-strong lowercase">on-demand visual ranking</span>
			{:else}
				<span class="font-semibold text-zinc-300">Imagine a Tier List</span>
				<span class="text-zinc-600">&middot;</span>
				<span class="text-zinc-400">On-demand AI visual tier lists</span>
			{/if}
		</div>

		<!-- Signature & Link -->
		<div class="flex items-center gap-2 text-muted">
			<span>2026</span>
			<span class="text-line-strong">&middot;</span>
			<span>
				by
				<a
					href="https://hyvui.vercel.app"
					target="_blank"
					rel="noopener noreferrer"
					class="text-accent transition-colors duration-150 hover:text-accent-strong hover:underline hover:decoration-accent/50 hover:underline-offset-4 {themeStore.current ===
					'hyv'
						? 'font-mono'
						: 'font-semibold'}"
				>
					hyvnt
				</a>
			</span>
		</div>
	</div>
</footer>
