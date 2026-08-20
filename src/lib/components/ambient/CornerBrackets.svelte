<script>
	/**
	 * @type {{
	 *   size?: number;
	 *   color?: string;
	 *   class?: string;
	 * }}
	 */
	let { size = 24, color = 'var(--line-strong)', class: className = '' } = $props();
</script>

<div class="pointer-events-none absolute inset-0 {className}" aria-hidden="true">
	<span
		class="absolute top-0 left-0 border-t border-l"
		style:width="{size}px"
		style:height="{size}px"
		style:border-color={color}
	></span>
	<span
		class="absolute top-0 right-0 border-t border-r"
		style:width="{size}px"
		style:height="{size}px"
		style:border-color={color}
	></span>
	<span
		class="absolute bottom-0 left-0 border-b border-l"
		style:width="{size}px"
		style:height="{size}px"
		style:border-color={color}
	></span>
	<span
		class="absolute right-0 bottom-0 border-r border-b"
		style:width="{size}px"
		style:height="{size}px"
		style:border-color={color}
	></span>
</div>
