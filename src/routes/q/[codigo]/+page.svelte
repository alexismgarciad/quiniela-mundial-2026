<script lang="ts">
	import BoteAcumulado from '$lib/components/BoteAcumulado.svelte';
	import TablaPosiciones from '$lib/components/TablaPosiciones.svelte';
	import { calcularBote, calcularRecaudado, calcularTabla } from '$lib/quiniela';

	let { data } = $props();

	let bote = $derived(calcularBote(data.quiniela, data.participantes));
	let recaudado = $derived(calcularRecaudado(data.quiniela, data.participantes));
	let filas = $derived(
		calcularTabla(data.quiniela, data.participantes, data.partidos, data.predicciones)
	);
</script>

<div class="space-y-6">
	{#if !data.modoDiversion}
		<BoteAcumulado
			{bote}
			moneda={data.quiniela.moneda}
			participantes={data.participantes.length}
			{recaudado}
		/>
	{:else}
		<div
			class="rounded-2xl border border-cancha-500/20 bg-cancha-500/10 p-5 text-center"
		>
			<div class="text-3xl">⚽</div>
			<div class="mt-1 font-display text-lg font-bold">{data.participantes.length} jugando</div>
			<div class="text-sm text-[var(--texto-suave)]">¡Compite por el primer lugar!</div>
		</div>
	{/if}

	<div>
		<h2 class="mb-3 text-lg font-semibold">Tabla de Posiciones</h2>
		<TablaPosiciones {filas} yo={data.yo} />
	</div>
</div>
