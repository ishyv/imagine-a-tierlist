<script>
	/**
	 * @type {{
	 *   x1?: string;
	 *   y1?: string;
	 *   x2?: string;
	 *   y2?: string;
	 *   animated?: boolean;
	 *   class?: string;
	 * }}
	 */
	let {
		x1 = '0%',
		y1 = '0%',
		x2 = '100%',
		y2 = '100%',
		animated = true,
		class: className = ''
	} = $props();
</script>

<svg
	class="pointer-events-none absolute inset-0 h-full w-full overflow-visible {className}"
	aria-hidden="true"
>
	<line {x1} {y1} {x2} {y2} stroke="var(--line)" stroke-width="1" stroke-dasharray="3 3" />
	{#if animated}
		<circle r="2" fill="var(--accent)">
			<animateMotion
				dur="4s"
				repeatCount="indefinite"
				path="M 0,0 L 1,0"
				keyPoints="0;1"
				keyTimes="0;1"
				calcMode="linear"
			>
				<mpath>
					<line {x1} {y1} {x2} {y2} />
				</mpath>
			</animateMotion>
			<animate
				attributeName="opacity"
				values="0;0.9;0.9;0"
				keyTimes="0;0.1;0.85;1"
				dur="4s"
				repeatCount="indefinite"
			/>
		</circle>
	{/if}
</svg>
