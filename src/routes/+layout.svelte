<script>
	import './layout.css';

	let { children } = $props();

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Imagine a Tier List',
		alternateName: 'Imagine a Tierlist',
		applicationCategory: 'MultimediaApplication',
		operatingSystem: 'All',
		browserRequirements: 'Requires JavaScript. Requires modern browser.',
		description:
			'Create custom tier lists instantly without uploading images. Search topics, generate batch suggestions with AI, and auto-rank with intelligent reasoning.',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		featureList: [
			'Instant image search card generation without file uploads',
			'AI-powered topic suggestions and bulk card generation',
			'Automated tier ranking with AI reasoning',
			'Interactive drag and drop tier board',
			'Customizable tier labels, colors, and order',
			'JSON export and import'
		]
	};
	// eslint-disable-next-line no-unused-vars
	const jsonLdString = JSON.stringify(structuredData);
</script>

<svelte:head>
	<!-- Standard Icons & Manifest -->
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
	<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/site.webmanifest" />

	<!-- Core Search & Discovery Tags -->
	<meta
		name="keywords"
		content="tier list, tier list maker, ai tier list, auto rank, tier maker, tier list generator, ranking maker, tier list online, tier maker without upload, ai ranking"
	/>
	<meta name="author" content="Imagine a Tier List" />
	<meta name="creator" content="Imagine a Tier List" />
	<meta
		name="robots"
		content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	/>

	<!-- Open Graph (Facebook / Discord / LinkedIn / iMessage) -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Imagine a Tier List" />
	<meta property="og:title" content="Imagine a Tier List - AI-Powered On-Demand Tier List Maker" />
	<meta
		property="og:description"
		content="Create custom tier lists instantly without uploading images. Search topics, generate suggestions with AI, and auto-rank cards with intelligent reasoning."
	/>
	<meta property="og:image" content="/og-image.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta
		property="og:image:alt"
		content="Imagine a Tier List - AI-Powered On-Demand Tier List Maker"
	/>
	<meta property="og:image:type" content="image/png" />
	<meta property="og:locale" content="en_US" />

	<!-- Twitter / X Cards -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Imagine a Tier List - AI-Powered On-Demand Tier List Maker" />
	<meta
		name="twitter:description"
		content="Create custom tier lists instantly without uploading images. Search topics, generate suggestions with AI, and auto-rank cards with intelligent reasoning."
	/>
	<meta name="twitter:image" content="/og-image.png" />
	<meta
		name="twitter:image:alt"
		content="Imagine a Tier List - AI-Powered On-Demand Tier List Maker"
	/>

	<!-- JSON-LD Structured Data Schema -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<!-- prettier-ignore -->
	<script type="application/ld+json">
		{@html jsonLdString}
	</script>
</svelte:head>

{@render children()}
