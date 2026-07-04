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
	<BoteAcumulado
		{bote}
		moneda={data.quiniela.moneda}
		participantes={data.participantes.length}
		{recaudado}
	/>

	<div>
		<h2 class="mb-3 text-lg font-semibold">Tabla de Posiciones</h2>
		<TablaPosiciones {filas} yo={data.yo} />
	</div>
</div>
