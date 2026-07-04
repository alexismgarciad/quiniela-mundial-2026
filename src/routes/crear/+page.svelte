<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatoMoneda } from '$lib/quiniela';
	import type { ActionData } from './$types';

	let { form, data }: { form: ActionData; data: { modoDiversion: boolean } } = $props();

	let monto = $state(20);
	let moneda = $state('USD');
	let enviando = $state(false);
</script>

<div class="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
	<a href="/" class="mb-8 text-sm font-semibold text-[var(--texto-suave)] hover:text-cancha-600">
		← Volver
	</a>

	{#if !form?.creada}
		<h1 class="text-3xl">Crear una quiniela</h1>
		<p class="mt-2 text-[var(--texto-suave)]">
			{#if data.modoDiversion}
				Ponle nombre a tu quiniela y comparte el código con tus amigos.
			{:else}
				Configura los datos básicos. El monto de inscripción define el bote acumulado.
			{/if}
		</p>

		<form
			method="POST"
			class="mt-8 space-y-6"
			use:enhance={() => {
				enviando = true;
				return async ({ update }) => {
					await update();
					enviando = false;
				};
			}}
		>
			<div>
				<label for="nombre" class="mb-1.5 block text-sm font-semibold">Nombre de la quiniela</label>
				<input
					id="nombre"
					name="nombre"
					placeholder="Ej. Quiniela de la Oficina"
					class="w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
					required
				/>
			</div>

			{#if !data.modoDiversion}
				<div class="grid grid-cols-3 gap-3">
					<div class="col-span-2">
						<label for="monto" class="mb-1.5 block text-sm font-semibold">Monto de inscripción</label>
						<input
							id="monto"
							name="monto"
							type="number"
							min="0"
							step="1"
							bind:value={monto}
							class="tabular w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
						/>
					</div>
					<div>
						<label for="moneda" class="mb-1.5 block text-sm font-semibold">Moneda</label>
						<select
							id="moneda"
							name="moneda"
							bind:value={moneda}
							class="w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
						>
							<option value="USD">USD</option>
							<option value="PAB">PAB (B/.)</option>
						</select>
					</div>
				</div>

				<div
					class="rounded-xl border border-cancha-500/20 bg-cancha-500/10 p-4 text-sm text-[var(--texto)]"
				>
					Cada participante aporta <strong>{formatoMoneda(monto, moneda)}</strong>. El bote crece
					automáticamente a medida que se unen. La app no cobra: el dinero se coordina entre ustedes.
				</div>
			{/if}

			{#if form?.error}
				<p class="text-sm font-medium text-red-600">{form.error}</p>
			{/if}

			<button
				type="submit"
				disabled={enviando}
				class="presionable w-full rounded-xl bg-cancha-600 px-6 py-4 font-semibold text-white shadow-lg shadow-cancha-600/25 hover:bg-cancha-700 disabled:opacity-60"
			>
				{enviando ? 'Creando…' : 'Crear quiniela'}
			</button>
		</form>
	{:else}
		<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-8 text-center">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cancha-100 text-3xl">
				🏆
			</div>
			<h1 class="text-2xl">¡{form.nombre} está lista!</h1>
			<p class="mt-2 text-[var(--texto-suave)]">Comparte este código para que se unan:</p>

			<div
				class="tabular my-6 rounded-xl border-2 border-dashed border-cancha-400 bg-cancha-50 py-5 font-display text-2xl font-bold tracking-widest text-cancha-700"
			>
				{form.codigo}
			</div>

			<div class="rounded-xl bg-oro-400/10 p-4 text-left text-sm text-[var(--texto-suave)]">
				<strong class="text-[var(--texto)]">Guarda este código.</strong> Como creador, tu navegador
				quedó registrado como administrador de la quiniela.
			</div>

			<a
				href="/unirse?codigo={form.codigo}"
				class="presionable mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cancha-600 px-6 py-4 font-semibold text-white hover:bg-cancha-700"
			>
				Unirme a mi quiniela
			</a>
		</div>
	{/if}
</div>
