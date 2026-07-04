<script lang="ts">
	import ProximoPartido from '$lib/components/ProximoPartido.svelte';
	import type { Partido } from '$lib/types';

	let { data }: { data: { modoDiversion: boolean; destacado: Partido | null } } = $props();

	const pasos = [
		{
			n: '1',
			titulo: 'Crea tu quiniela',
			texto: data.modoDiversion
				? 'Ponle nombre y recibes un código para compartir con tus amigos.'
				: 'Define el nombre y el monto de inscripción. Recibes un código para compartir.'
		},
		{
			n: '2',
			titulo: 'Invita y pronostica',
			texto: 'Tus amigos entran con el código y predicen el marcador de cada partido.'
		},
		{
			n: '3',
			titulo: 'Sigue todo en vivo',
			texto: 'Los marcadores y la tabla de posiciones se actualizan solos durante los partidos.'
		}
	];
</script>

<div class="min-h-dvh">
	<!-- Barra superior -->
	<header class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
		<a href="/" class="font-display text-lg font-bold">
			<span class="text-cancha-600">Quiniela</span> Mundial <span class="text-oro-500">2026</span>
		</a>
		<a
			href="/unirse"
			class="inline-flex items-center gap-1.5 rounded-full border border-[var(--borde)] bg-[var(--superficie)] px-4 py-2 text-sm font-semibold text-[var(--texto)] transition hover:border-cancha-400 hover:text-cancha-600"
		>
			<span class="hidden sm:inline">Unirme con código</span>
			<span class="sm:hidden">Unirme</span>
			<span aria-hidden="true">→</span>
		</a>
	</header>

	<!-- Hero -->
	<section class="relative overflow-hidden">
		<div
			class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-cancha-500/10 to-transparent"
		></div>
		<div class="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-20">
			<div
				class="anim-rise mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--borde)] bg-[var(--superficie)] px-4 py-1.5 text-sm font-medium text-[var(--texto-suave)]"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-cancha-500"></span>
				Mundial 2026 · 11 jun – 19 jul
			</div>

			<h1 class="anim-rise anim-rise-1 mx-auto max-w-3xl text-4xl leading-[1.05] text-balance sm:text-6xl">
				La quiniela del Mundial,<br />
				<span class="text-cancha-600">con tus amigos</span>
			</h1>

			<p class="anim-rise anim-rise-2 mx-auto mt-6 max-w-xl text-lg text-[var(--texto-suave)]">
				{#if data.modoDiversion}
					Arma tu quiniela en segundos, invita a tus amigos y compite pronosticando los 104 partidos.
					¡Solo diversión y presumir cuando ganes!
				{:else}
					Arma tu quiniela en segundos, define el bote entre todos y compite pronosticando los 104
					partidos. Sin apuestas: solo diversión y presumir cuando ganes.
				{/if}
			</p>

			<div class="anim-rise anim-rise-3 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href="/crear"
					class="presionable inline-flex w-full items-center justify-center rounded-xl bg-cancha-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cancha-600/25 hover:bg-cancha-700 hover:shadow-cancha-600/40 sm:w-auto"
				>
					Crear una quiniela
				</a>
				<a
					href="/unirse"
					class="presionable inline-flex w-full items-center justify-center rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-8 py-4 text-base font-semibold hover:border-cancha-400 sm:w-auto"
				>
					Tengo un código
				</a>
			</div>

			{#if data.destacado}
				<div class="anim-rise anim-rise-3 mt-14">
					<p
						class="mb-3 flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--texto-suave)]"
					>
						<span>{data.destacado.estado === 'en_vivo' ? '🔴' : '⚽'}</span>
						{data.destacado.estado === 'en_vivo' ? 'Partido en vivo ahora' : 'El próximo partido'}
					</p>
					<ProximoPartido partido={data.destacado} />
				</div>
			{/if}
		</div>
	</section>

	<!-- Cómo funciona (secuencia de 3 pasos, no card-grid) -->
	<section class="mx-auto max-w-5xl px-6 pb-24">
		<div class="grid gap-x-10 gap-y-10 sm:grid-cols-3">
			{#each pasos as paso (paso.n)}
				<div>
					<div class="font-display text-5xl leading-none font-bold text-cancha-600/30">
						{paso.n}
					</div>
					<h3 class="mt-3 text-lg font-semibold">{paso.titulo}</h3>
					<p class="mt-1.5 max-w-xs text-sm text-[var(--texto-suave)]">{paso.texto}</p>
				</div>
			{/each}
		</div>
	</section>

	<footer class="border-t border-[var(--borde)]">
		<div class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-[var(--texto-suave)]">
			Hecho en Panamá 🇵🇦
			{#if !data.modoDiversion}· Los pagos se coordinan entre ustedes, fuera de la app.{/if}
			· <a href="/privacidad" class="hover:text-cancha-600">Privacidad</a>
		</div>
	</footer>
</div>
