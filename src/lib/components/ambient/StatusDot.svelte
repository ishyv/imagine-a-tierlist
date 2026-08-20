<script>
	/**
	 * @type {{
	 *   status?: 'ok' | 'pend' | 'warn' | 'fail';
	 *   size?: number;
	 *   class?: string;
	 * }}
	 */
	let { status = 'ok', size = 6, class: className = '' } = $props();

	const colorMap = {
		ok: 'var(--status-ok)',
		pend: 'var(--status-pend)',
		warn: 'var(--status-warn)',
		fail: 'var(--status-fail)'
	};
</script>

<span
	class="inline-block shrink-0 rounded-full {className}"
	style="
		width: {size}px;
		height: {size}px;
		background-color: {colorMap[status] || colorMap.ok};
		animation: pulse-dot 2.2s ease-in-out infinite;
	"
	aria-hidden="true"
></span>
