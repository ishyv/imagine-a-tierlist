<script>
	import { onMount } from 'svelte';

	/**
	 * Perspective horizon grid drawn via canvas. Provides atmospheric depth behind the tier board.
	 * @type {{
	 *   rows?: number;
	 *   cols?: number;
	 *   vanishY?: number;
	 *   animated?: boolean;
	 *   class?: string;
	 * }}
	 */
	let { rows = 14, cols = 10, vanishY = 0.35, animated = true, class: className = '' } = $props();

	let rootEl = $state(/** @type {HTMLDivElement | undefined} */ (undefined));
	let canvasEl = $state(/** @type {HTMLCanvasElement | undefined} */ (undefined));
	let animFrame = 0;
	let isVisible = $state(true);

	/** @type {CanvasRenderingContext2D | null} */
	let ctx = null;
	let logicalW = 0;
	let logicalH = 0;
	let offset = 0;
	let lastT = 0;

	const prefersReduced =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	/**
	 * @param {number} t
	 */
	function draw(t) {
		if (!ctx || !logicalW || !logicalH) return;

		const w = logicalW;
		const h = logicalH;
		const vpX = w / 2;
		const vpY = h * vanishY;

		ctx.clearRect(0, 0, w, h);

		// Horizontal receding lines
		for (let i = 0; i < rows; i++) {
			const progress = (i + t) / rows;
			if (progress > 1) continue;
			const y = vpY + (h - vpY) * Math.pow(progress, 1.7);
			const nearness = Math.pow(progress, 0.85);

			// Warm gold near, cool teal far
			const r = Math.round(199 * nearness + 121 * (1 - nearness));
			const g = Math.round(156 * nearness + 166 * (1 - nearness));
			const b = Math.round(87 * nearness + 163 * (1 - nearness));
			const alpha = (0.16 * nearness + 0.04 * (1 - nearness)) * Math.min(1, progress * 4);

			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
			ctx.lineWidth = 1;
			ctx.stroke();
		}

		// Vertical convergence lines
		for (let i = 0; i < cols; i++) {
			const xBottom = (i / (cols - 1)) * w;
			const progress = Math.abs(i / (cols - 1) - 0.5) * 2; // 0 at center, 1 at edges
			const edgeFade = 1 - Math.pow(progress, 2) * 0.65;
			const alpha = 0.08 * edgeFade;

			ctx.beginPath();
			ctx.moveTo(vpX, vpY);
			ctx.lineTo(xBottom, h);
			ctx.strokeStyle = `rgba(199, 156, 87, ${alpha})`;
			ctx.lineWidth = 1;
			ctx.stroke();
		}
	}

	function stop() {
		if (animFrame) cancelAnimationFrame(animFrame);
		animFrame = 0;
	}

	/**
	 * @param {number} t
	 */
	function tick(t) {
		if (!animated || prefersReduced || document.hidden || !isVisible) {
			stop();
			return;
		}

		const dt = lastT ? t - lastT : 16;
		if (lastT && dt < 30) {
			animFrame = requestAnimationFrame(tick);
			return;
		}
		lastT = t;

		offset = (offset + dt * 0.00012) % 1;
		draw(offset);
		animFrame = requestAnimationFrame(tick);
	}

	function start() {
		if (animFrame) return;
		lastT = 0;
		animFrame = requestAnimationFrame(tick);
	}

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	function syncCanvasSize(width, height) {
		if (!canvasEl) return;
		if (!ctx) ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		logicalW = width;
		logicalH = height;

		canvasEl.width = Math.max(1, Math.floor(width * dpr));
		canvasEl.height = Math.max(1, Math.floor(height * dpr));
		canvasEl.style.width = `${width}px`;
		canvasEl.style.height = `${height}px`;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		draw(offset);
	}

	onMount(() => {
		if (!rootEl || !canvasEl) return;
		ctx = canvasEl.getContext('2d');

		const ro = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const { width, height } = entry.contentRect;
			syncCanvasSize(width, height);
		});
		ro.observe(rootEl);

		const io = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry) return;
				isVisible = entry.isIntersecting;
			},
			{ root: null, threshold: 0 }
		);
		io.observe(rootEl);

		function onVisibility() {
			if (document.hidden) stop();
			else if (animated && !prefersReduced && isVisible) start();
		}

		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			document.removeEventListener('visibilitychange', onVisibility);
			io.disconnect();
			ro.disconnect();
			stop();
		};
	});

	$effect(() => {
		if (!canvasEl) return;
		draw(offset);

		if (
			animated &&
			!prefersReduced &&
			isVisible &&
			typeof document !== 'undefined' &&
			!document.hidden
		) {
			start();
		} else {
			stop();
		}
	});
</script>

<div
	bind:this={rootEl}
	class="pointer-events-none absolute inset-0 overflow-hidden {className}"
	aria-hidden="true"
>
	<canvas bind:this={canvasEl} class="block h-full w-full opacity-60"></canvas>
</div>
