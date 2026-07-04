<script lang="ts">
	import type { ConfigPuntos, Partido, Prediccion } from '$lib/types';
	import { calcularPuntos } from '$lib/scoring';
	import { prediccionCerrada } from '$lib/quiniela';
	import { formatoFecha, tiempoRestante } from '$lib/formato';

	let {
		partido,
		prediccion,
		config,
		onPrediccion
	}: {
		partido: Partido;
		prediccion?: Prediccion;
		config: ConfigPuntos;
		onPrediccion?: (local: number, visita: number) => void;
	} = $props();

	let cerrado = $derived(prediccionCerrada(partido));
	let editable = $derived(!cerrado && !!onPrediccion);

	// Valores de los inputs (arrancan desde la predicción existente si la hay).
	let local = $state(prediccion?.golesLocal ?? 0);
	let visita = $state(prediccion?.golesVisita ?? 0);

	let puntos = $derived.by(() => {
		if (partido.estado !== 'finalizado' || !prediccion) return null;
		if (partido.golesLocal === null || partido.golesVisita === null) return null;
		return calcularPuntos(
			{ local: prediccion.golesLocal, visita: prediccion.golesVisita },
			{ local: partido.golesLocal, visita: partido.golesVisita },
			config
		);
	});

	// Doherty: confirmación transitoria del guardado (< 400ms percibido como instantáneo).
	let guardado = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	function guardar() {
		onPrediccion?.(local, visita);
		guardado = true;
		clearTimeout(timer);
		timer = setTimeout(() => (guardado = false), 1800);
	}

	const estadoInfo = {
		programado: { texto: 'Programado', clase: 'text-[var(--texto-suave)]' },
		en_vivo: { texto: 'EN VIVO', clase: 'text-red-600' },
		finalizado: { texto: 'Finalizado', clase: 'text-[var(--texto-suave)]' }
	} as const;
</script>

<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4">
	<!-- Cabecera -->
	<div class="mb-3 flex items-center justify-between text-xs">
		<span class="font-medium text-[var(--texto-suave)]">{partido.ronda}</span>
		<span class="flex items-center gap-1.5 font-semibold {estadoInfo[partido.estado].clase}">
			{#if partido.estado === 'en_vivo'}
				<span class="h-2 w-2 animate-pulse rounded-full bg-red-600"></span>
				{partido.minuto}'
			{:else if partido.estado === 'programado'}
				{formatoFecha(partido.inicio)}
			{:else}
				{estadoInfo[partido.estado].texto}
			{/if}
		</span>
	</div>

	<!-- Equipos + marcador -->
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-1 items-center gap-2.5">
			<span class="text-2xl">{partido.banderaLocal}</span>
			<span class="font-semibold">{partido.equipoLocal}</span>
		</div>

		<div class="flex items-center gap-2">
			{#if editable}
				<input
					type="number"
					min="0"
					max="20"
					bind:value={local}
					onchange={guardar}
					aria-label="Goles {partido.equipoLocal}"
					class="tabular h-11 w-12 rounded-lg border border-[var(--borde)] bg-[var(--superficie-2)] text-center text-lg font-bold outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				/>
				<span class="text-[var(--texto-suave)]">-</span>
				<input
					type="number"
					min="0"
					max="20"
					bind:value={visita}
					onchange={guardar}
					aria-label="Goles {partido.equipoVisita}"
					class="tabular h-11 w-12 rounded-lg border border-[var(--borde)] bg-[var(--superficie-2)] text-center text-lg font-bold outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				/>
			{:else}
				<span
					class="tabular font-display text-2xl font-bold {partido.estado === 'en_vivo'
						? 'text-red-600'
						: ''}"
				>
					{partido.golesLocal ?? '–'} : {partido.golesVisita ?? '–'}
				</span>
			{/if}
		</div>

		<div class="flex flex-1 items-center justify-end gap-2.5 text-right">
			<span class="font-semibold">{partido.equipoVisita}</span>
			<span class="text-2xl">{partido.banderaVisita}</span>
		</div>
	</div>

	<!-- Pie: estado del pronóstico / puntos -->
	<div class="mt-3 flex items-center justify-between border-t border-[var(--borde)] pt-3 text-sm">
		{#if editable}
			<span class="text-[var(--texto-suave)]">Tu pronóstico · cierra {tiempoRestante(partido.inicio)}</span>
			{#if guardado}
				<span class="font-semibold text-cancha-600">Guardado ✓</span>
			{:else}
				<span class="font-medium text-[var(--texto-suave)]">Se guarda solo</span>
			{/if}
		{:else if prediccion}
			<span class="text-[var(--texto-suave)]">
				Tu pronóstico:
				<span class="tabular font-semibold text-[var(--texto)]"
					>{prediccion.golesLocal}-{prediccion.golesVisita}</span
				>
			</span>
			{#if puntos !== null}
				<span
					class="rounded-full px-2.5 py-0.5 text-xs font-bold {puntos > 0
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
