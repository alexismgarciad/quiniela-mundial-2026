<script lang="ts">
	import TarjetaPartido from '$lib/components/TarjetaPartido.svelte';
	import { formatoHora } from '$lib/formato';
	import { invalidateAll } from '$app/navigation';
	import type { Prediccion } from '$lib/types';

	let { data } = $props();

	const INTERVALO = 45; // segundos

	let ultimaActualizacion = $state(new Date());
	let segundos = $state(INTERVALO);

	// Auto-refresco REAL: al llegar a 0, invalidateAll() re-ejecuta el load del servidor
	// (que lee D1) y actualiza marcadores/tabla sin recargar la página.
	$effect(() => {
		const id = setInterval(async () => {
			segundos -= 1;
			if (segundos <= 0) {
				segundos = INTERVALO;
				await invalidateAll();
				ultimaActualizacion = new Date();
			}
		}, 1000);
		return () => clearInterval(id);
	});

	let misPreds = $derived(
		new Map<string, Prediccion>(
			data.predicciones.filter((p) => p.participanteId === data.yo).map((p) => [p.partidoId, p])
		)
	);

	let enVivo = $derived(data.partidos.filter((p) => p.estado === 'en_vivo'));
	let proximos = $derived(
		data.partidos
			.filter((p) => p.estado === 'programado')
			.sort((a, b) => +new Date(a.inicio) - +new Date(b.inicio))
			.slice(0, 3)
	);
	let recientes = $derived(data.partidos.filter((p) => p.estado === 'finalizado').slice(-2));
</script>

<div class="space-y-6">
	<!-- Indicador de auto-refresco -->
	<div
		class="flex items-center justify-between rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 text-sm"
	>
		<span class="flex items-center gap-2 text-[var(--texto-suave)]">
			<span class="h-2 w-2 animate-pulse rounded-full bg-cancha-500"></span>
			Actualización automática
		</span>
		<span class="tabular text-[var(--texto-suave)]">
			Actualizado {formatoHora(ultimaActualizacion.toISOString())} · próx. en {segundos}s
		</span>
	</div>

	{#if enVivo.length}
		<section>
			<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold text-red-600">
				<span class="h-2.5 w-2.5 animate-pulse rounded-full bg-red-600"></span>
				En juego ahora
			</h2>
			<div class="space-y-3">
				{#each enVivo as partido (partido.id)}
					<TarjetaPartido {partido} prediccion={misPreds.get(partido.id)} config={data.quiniela.configPuntos} />
				{/each}
			</div>
		</section>
	{:else}
		<div
			class="rounded-2xl border border-dashed border-[var(--borde)] p-8 text-center text-[var(--texto-suave)]"
		>
			No hay partidos en juego en este momento.
		</div>
	{/if}

	{#if proximos.length}
		<section>
			<h2 class="mb-3 text-lg font-semibold">Próximos</h2>
			<div class="space-y-3">
				{#each proximos as partido (partido.id)}
					<TarjetaPartido {partido} prediccion={misPreds.get(partido.id)} config={data.quiniela.configPuntos} />
				{/each}
			</div>
		</section>
	{/if}

	{#if recientes.length}
		<section>
			<h2 class="mb-3 text-lg font-semibold">Resultados recientes</h2>
			<div class="space-y-3">
				{#each recientes as partido (partido.id)}
					<TarjetaPartido {partido} prediccion={misPreds.get(partido.id)} config={data.quiniela.configPuntos} />
				{/each}
			</div>
		</section>
	{/if}
</div>
