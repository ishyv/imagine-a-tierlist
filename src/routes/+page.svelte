<script>
	import { onMount } from 'svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import Header from '#lib/components/Header.svelte';
	import AddItem from '#lib/components/AddItem.svelte';
	import TierBoard from '#lib/components/TierBoard.svelte';
	import Footer from '#lib/components/Footer.svelte';
	import GridOverlay from '#lib/components/ambient/GridOverlay.svelte';
	import HorizonGrid from '#lib/components/ambient/HorizonGrid.svelte';

	onMount(() => {
		themeStore.init();
		board.init();
	});
</script>

<svelte:head>
	<title
		>{board.title && board.title !== 'Tier List'
			? `${board.title} — Imagine a Tier List`
			: 'Imagine a Tier List // Instant Visual Ranking'}</title
	>
	<meta
		name="description"
		content="Create custom tier lists instantly without uploading images. Search topics to generate cards on the fly, brainstorm with AI suggestions, and auto-rank with intelligent reasoning."
	/>
</svelte:head>

<main
	class="relative flex min-h-screen flex-col justify-between px-3 py-6 text-text transition-colors duration-200 sm:px-6 md:px-10 lg:px-12"
>
	{#if themeStore.current === 'hyv'}
		<!-- Ambient subtle background grid in Hyv mode -->
		<GridOverlay opacity={0.04} />

		<!-- Atmospheric 3D Horizon Grid grounding the workspace -->
		<div class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 overflow-hidden">
			<HorizonGrid rows={16} cols={12} vanishY={0.25} animated={true} />
		</div>
	{/if}

	<div class="relative z-10 mx-auto w-full max-w-6xl space-y-10">
		<Header />
		<AddItem />
		<TierBoard />
	</div>

	<Footer />
</main>
