<script lang="ts">
	import type { ConfigPuntos, MomentoGol, Partido, Prediccion } from '$lib/types';
	import { MOMENTOS } from '$lib/types';
	import { calcularPuntos } from '$lib/scoring';
	import { esEliminatoria, prediccionCerrada } from '$lib/quiniela';
	import { formatoFecha, tiempoRestante } from '$lib/formato';

	type DatosPred = {
		golesLocal: number;
		golesVisita: number;
		momentoPrimerGol: MomentoGol | null;
		ganadorDesempate: 'local' | 'visita' | null;
	};

	let {
		partido,
		prediccion,
		config,
		onPrediccion
	}: {
		partido: Partido;
		prediccion?: Prediccion;
		config: ConfigPuntos;
		onPrediccion?: (datos: DatosPred) => void;
	} = $props();

	let cerrado = $derived(prediccionCerrada(partido));
	let editable = $derived(!cerrado && !!onPrediccion);
	let eliminatoria = $derived(esEliminatoria(partido.ronda));

	let local = $state(prediccion?.golesLocal ?? 0);
	let visita = $state(prediccion?.golesVisita ?? 0);
	let momento = $state<MomentoGol | null>(prediccion?.momentoPrimerGol ?? null);
	let desempate = $state<'local' | 'visita' | null>(prediccion?.ganadorDesempate ?? null);

	let puntos = $derived.by(() => {
		if (partido.estado !== 'finalizado' || !prediccion) return null;
		if (partido.golesLocal === null || partido.golesVisita === null) return null;
		return calcularPuntos(
			{
				local: prediccion.golesLocal,
				visita: prediccion.golesVisita,
				momentoPrimerGol: prediccion.momentoPrimerGol,
				ganadorDesempate: prediccion.ganadorDesempate
			},
			{
				local: partido.golesLocal,
				visita: partido.golesVisita,
				momentoPrimerGol: partido.momentoPrimerGol,
				avanza: partido.avanza
			},
			config
		);
	});

	let guardado = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	function guardar() {
		onPrediccion?.({
			golesLocal: local,
			golesVisita: visita,
			momentoPrimerGol: momento,
			ganadorDesempate: desempate
		});
		guardado = true;
		clearTimeout(timer);
		timer = setTimeout(() => (guardado = false), 1800);
	}

	const fin = $derived(
		partido.estado === 'finalizado' && partido.golesLocal !== null && partido.golesVisita !== null
	);
	let ganaLocal = $derived(fin && partido.golesLocal! > partido.golesVisita!);
	let ganaVisita = $derived(fin && partido.golesVisita! > partido.golesLocal!);
	let colorMarcador = $derived(partido.estado === 'en_vivo' ? 'text-red-600' : 'text-[var(--texto-suave)]');
	const etiquetaMomento = (m: MomentoGol | null | undefined) =>
		MOMENTOS.find((x) => x.valor === m)?.etiqueta ?? '—';
</script>

