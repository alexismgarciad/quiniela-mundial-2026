<script lang="ts">
	import type { Partido } from '$lib/types';

	let { rondas }: { rondas: { nombre: string; partidos: Partido[] }[] } = $props();

	const gana = (p: Partido, lado: 'local' | 'visita') => {
		if (p.estado !== 'finalizado' || p.golesLocal === null || p.golesVisita === null) return false;
		return lado === 'local' ? p.golesLocal > p.golesVisita : p.golesVisita > p.golesLocal;
	};
	const abrev = (nombre: string) => (nombre === 'Por definir' ? '—' : nombre);
</script>

{#snippet fila(nombre: string, bandera: string, goles: number | null, resaltar: boolean, vivo: boolean)}
	<div class="flex items-center justify-between gap-2 {resaltar ? '' : 'text-[var(--texto-suave)]'}">
		<span class="flex min-w-0 items-center gap-1.5">
			<span class="shrink-0 text-base leading-none">{bandera}</span>
			<span class="truncate text-sm {resaltar ? 'font-semibold' : 'font-medium'}">{abrev(nombre)}</span>
		</span>
		{#if goles !== null}
			<span class="tabular shrink-0 text-sm font-bold {vivo ? 'text-red-600' : ''}">{goles}</span>
		{/if}
	</div>
{/snippet}

<div class="overflow-x-auto pb-4">
	<div class="flex min-w-max gap-4">
		{#each rondas as ronda (ronda.nombre)}
			<div class="flex w-52 flex-col">
				<div
					class="mb-3 text-center text-xs font-semibold tracking-wide text-[var(--texto-suave)] uppercase"
				>
					{ronda.nombre}
				</div>
				<div class="flex flex-1 flex-col justify-around gap-3">
					{#each ronda.partidos as p (p.id)}
						{@const vivo = p.estado === 'en_vivo'}
						<div
							class="rounded-lg border bg-[var(--superficie)] p-2.5 {vivo
								? 'border-red-600/40'
								: 'border-[var(--borde)]'}"
						>
							{#if vivo}
								<div class="mb-1 flex items-center gap-1 text-[0.65rem] font-bold text-red-600">
									<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600"></span>
									{p.minuto ? `${p.minuto}'` : 'EN VIVO'}
								</div>
							{/if}
							<div class="space-y-1">
								{@render fila(p.equipoLocal, p.banderaLocal, p.golesLocal, gana(p, 'local') || p.estado !== 'finalizado', vivo)}
								{@render fila(p.equipoVisita, p.banderaVisita, p.golesVisita, gana(p, 'visita') || p.estado !== 'finalizado', vivo)}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
