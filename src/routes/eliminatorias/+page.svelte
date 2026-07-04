<script lang="ts">
	import Bracket from '$lib/components/Bracket.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Eliminatorias · Mundial 2026</title>
	<meta name="description" content="El cuadro de eliminatorias del Mundial 2026 en tiempo real." />
</svelte:head>

<div class="min-h-dvh">
	<header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href="/" class="font-display text-lg font-bold">
			<span class="text-cancha-600">Quiniela</span> Mundial <span class="text-oro-500">2026</span>
		</a>
		<a
			href="/crear"
			class="presionable inline-flex items-center rounded-full bg-cancha-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cancha-700"
		>
			Crear quiniela
		</a>
	</header>

	<main class="mx-auto max-w-6xl px-6 pb-16">
		<div class="mb-6">
			<h1 class="text-3xl">Eliminatorias</h1>
			<p class="mt-1 text-[var(--texto-suave)]">
				El cuadro del Mundial 2026, de Dieciseisavos a la Final.
			</p>
		</div>

		{#if data.rondas.length}
			<Bracket rondas={data.rondas} />
			<p class="mt-4 text-xs text-[var(--texto-suave)]">
				Desliza horizontalmente para ver todas las rondas. Los cruces por definir aparecen como “—”.
			</p>
		{:else}
			<div
				class="rounded-2xl border border-dashed border-[var(--borde)] p-10 text-center text-[var(--texto-suave)]"
			>
				Aún no hay partidos de eliminatoria disponibles.
			</div>
		{/if}
	</main>
</div>
