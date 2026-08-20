<script>
	/**
	 * @type {{
	 *   variant?: 'cross' | 'reticle' | 'coord' | 'plus';
	 *   size?: number;
	 *   color?: string;
	 *   class?: string;
	 * }}
	 */
	let {
		variant = 'cross',
		size = 14,
		color = 'var(--line-strong)',
		class: className = ''
	} = $props();
</script>

<svg
	class="pointer-events-none inline-block shrink-0 select-none {className}"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="1.2"
	aria-hidden="true"
>
	{#if variant === 'cross'}
		<line x1="12" y1="4" x2="12" y2="20" />
		<line x1="4" y1="12" x2="20" y2="12" />
		<circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
	{:else if variant === 'plus'}
		<line x1="12" y1="6" x2="12" y2="18" />
		<line x1="6" y1="12" x2="18" y2="12" />
	{:else if variant === 'reticle'}
		<circle cx="12" cy="12" r="8" />
		<circle cx="12" cy="12" r="2.5" />
		<line x1="12" y1="1" x2="12" y2="5" />
		<line x1="12" y1="19" x2="12" y2="23" />
		<line x1="1" y1="12" x2="5" y2="12" />
		<line x1="19" y1="12" x2="23" y2="12" />
	{:else if variant === 'coord'}
		<line x1="12" y1="2" x2="12" y2="8" />
		<line x1="12" y1="16" x2="12" y2="22" />
		<line x1="2" y1="12" x2="8" y2="12" />
		<line x1="16" y1="12" x2="22" y2="12" />
		<rect x="9" y="9" width="6" height="6" rx="0.5" />
	{/if}
</svg>
