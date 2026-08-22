<script>
	import { onMount } from 'svelte';
	import { ArrowLeft, Check, Loader2, RefreshCw, AlertTriangle } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { board } from '#lib/stores/board.svelte.js';
	import { themeStore } from '#lib/stores/theme.svelte.js';
	import { detectTasteProfile, enrichTasteProfile, analyzeTasteProfile } from '#lib/services/ai.js';
	import {
		getAnalysisEligibility,
		getRankedItems,
		getTasteProfileStatus
	} from '#lib/services/tasteProfile.js';
	import { loadBoardById, saveBoardToStorage } from '#lib/services/persistence.js';
	import GridOverlay from '#lib/components/ambient/GridOverlay.svelte';
	import HorizonGrid from '#lib/components/ambient/HorizonGrid.svelte';
	import CornerBrackets from '#lib/components/ambient/CornerBrackets.svelte';
	import TasteVector from '#lib/components/TasteVector.svelte';
	import TasteEvidence from '#lib/components/TasteEvidence.svelte';

	const PROFILE_OPTIONS = [
		{ id: 'games', label: 'Video Games', description: 'Play, worlds, expression, and mastery.' },
		{
			id: 'movies',
			label: 'Films & Television',
			description: 'Story, tone, image, performance, and identity.'
		},
		{ id: 'music', label: 'Music', description: 'Sound, emotion, performance, and atmosphere.' },
		{
			id: 'books',
			label: 'Books',
			description: 'Ideas, voice, characters, structure, and worlds.'
		},
		{ id: 'general', label: 'General Taste', description: 'Conservative cross-domain comparisons.' }
	];

	let { params } = $props();
	/** @type {import('#lib/types.js').Board | null} */
	let sourceBoard = $state(null);
	let loadError = $state('');
	let errorMessage = $state('');
	/** @type {string} */
	let stage = $state('idle');
	let language = $state('en');
	/** @type {import('#lib/types.js').JudgeProfileId} */
	let profileId = $state('general');
	let profileOverride = $state(false);
	/** @type {any} */
	let detection = $state(null);
	let profileOptions = $state(PROFILE_OPTIONS);
	/** @type {import('#lib/types.js').TasteVectorDimension | null} */
	let selectedDimension = $state(null);

	let eligibility = $derived(sourceBoard ? getAnalysisEligibility(sourceBoard) : null);
	let status = $derived(sourceBoard ? getTasteProfileStatus(sourceBoard) : null);
	let snapshot = $derived(status?.snapshot || null);
	let rankedItems = $derived(sourceBoard ? getRankedItems(sourceBoard) : []);
	let isRunning = $derived(['detecting', 'enriching', 'analyzing'].includes(stage));
	let selectedProfile = $derived(profileOptions.find((profile) => profile.id === profileId));

	onMount(() => {
		themeStore.init();
		board.init();
		language =
			typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('es')
				? 'es'
				: 'en';

		const requestedBoard = loadBoardById(params.boardId);
		if (requestedBoard) {
			sourceBoard = requestedBoard;
		} else if (board.id === params.boardId) {
			sourceBoard = {
				id: board.id,
				title: board.title,
				context: board.context,
				tiers: $state.snapshot(board.tiers),
				items: $state.snapshot(board.items),
				version: board.version,
				...(board.tasteProfile ? { tasteProfile: $state.snapshot(board.tasteProfile) } : {})
			};
		} else {
			loadError = 'This board could not be found in local storage.';
		}
	});

	/** @param {string} value */
	function stageLabel(value) {
		return (
			{
				detecting: 'Detecting judge profile',
				enriching: 'Enriching ranked entities',
				analyzing: 'Generating evidence-backed analysis',
				ready: 'Analysis ready',
				error: 'Analysis stopped',
				idle: 'Ready to analyze'
			}[value] || 'Ready to analyze'
		);
	}

	/** @param {Event & { currentTarget: HTMLSelectElement }} event */
	function handleLanguageChange(event) {
		language = event.currentTarget.value;
	}

	/** @param {Event & { currentTarget: HTMLSelectElement }} event */
	function handleProfileChange(event) {
		profileId = /** @type {import('#lib/types.js').JudgeProfileId} */ (event.currentTarget.value);
		profileOverride = true;
	}

	async function runAnalysis() {
		if (!sourceBoard || !eligibility?.eligible || isRunning) return;
		errorMessage = '';
		selectedDimension = null;

		try {
			stage = 'detecting';
			const detected = await detectTasteProfile(sourceBoard, language);
			if (detected.error) throw new Error(detected.message || detected.error);
			detection = detected;
			if (Array.isArray(detected.profiles) && detected.profiles.length)
				profileOptions = detected.profiles;
			if (!profileOverride) profileId = detected.suggestedProfile || 'general';

			stage = 'enriching';
			const enrichment = await enrichTasteProfile(sourceBoard, profileId, language);
			if (enrichment.error) throw new Error(enrichment.message || enrichment.error);

			stage = 'analyzing';
			const analyzed = await analyzeTasteProfile(
				sourceBoard,
				profileId,
				enrichment.enrichedItems || [],
				enrichment.enrichmentReport || [],
				language
			);
			if (analyzed.error) throw new Error(analyzed.message || analyzed.error);

			const generatedSnapshot = analyzed.snapshot || analyzed;
			if (!generatedSnapshot?.boardFingerprint)
				throw new Error('The service returned an incomplete snapshot.');
			const nextBoard = { ...sourceBoard, tasteProfile: generatedSnapshot };
			if (sourceBoard.id === board.id) {
				board.setTasteProfile(generatedSnapshot);
				sourceBoard = nextBoard;
			} else {
				sourceBoard = nextBoard;
				saveBoardToStorage(nextBoard);
			}
			stage = 'ready';
		} catch (error) {
			stage = 'error';
			errorMessage =
				error instanceof Error ? error.message : 'Taste Profile could not be generated.';
		}
	}
