<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let pin = $state('');
	let usarPin = $state(false);
</script>

<div class="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
	<a href="/" class="mb-8 text-sm font-semibold text-[var(--texto-suave)] hover:text-cancha-600">
		← Volver
	</a>

	<h1 class="text-3xl">Unirme a una quiniela</h1>
	<p class="mt-2 text-[var(--texto-suave)]">
		Pide el código a quien creó la quiniela y elige tu nombre.
	</p>

	<form method="POST" class="mt-8 space-y-6">
		<div>
			<label for="codigo" class="mb-1.5 block text-sm font-semibold">Código de invitación</label>
			<input
				id="codigo"
				name="codigo"
				placeholder="MUNDIAL-4X9K"
				class="tabular w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 uppercase tracking-widest outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				required
			/>
		</div>

		<div>
			<label for="nombre" class="mb-1.5 block text-sm font-semibold">Tu nombre</label>
			<input
				id="nombre"
				name="nombre"
				placeholder="Ej. Alexis"
				class="w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				required
			/>
		</div>

		<label class="flex items-center gap-3 text-sm">
			<input type="checkbox" bind:checked={usarPin} class="h-4 w-4 accent-cancha-600" />
			Proteger mi participación con un PIN de 4 dígitos (opcional)
		</label>

		{#if usarPin}
			<div>
				<label for="pin" class="mb-1.5 block text-sm font-semibold">PIN</label>
				<input
					id="pin"
					name="pin"
					bind:value={pin}
					oninput={() => (pin = pin.replace(/\D/g, '').slice(0, 4))}
					inputmode="numeric"
					maxlength="4"
					placeholder="0000"
					class="tabular w-32 rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 text-center text-xl tracking-[0.5em] outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
				/>
				<p class="mt-1.5 text-xs text-[var(--texto-suave)]">
					Evita que otro use tu nombre desde otro dispositivo.
				</p>
			</div>
		{/if}

		{#if form?.error}
			<p class="text-sm font-medium text-red-600">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full rounded-xl bg-cancha-600 px-6 py-4 font-semibold text-white shadow-lg shadow-cancha-600/25 transition hover:bg-cancha-700"
		>
			Entrar a la quiniela
		</button>
	</form>
</div>
