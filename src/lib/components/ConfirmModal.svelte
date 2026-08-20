<script>
	import { AlertTriangle } from 'lucide-svelte';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import CornerBrackets from './ambient/CornerBrackets.svelte';

	/**
	 * @type {{
	 *   open?: boolean;
	 *   title?: string;
	 *   message?: string;
	 *   confirmLabel?: string;
	 *   cancelLabel?: string;
	 *   danger?: boolean;
	 *   onconfirm: () => void;
	 *   oncancel: () => void;
	 * }}
	 */
	let {
		open = false,
		title = 'Confirm Directive?',
		message = '',
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		danger = false,
		onconfirm,
		oncancel
	} = $props();

	/**
	 * @param {KeyboardEvent} e
	 */
	function handleKeydown(e) {
		if (e.key === 'Escape' && open) {
			oncancel();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="shadow-veil relative w-full max-w-md border border-line bg-bg-elev p-6 text-text {themeStore.current ===
			'classic'
				? 'rounded-xl border-zinc-800 bg-zinc-900 font-sans shadow-2xl'
				: 'font-mono text-xs'}"
		>
			{#if themeStore.current === 'hyv'}
				<CornerBrackets size={14} />
			{/if}

			<button
				type="button"
				class="absolute top-4 right-4 text-xs text-muted hover:text-text"
				onclick={oncancel}
				aria-label="Close dialog"
			>
				&times;
			</button>

			<div class="flex items-start gap-4">
				<div
					class="shrink-0 border p-2 {themeStore.current === 'classic' ? 'rounded-lg' : ''} {danger
						? 'border-status-fail/40 text-status-fail'
						: 'border-line text-accent'}"
				>
					<AlertTriangle size={18} />
				</div>
				<div class="flex-1 space-y-1.5 pr-4">
					<h3
						class="text-sm font-medium tracking-wide text-text {themeStore.current === 'hyv'
							? 'uppercase'
							: 'font-semibold'}"
					>
						{title}
					</h3>
					<p class="text-xs leading-relaxed text-muted">{message}</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-2">
				<button
					type="button"
					class="cursor-pointer border border-line bg-bg px-3.5 py-1.5 text-xs text-muted transition-colors hover:text-text {themeStore.current ===
					'classic'
						? 'rounded-lg border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
						: ''}"
					onclick={oncancel}
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					class="cursor-pointer border px-4 py-1.5 text-xs font-medium transition-colors {themeStore.current ===
					'classic'
						? 'rounded-lg'
						: ''} {danger
						? 'border-status-fail bg-status-fail/20 text-status-fail hover:bg-status-fail/30'
						: 'border-accent bg-accent/20 text-accent hover:bg-accent/30 hover:text-accent-strong'}"
					onclick={onconfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
