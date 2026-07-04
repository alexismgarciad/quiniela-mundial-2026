<script lang="ts">
	import { page } from '$app/state';

	let { data, children } = $props();

	let base = $derived(`/q/${data.codigo}`);
	let tabs = $derived([
		{ href: base, label: 'Tabla', match: base },
		{ href: `${base}/partidos`, label: 'Partidos', match: `${base}/partidos` },
		{ href: `${base}/en-vivo`, label: 'En vivo', match: `${base}/en-vivo` }
	]);

	let activo = $derived(page.url.pathname);
</script>

<div class="mx-auto min-h-dvh max-w-2xl">
	<!-- Cabecera -->
	<header class="border-b border-[var(--borde)] px-5 pt-6 pb-0">
		<div class="flex items-center justify-between">
			<div>
				<a href="/" class="text-xs font-semibold text-[var(--texto-suave)] hover:text-cancha-600">
					← Inicio
				</a>
				<h1 class="mt-1 text-2xl">{data.quiniela.nombre}</h1>
				<div class="tabular mt-0.5 text-sm text-[var(--texto-suave)]">
					Código: <span class="font-semibold tracking-wide text-cancha-600">{data.quiniela.codigoInvitacion}</span>
				</div>
			</div>
			<a
				href="{base}/admin"
				class="inline-flex min-h-11 items-center rounded-lg border border-[var(--borde)] px-4 text-xs font-semibold text-[var(--texto-suave)] transition hover:border-cancha-400"
			>
				⚙️ Admin
			</a>
		</div>

		<!-- Pestañas -->
		<nav class="mt-5 flex gap-1">
			{#each tabs as tab (tab.href)}
				{@const es = activo === tab.match}
				<a
					href={tab.href}
					class="relative inline-flex min-h-11 items-center rounded-t-lg px-4 py-2.5 text-sm font-semibold transition {es
						? 'text-cancha-600'
						: 'text-[var(--texto-suave)] hover:text-[var(--texto)]'}"
				>
					{tab.label}
					{#if es}
						<span class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-cancha-600"></span>
					{/if}
				</a>
			{/each}
		</nav>
	</header>

	<main class="px-5 py-6">
		{@render children()}
	</main>
</div>
