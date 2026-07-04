<script lang="ts">
	const pasos = [
		{
			n: '1',
			titulo: 'Crea tu quiniela',
			texto: 'Define el nombre y el monto de inscripción. Recibes un código para compartir.'
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
			class="text-sm font-semibold text-[var(--texto-suave)] transition hover:text-cancha-600"
		>
			Unirme con código →
		</a>
	</header>

	<!-- Hero -->
	<section class="relative overflow-hidden">
		<div
			class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-cancha-500/10 to-transparent"
		></div>
		<div class="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center sm:pt-20">
			<div
				class="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--borde)] bg-[var(--superficie)] px-4 py-1.5 text-sm font-medium text-[var(--texto-suave)]"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-cancha-500"></span>
				11 jun – 19 jul 2026 · Estados Unidos, México y Canadá
			</div>

			<h1 class="mx-auto max-w-3xl text-4xl leading-tight sm:text-6xl">
				La quiniela del Mundial,<br />
				<span class="bg-gradient-to-r from-cancha-600 to-oro-500 bg-clip-text text-transparent">
					con tus amigos
				</span>
			</h1>

			<p class="mx-auto mt-6 max-w-xl text-lg text-[var(--texto-suave)]">
				Arma tu quiniela en segundos, define el bote entre todos y compite pronosticando los 104
				partidos. Sin apuestas: solo diversión y presumir cuando ganes.
			</p>

			<div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a
					href="/crear"
					class="inline-flex w-full items-center justify-center rounded-xl bg-cancha-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cancha-600/25 transition hover:bg-cancha-700 hover:shadow-cancha-600/40 sm:w-auto"
				>
					Crear una quiniela
				</a>
				<a
					href="/unirse"
					class="inline-flex w-full items-center justify-center rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-8 py-4 text-base font-semibold transition hover:border-cancha-400 sm:w-auto"
				>
					Tengo un código
				</a>
			</div>
		</div>
	</section>

	<!-- Cómo funciona -->
	<section class="mx-auto max-w-6xl px-6 pb-24">
		<div class="grid gap-4 sm:grid-cols-3">
			{#each pasos as paso (paso.n)}
				<div
					class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-6 transition hover:border-cancha-400"
				>
					<div
						class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cancha-100 font-display text-lg font-bold text-cancha-700"
					>
						{paso.n}
					</div>
					<h3 class="text-lg font-semibold">{paso.titulo}</h3>
					<p class="mt-2 text-sm text-[var(--texto-suave)]">{paso.texto}</p>
				</div>
			{/each}
		</div>
	</section>

	<footer class="border-t border-[var(--borde)]">
		<div class="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-[var(--texto-suave)]">
			Hecho para hinchas · Los pagos del bote se coordinan por fuera de la app.
		</div>
	</footer>
</div>
