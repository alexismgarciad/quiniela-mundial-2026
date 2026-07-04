<script lang="ts">
	import type { Partido } from '$lib/types';
	import { fechaRelativa } from '$lib/formato';

	let { partido }: { partido: Partido } = $props();

	let enVivo = $derived(partido.estado === 'en_vivo');
</script>

<div
	class="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] text-left shadow-sm"
>
	<!-- Cabecera: ronda + estado -->
	<div
		class="flex items-center justify-between border-b border-[var(--borde)] px-5 py-2.5 text-xs font-semibold"
	>
		<span class="truncate text-[var(--texto-suave)]">{partido.ronda}</span>
		{#if enVivo}
			<span class="flex shrink-0 items-center gap-1.5 text-red-600">
				<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600"></span>
				EN VIVO · {partido.minuto ?? 0}'
			</span>
		{:else}
			<span class="shrink-0 text-[var(--texto-suave)]">{fechaRelativa(partido.inicio)}</span>
		{/if}
	</div>

	<!-- Equipos -->
	<div class="space-y-3 px-5 py-4">
		<div class="flex items-center gap-3">
			<span class="text-2xl leading-none">{partido.banderaLocal}</span>
			<span class="min-w-0 flex-1 truncate text-lg font-semibold">{partido.equipoLocal}</span>
			{#if partido.golesLocal !== null}
				<span class="tabular font-display text-2xl font-bold {enVivo ? 'text-red-600' : ''}">
					{partido.golesLocal}
				</span>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			<span class="text-2xl leading-none">{partido.banderaVisita}</span>
			<span class="min-w-0 flex-1 truncate text-lg font-semibold">{partido.equipoVisita}</span>
			{#if partido.golesVisita !== null}
				<span class="tabular font-display text-2xl font-bold {enVivo ? 'text-red-600' : ''}">
					{partido.golesVisita}
				</span>
			{/if}
		</div>
	</div>
</div>