<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4">
	<!-- Cabecera -->
	<div class="mb-2.5 flex items-center justify-between gap-2 text-xs">
		<span class="truncate font-medium text-[var(--texto-suave)]">{partido.ronda}</span>
		<span
			class="flex shrink-0 items-center gap-1.5 font-semibold {partido.estado === 'en_vivo'
				? 'text-red-600'
				: 'text-[var(--texto-suave)]'}"
		>
			{#if partido.estado === 'en_vivo'}
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600"></span>
				{partido.minuto ?? 0}'
			{:else if partido.estado === 'programado'}
				{formatoFecha(partido.inicio)}
			{:else}
				Finalizado
			{/if}
		</span>
	</div>

	<!-- Equipos apilados -->
	<div class="space-y-1.5">
		<div class="flex items-center gap-2.5">
			<span class="text-xl leading-none">{partido.banderaLocal}</span>
			<span class="min-w-0 flex-1 truncate font-semibold">{partido.equipoLocal}</span>
			{#if editable}
				<input
					type="number"
					min="0"
					max="20"
					bind:value={local}
					onchange={guardar}
					aria-label="Goles {partido.equipoLocal}"
					class="tabular h-11 w-12 shrink-0 rounded-lg border border-[var(--borde)] bg-[var(--superficie-2)] text-center text-lg font-bold outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				/>
			{:else}
				<span
					class="tabular w-8 shrink-0 text-right font-display text-xl font-bold {ganaLocal
						? 'text-[var(--texto)]'
						: colorMarcador}">{partido.golesLocal ?? '–'}</span
				>
			{/if}
		</div>
		<div class="flex items-center gap-2.5">
			<span class="text-xl leading-none">{partido.banderaVisita}</span>
			<span class="min-w-0 flex-1 truncate font-semibold">{partido.equipoVisita}</span>
			{#if editable}
				<input
					type="number"
					min="0"
					max="20"
					bind:value={visita}
					onchange={guardar}
					aria-label="Goles {partido.equipoVisita}"
					class="tabular h-11 w-12 shrink-0 rounded-lg border border-[var(--borde)] bg-[var(--superficie-2)] text-center text-lg font-bold outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				/>
			{:else}
				<span
					class="tabular w-8 shrink-0 text-right font-display text-xl font-bold {ganaVisita
						? 'text-[var(--texto)]'
						: colorMarcador}">{partido.golesVisita ?? '–'}</span
				>
			{/if}
		</div>
	</div>

	{#if editable}
		<!-- Momento del 1er gol -->
		<div class="mt-3 border-t border-[var(--borde)] pt-3">
			<div class="mb-1.5 text-xs font-semibold text-[var(--texto-suave)]">Momento del 1er gol</div>
			<div class="grid grid-cols-4 gap-1.5">
				{#each MOMENTOS as m (m.valor)}
					<button
						type="button"
						onclick={() => {
							momento = momento === m.valor ? null : m.valor;
							guardar();
						}}
						class="presionable rounded-lg border px-1 py-2 text-xs font-semibold {momento === m.valor
							? 'border-cancha-500 bg-cancha-500/10 text-cancha-700'
							: 'border-[var(--borde)] text-[var(--texto-suave)]'}"
					>
						{m.etiqueta}
					</button>
				{/each}
			</div>
		</div>

		{#if eliminatoria}
			<!-- ¿Quién pasa si hay empate? -->
			<div class="mt-3">
				<div class="mb-1.5 text-xs font-semibold text-[var(--texto-suave)]">
					¿Quién pasa si hay empate?
				</div>
				<div class="grid grid-cols-2 gap-1.5">
					{#each [{ lado: 'local' as const, nombre: partido.equipoLocal, bandera: partido.banderaLocal }, { lado: 'visita' as const, nombre: partido.equipoVisita, bandera: partido.banderaVisita }] as eq (eq.lado)}
						<button
							type="button"
							onclick={() => {
								desempate = desempate === eq.lado ? null : eq.lado;
								guardar();
							}}
							class="presionable flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold {desempate ===
							eq.lado
								? 'border-cancha-500 bg-cancha-500/10 text-cancha-700'
								: 'border-[var(--borde)] text-[var(--texto-suave)]'}"
						>
							<span>{eq.bandera}</span>
							<span class="truncate">{eq.nombre}</span>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- Pie -->
	<div class="mt-3 flex items-center justify-between gap-2 border-t border-[var(--borde)] pt-2.5 text-xs">
		{#if editable}
			<span class="truncate text-[var(--texto-suave)]">Cierra {tiempoRestante(partido.inicio)}</span>
			{#if guardado}
				<span class="shrink-0 font-semibold text-cancha-600">Guardado ✓</span>
			{:else}
				<span class="shrink-0 font-medium text-[var(--texto-suave)]">Se guarda solo</span>
			{/if}
		{:else if prediccion}
			<span class="min-w-0 truncate text-[var(--texto-suave)]">
				Tu pronóstico:
				<span class="tabular font-semibold text-[var(--texto)]"
					>{prediccion.golesLocal}-{prediccion.golesVisita}</span
				>
				{#if prediccion.momentoPrimerGol}· {etiquetaMomento(prediccion.momentoPrimerGol)}{/if}
			</span>
			{#if puntos !== null}
				<span
					class="shrink-0 rounded-full px-2 py-0.5 font-bold {puntos > 0
						? 'bg-cancha-100 text-cancha-700'
						: 'bg-[var(--superficie-2)] text-[var(--texto-suave)]'}"
				>
					{puntos > 0 ? `+${puntos}` : '0'} pts
				</span>
			{/if}
		{:else}
			<span class="text-[var(--texto-suave)]">Sin pronóstico</span>
			<span></span>
		{/if}
	</div>
</div>
