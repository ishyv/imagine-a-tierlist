<script>
	/**
	 * @type {{
	 *   active?: boolean;
	 *   class?: string;
	 * }}
	 */
	let { active = true, class: className = '' } = $props();
</script>

{#if active}
	<div class="pointer-events-none absolute inset-0 overflow-hidden {className}" aria-hidden="true">
		<div
			class="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[rgba(199,156,87,0.12)] to-transparent"
			style="animation: scan-sweep 4s linear infinite;"
		></div>
	</div>
{/if}
