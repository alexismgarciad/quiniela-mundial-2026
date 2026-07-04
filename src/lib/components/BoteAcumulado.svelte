<script lang="ts">
	import { formatoMoneda } from '$lib/quiniela';

	let {
		bote,
		moneda,
		participantes,
		recaudado
	}: { bote: number; moneda: string; participantes: number; recaudado: number } = $props();
</script>

<div
	class="relative overflow-hidden rounded-2xl border border-oro-400/30 bg-gradient-to-br from-oro-400/15 to-oro-500/5 p-6"
>
	<div class="flex items-start justify-between">
		<div>
			<div class="text-sm font-semibold text-oro-600">Bote acumulado</div>
			<div class="tabular mt-1 font-display text-4xl font-bold">
				{formatoMoneda(bote, moneda)}
			</div>
			<div class="mt-1 text-sm text-[var(--texto-suave)]">
				{participantes}
				{participantes === 1 ? 'participante' : 'participantes'} · recaudado
				<span class="tabular font-medium text-[var(--texto)]">{formatoMoneda(recaudado, moneda)}</span>
			</div>
		</div>
		<div class="text-4xl">🏆</div>
	</div>
	<div class="mt-3 border-t border-oro-400/20 pt-2 text-xs text-[var(--texto-suave)]">
		Monto informativo · la app no maneja dinero, ustedes se coordinan por fuera.
	</div>
</div>
