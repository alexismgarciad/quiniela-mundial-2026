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

	// PIN opcional para el jugador identificado (proteger su acceso en otro dispositivo).
	let mostrarPin = $state(false);
	let pin = $state('');
	let pinMsg = $state('');
	let pinGuardado = $state(false);
	async function guardarPin() {
		pinMsg = '';
		const res = await fetch(`/api/q/${data.codigo}/pin`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ pin })
		});
		if (res.ok) {
			pinGuardado = true;
			pin = '';
			setTimeout(() => {
				pinGuardado = false;
				mostrarPin = false;
			}, 1800);
		} else {
			const { error } = await res.json().catch(() => ({ error: 'No se pudo guardar' }));
			pinMsg = error ?? 'No se pudo guardar';
		}
	}
</script>

<div class="space-y-6">
	{#if data.quiniela.congelada}
		<div class="rounded-xl border border-oro-400/30 bg-oro-400/10 p-3 text-center text-sm font-semibold text-oro-600">
			🔒 La quiniela está congelada — la edición de pronósticos está cerrada.
		</div>
	{/if}

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

	{#if data.yo}
		<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4 text-sm">
			{#if !mostrarPin}
				<button
					type="button"
					onclick={() => (mostrarPin = true)}
					class="text-[var(--texto-suave)] hover:text-[var(--texto)]"
				>
					🔒 Ponle un PIN a tu acceso <span class="opacity-70">(opcional)</span>
				</button>
			{:else}
				<p class="mb-2 text-[var(--texto-suave)]">
					Con un PIN puedes reconectarte desde otro dispositivo con tu nombre + PIN.
				</p>
				<div class="flex items-center gap-2">
					<input
						type="text"
						inputmode="numeric"
						maxlength="4"
						placeholder="4 dígitos"
						bind:value={pin}
						class="tabular w-28 rounded-lg border border-[var(--borde)] bg-[var(--superficie-2)] px-3 py-2 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
					/>
					<button
						type="button"
						onclick={guardarPin}
						disabled={pin.length !== 4}
						class="presionable rounded-lg bg-cancha-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cancha-700 disabled:opacity-40"
					>
						{pinGuardado ? '✓ Guardado' : 'Guardar PIN'}
					</button>
				</div>
				{#if pinMsg}
					<p class="mt-2 text-xs text-red-500">{pinMsg}</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>
