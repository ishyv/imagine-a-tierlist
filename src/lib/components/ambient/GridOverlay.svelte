<script>
	/**
	 * @type {{
	 *   class?: string;
	 *   opacity?: number;
	 * }}
	 */
	let { class: className = '', opacity = 0.05 } = $props();
</script>

<div
	class="pointer-events-none absolute inset-0 {className}"
	style="
		background-image:
			linear-gradient(to right, rgba(199, 156, 87, {opacity}) 1px, transparent 1px),
			linear-gradient(to bottom, rgba(121, 166, 163, {opacity * 0.9}) 1px, transparent 1px);
		background-size: 64px 64px;
		mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
		-webkit-mask-image: linear-gradient(to bottom, transparent, black 12%, black 88%, transparent);
	"
	aria-hidden="true"
></div>
