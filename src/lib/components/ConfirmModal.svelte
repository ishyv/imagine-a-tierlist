<script>
	import { AlertTriangle, X } from 'lucide-svelte';

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
		title = 'Are you sure?',
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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="animate-in fade-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl duration-150"
		>
			<button
				type="button"
				class="absolute top-4 right-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
				onclick={oncancel}
				aria-label="Close dialog"
			>
				<X size={18} />
			</button>

			<div class="flex items-start gap-4">
				<div
					class="shrink-0 rounded-full p-2.5 {danger
						? 'border border-red-500/20 bg-red-500/10 text-red-400'
						: 'bg-zinc-800 text-zinc-300'}"
				>
					<AlertTriangle size={20} />
				</div>
				<div class="flex-1 space-y-1.5 pr-4">
					<h3 class="text-lg font-semibold text-zinc-100">{title}</h3>
					<p class="text-sm leading-relaxed text-zinc-400">{message}</p>
				</div>
			</div>

			<div class="mt-6 flex justify-end gap-2.5">
				<button
					type="button"
					class="cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
					onclick={oncancel}
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					class="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors {danger
						? 'bg-red-600 hover:bg-red-500'
						: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}"
					onclick={onconfirm}
				>
					{confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