</script>

<svelte:head>
	<title>{sourceBoard?.title || 'Taste Profile'} — Imagine a Tier List</title>
	<meta name="description" content="Evidence-backed taste profile for a completed tier list." />
</svelte:head>

<main class="relative min-h-screen overflow-hidden px-3 py-6 text-text sm:px-6 md:px-10 lg:px-12">
	{#if themeStore.current === 'hyv'}
		<GridOverlay opacity={0.04} />
		<div class="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 overflow-hidden">
			<HorizonGrid rows={16} cols={12} vanishY={0.25} animated={true} />
		</div>
	{/if}

	<div class="relative z-10 mx-auto w-full max-w-6xl space-y-8">
		<header class="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
			<div>
				<button
					type="button"
					class="mb-3 inline-flex cursor-pointer items-center gap-2 text-xs text-muted transition-colors hover:text-accent"
					onclick={() => goto('/')}
				>
					<ArrowLeft size={14} /> Back to editor
				</button>
				<p class="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">
					taste_profile // local analysis
				</p>
				<h1 class="mt-2 text-3xl text-text sm:text-4xl">
					{sourceBoard?.title || 'Unavailable board'}
				</h1>
				<p class="mt-2 max-w-2xl text-sm text-muted">
					A curated judge profile reads the tier hierarchy and cites the original board items. It
					does not analyze images or diagnose the person who made the list.
				</p>
			</div>
			<div class="flex items-center gap-2">
				<label class="sr-only" for="language">Analysis language</label>
				<select
					id="language"
					value={language}
					onchange={handleLanguageChange}
					class="border border-line bg-bg-surface px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
				>
					<option value="en">English</option>
					<option value="es">Español</option>
				</select>
				<button
					type="button"
					class="inline-flex cursor-pointer items-center gap-2 border border-line bg-bg-surface px-3 py-2 text-xs text-text transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!eligibility?.eligible || isRunning}
					onclick={runAnalysis}
				>
					{#if isRunning}<Loader2 size={13} class="animate-spin" />{:else}<RefreshCw
							size={13}
						/>{/if}
					{snapshot ? 'Regenerate' : 'Analyze Taste'}
				</button>
			</div>
		</header>

		{#if loadError}
			<section
				class="border border-status-fail/40 bg-status-fail/10 p-5 text-sm text-status-fail"
				role="alert"
			>
				{loadError}
			</section>
		{:else if sourceBoard}
			<section class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
				<div class="relative border border-line bg-bg-surface p-5">
					{#if themeStore.current === 'hyv'}<CornerBrackets size={14} />{/if}
					<div class="flex items-start justify-between gap-4">
						<div>
							<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
								01 // eligibility
							</p>
							<h2 class="mt-2 text-xl text-text">
								{eligibility?.eligible ? 'Ready for a grounded reading' : 'This list is not ready'}
							</h2>
						</div>
						{#if eligibility?.eligible}<Check
								size={18}
								class="text-signal"
								aria-label="Eligible"
							/>{:else}<AlertTriangle
								size={18}
								class="text-status-fail"
								aria-label="Not eligible"
							/>{/if}
					</div>
					<p class="mt-3 text-sm leading-relaxed text-muted">{eligibility?.message}</p>
					<div class="mt-4 flex flex-wrap gap-3 font-mono text-[10px] text-muted-strong uppercase">
						<span>{eligibility?.rankedCount || 0} ranked</span>
						<span>{eligibility?.unrankedCount || 0} in buffer excluded</span>
						<span>{sourceBoard.tiers.length} tiers</span>
					</div>
					{#if eligibility?.orphanedCount}
						<p class="mt-3 text-xs text-status-fail">
							{eligibility.orphanedCount} item(s) reference a missing tier and are excluded.
						</p>
					{/if}
				</div>

				<div class="border border-line bg-bg-surface p-5">
					<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
						02 // judge profile
					</p>
					<label for="profile" class="mt-3 block text-sm font-medium text-text"
						>Methodology used for this reading</label
					>
					<select
						id="profile"
						value={profileId}
						onchange={handleProfileChange}
						class="mt-2 w-full border border-line bg-bg px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
					>
						{#each profileOptions as profile (profile.id)}<option value={profile.id}
								>{profile.label}</option
							>{/each}
					</select>
					<p class="mt-3 text-sm leading-relaxed text-muted">
						{selectedProfile?.description || 'Choose a curated judging framework.'}
					</p>
					{#if detection}
						<p class="mt-3 border-l-2 border-accent pl-3 text-xs leading-relaxed text-text-soft">
							Suggested: <span class="text-accent">{detection.suggestedProfile}</span> · {detection.rationale}
						</p>
					{/if}
				</div>
			</section>

			<div
				class="flex flex-wrap items-center gap-2 border-y border-line py-3"
				aria-live="polite"
				aria-busy={isRunning}
			>
				<span
					class="h-2 w-2 rounded-full {stage === 'error'
						? 'bg-status-fail'
						: stage === 'ready'
							? 'bg-signal'
							: isRunning
								? 'animate-pulse bg-accent'
								: 'bg-muted-strong'}"
				></span>
				<span class="font-mono text-[10px] tracking-[0.16em] text-muted uppercase"
					>{stageLabel(stage)}</span
				>
				{#if isRunning}<span class="text-xs text-muted"
						>Real pipeline stage; provider/model internals are not simulated.</span
					>{/if}
			</div>

			{#if errorMessage}
				<section
					class="border border-status-fail/40 bg-status-fail/10 p-4 text-sm text-status-fail"
					role="alert"
				>
					{errorMessage}
				</section>
			{/if}

			{#if status?.isStale && snapshot}
				<section
					class="border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200"
					role="status"
				>
					This snapshot is stale because the board changed. Regenerate to bind the reading to the
					current tiers and assignments.
				</section>
			{/if}

			{#if snapshot}
				<section class="relative overflow-hidden border border-accent/40 bg-bg-elev p-6 sm:p-8">
					{#if themeStore.current === 'hyv'}<CornerBrackets size={18} />{/if}
					<p class="font-mono text-[10px] tracking-[0.2em] text-accent uppercase">03 // reading</p>
					<h2 class="mt-3 max-w-3xl text-3xl leading-tight text-text sm:text-5xl">
						{snapshot.profile.title}
					</h2>
					<p class="mt-4 max-w-3xl text-base leading-relaxed text-text-soft">
						{snapshot.profile.summary}
					</p>
					<div class="mt-5 flex flex-wrap gap-3 font-mono text-[10px] text-muted-strong uppercase">
						<span>profile {snapshot.judgeProfileId} v{snapshot.judgeProfileVersion}</span>
						<span>{snapshot.profile.confidence} confidence</span>
						<span>{snapshot.language}</span>
					</div>
				</section>

				<section class="space-y-4" aria-labelledby="analysis-heading">
					<div>
						<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
							04 // analysis
						</p>
						<h2 id="analysis-heading" class="mt-2 text-2xl text-text">
							What the hierarchy rewards
						</h2>
					</div>
					{#each snapshot.sections as section (section.id)}
						<article class="border border-line bg-bg-surface p-5">
							<div class="flex flex-wrap items-start justify-between gap-3">
								<h3 class="text-lg text-text">{section.title}</h3>
								<span class="font-mono text-[10px] text-muted-strong uppercase"
									>{section.confidence}</span
								>
							</div>
							<p class="mt-3 text-base leading-relaxed font-medium text-accent">{section.thesis}</p>
							<p class="mt-3 text-sm leading-relaxed text-text-soft">{section.analysis}</p>
							<div class="mt-4 grid gap-3 md:grid-cols-2">
								<TasteEvidence
									board={sourceBoard}
									{snapshot}
									selectedIds={section.evidenceItemIds}
									title="Supporting evidence"
								/>
								{#if section.counterEvidenceItemIds?.length}<TasteEvidence
										board={sourceBoard}
										{snapshot}
										selectedIds={section.counterEvidenceItemIds}
										title="Counter-evidence"
									/>{/if}
							</div>
						</article>
					{:else}
						<p class="border border-dashed border-line p-5 text-sm text-muted">
							The judge found no supported analysis sections.
						</p>
					{/each}
				</section>

				<section class="border border-line bg-bg-surface p-5" aria-labelledby="mindset-heading">
					<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
						05 // mindset tensions
					</p>
					<h2 id="mindset-heading" class="mt-2 text-2xl text-text">
						Useful contrasts, not diagnoses
					</h2>
					<div class="mt-4 grid gap-3 md:grid-cols-2">
						{#each snapshot.mindset as contrast, index (`${contrast.left}-${contrast.right}-${index}`)}
							<article class="border border-line/70 bg-bg p-4">
								<div class="flex flex-wrap items-center gap-2 font-mono text-xs text-text">
									<span>{contrast.left}</span><span class="text-accent">↔</span><span
										>{contrast.right}</span
									>
								</div>
								<p class="mt-2 text-sm text-accent">Leans toward: {contrast.leansToward}</p>
								<p class="mt-2 text-sm leading-relaxed text-text-soft">{contrast.explanation}</p>
								<p class="mt-3 font-mono text-[10px] text-muted-strong">
									strength {contrast.strength}/10 · {contrast.evidenceItemIds.length} cited items
								</p>
							</article>
						{:else}<p class="text-sm text-muted">
								No mindset contrast reached the evidence threshold.
							</p>{/each}
					</div>
				</section>

				<section class="space-y-4" aria-labelledby="vector-heading">
					<div>
						<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
							06 // taste vector
						</p>
						<h2 id="vector-heading" class="mt-2 text-2xl text-text">
							Scores with a reason to exist
						</h2>
						<p class="mt-2 text-sm text-muted">
							Every score is bounded from 0–10 and tied to concrete items. Use “Why?” to inspect the
							supporting evidence.
						</p>
					</div>
					<TasteVector
						dimensions={snapshot.tasteVector}
						onwhy={(dimension) => (selectedDimension = dimension)}
					/>
					{#if selectedDimension}<TasteEvidence
							board={sourceBoard}
							{snapshot}
							selectedIds={selectedDimension.evidenceItemIds}
							title={`Why: ${selectedDimension.name}`}
						/>{/if}
				</section>

				<section class="border border-line bg-bg-surface p-5" aria-labelledby="limits-heading">
					<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">07 // limits</p>
					<h2 id="limits-heading" class="mt-2 text-2xl text-text">Where this reading stops</h2>
					<ul class="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
						{#each snapshot.limitations as limitation, index (`${limitation}-${index}`)}<li>
								{limitation}
							</li>{:else}<li>Unknowns remain where external metadata was unavailable.</li>{/each}
					</ul>
					<p class="mt-5 border-t border-line pt-4 text-sm leading-relaxed text-text-soft">
						{snapshot.closingSummary}
					</p>
				</section>

				<section class="border border-line bg-bg-surface p-5" aria-labelledby="visual-heading">
					<p class="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">
						08 // original evidence
					</p>
					<h2 id="visual-heading" class="mt-2 text-2xl text-text">The items as you ranked them</h2>
					<p class="mt-2 text-sm text-muted">
						Images are shown as visual evidence only. They were not analyzed automatically.
					</p>
					<div class="mt-4 flex gap-2 overflow-x-auto pb-2">
						{#each rankedItems as item (item.id)}
							<div
								class="w-20 shrink-0"
								title={`${item.name} · ${sourceBoard.tiers.find((tier) => tier.id === item.tierId)?.label || 'unranked'}`}
							>
								<div class="h-20 w-20 overflow-hidden border border-line bg-bg-elev">
									{#if item.imageUrl}<img
											src={item.imageUrl}
											alt=""
											class="h-full w-full object-cover"
											loading="lazy"
										/>{:else}<div
											class="flex h-full items-center justify-center text-xs text-muted"
										>
											—
										</div>{/if}
								</div>
								<p class="mt-1 truncate text-[10px] text-muted">{item.name}</p>
							</div>
						{/each}
					</div>
				</section>
			{:else}
				<section class="border border-dashed border-line bg-bg-surface p-6 text-sm text-muted">
					Run the pipeline when the eligibility panel reports at least 10 ranked items.
				</section>
			{/if}
		{/if}
	</div>
</main>
