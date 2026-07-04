<script lang="ts">
	import type { FilaTabla } from '$lib/types';

	let { filas, yo }: { filas: FilaTabla[]; yo?: string } = $props();

	const medalla = (pos: number) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : null);
</script>

<div class="overflow-hidden rounded-2xl border border-[var(--borde)] bg-[var(--superficie)]">
	<div
		class="flex items-center justify-between border-b border-[var(--borde)] px-5 py-3 text-xs font-semibold tracking-wide text-[var(--texto-suave)] uppercase"
	>
		<span>Posición</span>
		<span>Puntos</span>
	</div>

	<ul>
		{#each filas as fila (fila.participante.id)}
			{@const esYo = fila.participante.id === yo}
			<li
				class="flex items-center justify-between px-5 py-3.5 transition {esYo
					? 'bg-cancha-500/10 shadow-[inset_3px_0_0_var(--color-cancha-500)]'
					: ''} {fila.posicion < filas.length ? 'border-b border-[var(--borde)]' : ''}"
			>
				<div class="flex items-center gap-3">
					<span
						class="tabular flex h-8 w-8 items-center justify-center text-center font-display font-bold {fila.posicion <=
						3
							? 'text-lg'
							: 'text-sm text-[var(--texto-suave)]'}"
					>
						{medalla(fila.posicion) ?? fila.posicion}
					</span>
					<div>
						<div class="font-semibold">
							{fila.participante.nombre}
							{#if esYo}<span class="ml-1 text-xs font-normal text-cancha-600">(tú)</span>{/if}
						</div>
						<div class="text-xs text-[var(--texto-suave)]">
							{fila.aciertosExactos} marcador{fila.aciertosExactos === 1 ? '' : 'es'} exacto{fila.aciertosExactos ===
							1
								? ''
								: 's'}
						</div>
					</div>
				</div>
				<span class="tabular font-display text-xl font-bold text-cancha-600">
					{fila.participante.puntosTotal}
				</span>
			</li>
		{/each}
	</ul>
</div>
