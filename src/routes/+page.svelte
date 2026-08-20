<script>
	import { onMount } from 'svelte';
	import { board } from '#lib/stores/board.svelte.js';
	import Header from '#lib/components/Header.svelte';
	import AddItem from '#lib/components/AddItem.svelte';
	import TierBoard from '#lib/components/TierBoard.svelte';
	import Footer from '#lib/components/Footer.svelte';

	onMount(() => {
		board.init();
	});
</script>

<svelte:head>
	<title
		>{board.title && board.title !== 'Tier List'
			? `${board.title} - Imagine a Tier List`
			: 'Imagine a Tier List - AI-Powered On-Demand Tier List Maker'}</title
	>
	<meta
		name="description"
		content="Create custom tier lists instantly without uploading images. Search topics to generate cards on the fly, brainstorm with AI suggestions, and auto-rank with intelligent reasoning."
	/>
</svelte:head>

<main
	class="flex min-h-screen flex-col justify-between bg-zinc-950 px-3 py-6 text-zinc-100 selection:bg-blue-500/30 sm:px-6 md:px-8"
>
	<div class="mx-auto w-full max-w-6xl space-y-6">
		<Header />
		<AddItem />
		<TierBoard />
	</div>

	<Footer />
</main>
