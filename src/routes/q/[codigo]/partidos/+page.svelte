<script lang="ts">
	import TarjetaPartido from '$lib/components/TarjetaPartido.svelte';
	import { prediccionCerrada } from '$lib/quiniela';
	import type { MomentoGol, Prediccion } from '$lib/types';

	let { data } = $props();

	// Mapa reactivo de MIS pronósticos (partidoId → predicción).
	let mias = $state(
		new Map<string, Prediccion>(
			data.predicciones
				.filter((p) => p.participanteId === data.yo)
				.map((p) => [p.partidoId, { ...p }])
		)
	);

	type DatosPred = {
		golesLocal: number;
		golesVisita: number;
		momentoPrimerGol: MomentoGol | null;
		ganadorDesempate: 'local' | 'visita' | null;
	};

	function guardar(partidoId: string, d: DatosPred) {
		// Optimista: actualiza la UI de inmediato...
		mias.set(partidoId, {
			participanteId: data.yo,
			partidoId,
			golesLocal: d.golesLocal,
			golesVisita: d.golesVisita,
			momentoPrimerGol: d.momentoPrimerGol,
			ganadorDesempate: d.ganadorDesempate,
			puntosObtenidos: null
		});
		// ...y persiste en el servidor (cierre validado en el backend).
		fetch(`/api/q/${data.codigo}/prediccion`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ partidoId, ...d })
		}).catch(() => {});
	}

	let porJugar = $derived(data.partidos.filter((p) => !prediccionCerrada(p)));
	let jugados = $derived(data.partidos.filter((p) => prediccionCerrada(p)));

	// Goal-Gradient: progreso visible de pronósticos para motivar a completarlos.
	let hechos = $derived(data.partidos.filter((p) => mias.has(p.id)).length);
	let total = $derived(data.partidos.length);
	let porcentaje = $derived(total ? Math.round((hechos / total) * 100) : 0);
</script>

<div class="space-y-8">
	<!-- Goal-Gradient: barra de progreso de pronósticos -->
	<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4">
		<div class="mb-2 flex items-center justify-between text-sm">
			<span class="font-semibold">Tus pronósticos</span>
			<span class="tabular text-[var(--texto-suave)]">{hechos} de {total} partidos</span>
		</div>
		<div class="h-2 overflow-hidden rounded-full bg-[var(--superficie-2)]">
			<div
				class="h-full rounded-full bg-gradient-to-r from-cancha-500 to-cancha-600 transition-[width] duration-300"
				style="width: {porcentaje}%"
			></div>
		</div>
	</div>

	{#if porJugar.length}
		<section>
			<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
				Por pronosticar
				<span class="rounded-full bg-cancha-100 px-2 py-0.5 text-xs font-bold text-cancha-700">
					{porJugar.length}
				</span>
			</h2>
			<div class="space-y-3">
				{#each porJugar as partido (partido.id)}
					<TarjetaPartido
						{partido}
						prediccion={mias.get(partido.id)}
						config={data.quiniela.configPuntos}
						onPrediccion={(d) => guardar(partido.id, d)}
					/>
				{/each}
			</div>
		</section>
	{/if}

	{#if jugados.length}
		<section>
			<h2 class="mb-3 text-lg font-semibold">Cerrados</h2>
			<div class="space-y-3">
				{#each jugados as partido (partido.id)}
					<TarjetaPartido
						{partido}
						prediccion={mias.get(partido.id)}
						config={data.quiniela.configPuntos}
					/>
				{/each}
			</div>
		</section>
	{/if}
</div>
