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

	// Doherty: confirmación transitoria del guardado.
	let guardado = $state(false);
	let timer: ReturnType<typeof setTimeout>;
	function guardar() {
		onPrediccion?.(local, visita);
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
</script>

<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4">
	<!-- Cabecera: ronda + estado -->
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

	<!-- Equipos apilados (mobile-first, sin desborde) -->
	<div class="space-y-1.5">
		<!-- Local -->
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
						: colorMarcador}"
				>
					{partido.golesLocal ?? '–'}
				</span>
			{/if}
		</div>

		<!-- Visita -->
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
						: colorMarcador}"
				>
					{partido.golesVisita ?? '–'}
				</span>
			{/if}
		</div>
	</div>

	<!-- Pie: estado del pronóstico / puntos -->
	<div
		class="mt-3 flex items-center justify-between gap-2 border-t border-[var(--borde)] pt-2.5 text-xs"
	>
		{#if editable}
			<span class="truncate text-[var(--texto-suave)]">Cierra {tiempoRestante(partido.inicio)}</span>
			{#if guardado}
				<span class="shrink-0 font-semibold text-cancha-600">Guardado ✓</span>
			{:else}
				<span class="shrink-0 font-medium text-[var(--texto-suave)]">Se guarda solo</span>
			{/if}
		{:else if prediccion}
			<span class="truncate text-[var(--texto-suave)]">
				Tu pronóstico:
				<span class="tabular font-semibold text-[var(--texto)]"
					>{prediccion.golesLocal}-{prediccion.golesVisita}</span
				>
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
