<script lang="ts">
	import { page } from '$app/state';

	let { data } = $props();

	let enlaceAdmin = $derived(
		data.adminToken ? `${page.url.origin}/q/${data.codigo}?admin=${data.adminToken}` : ''
	);
	let copiado = $state(false);
	async function copiarAdmin() {
		try {
			await navigator.clipboard.writeText(enlaceAdmin);
			copiado = true;
			setTimeout(() => (copiado = false), 2000);
		} catch {
			/* sin clipboard */
		}
	}

	// Copias editables locales.
	let monto = $state(data.quiniela.montoInscripcion);
	let moneda = $state(data.quiniela.moneda);
	let participantes = $state(data.participantes.map((p) => ({ ...p })));

	import { calcularBote, calcularRecaudado } from '$lib/quiniela';
	let quinielaEdit = $derived({ ...data.quiniela, montoInscripcion: monto, moneda });
	let bote = $derived(calcularBote(quinielaEdit, participantes));
	let recaudado = $derived(calcularRecaudado(quinielaEdit, participantes));
	let pendiente = $derived(bote - recaudado);

	// Solo el número (sin símbolo de moneda) para las tarjetas de resumen.
	const numero = (n: number) =>
		new Intl.NumberFormat('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

	async function post(body: unknown) {
		const res = await fetch(`/api/q/${data.codigo}/admin`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body)
		});
		return res.ok;
	}

	function togglePago(id: string) {
		const p = participantes.find((x) => x.id === id);
		if (!p) return;
		const nuevo = !p.haPagado;
		participantes = participantes.map((x) => (x.id === id ? { ...x, haPagado: nuevo } : x));
		post({ accion: 'pago', participanteId: id, haPagado: nuevo });
	}

	let guardadoInscripcion = $state(false);
	function guardarInscripcion() {
		post({ accion: 'inscripcion', montoInscripcion: monto, moneda }).then((ok) => {
			if (ok) {
				guardadoInscripcion = true;
				setTimeout(() => (guardadoInscripcion = false), 1800);
			}
		});
	}

	// Congelar / descongelar la edición para todos.
	let congelada = $state(data.quiniela.congelada);
	function toggleCongelar() {
		const nuevo = !congelada;
		congelada = nuevo;
		post({ accion: 'congelar', congelada: nuevo });
	}

	// Enlaces de acceso por jugador.
	const enlaceAcceso = (token: string) => `${page.url.origin}/q/${data.codigo}?acceso=${token}`;
	let copiadoId = $state('');
	async function copiarAcceso(token: string, id: string) {
		try {
			await navigator.clipboard.writeText(enlaceAcceso(token));
			copiadoId = id;
			setTimeout(() => (copiadoId = ''), 2000);
		} catch {
			/* sin clipboard */
		}
	}
</script>

<div class="space-y-6">
	<div class="rounded-xl bg-oro-400/10 p-4 text-sm text-[var(--texto-suave)]">
		<strong class="text-[var(--texto)]">Panel de administración.</strong> Solo el creador ve esto
		(protegido por el token de admin).{#if !data.modoDiversion}
			Los cambios de dinero son informativos.{/if}
	</div>

	{#if enlaceAdmin}
		<div class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-4 text-sm">
			<strong>🔑 Tu enlace de administrador</strong>
			<p class="mt-1 text-xs text-[var(--texto-suave)]">
				Guárdalo para recuperar el control desde otro dispositivo. No lo compartas.
			</p>
			<div class="mt-2 flex items-center gap-2">
				<code
					class="min-w-0 flex-1 truncate rounded-lg bg-[var(--superficie-2)] px-3 py-2 text-xs">{enlaceAdmin}</code
				>
				<button
					type="button"
					onclick={copiarAdmin}
					class="presionable shrink-0 rounded-lg bg-cancha-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cancha-700"
				>
					{copiado ? '✓' : 'Copiar'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Congelar la edición para todos -->
	<section class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-5">
		<div class="flex items-center justify-between gap-4">
			<div class="min-w-0">
				<h2 class="text-lg font-semibold">Edición de pronósticos</h2>
				<p class="mt-1 text-sm text-[var(--texto-suave)]">
					{#if congelada}
						Congelada: nadie puede editar sus pronósticos.
					{:else}
						Abierta: cada jugador edita sus partidos hasta el pitazo inicial.
					{/if}
				</p>
			</div>
			<button
				type="button"
				onclick={toggleCongelar}
				class="presionable shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition {congelada
					? 'bg-cancha-100 text-cancha-700 hover:bg-cancha-200'
					: 'bg-oro-400/15 text-oro-600 hover:bg-oro-400/25'}"
			>
				{congelada ? 'Descongelar' : '🔒 Congelar'}
			</button>
		</div>
	</section>

	<!-- Enlaces de acceso por jugador -->
	{#if data.accesos && data.accesos.length}
		<section class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-5">
			<h2 class="text-lg font-semibold">Enlaces de acceso</h2>
			<p class="mt-1 text-sm text-[var(--texto-suave)]">
				Envíale a cada jugador su enlace (por WhatsApp). Al abrirlo entra directo como él mismo —
				no tiene que escribir su nombre. Es personal, no lo compartan entre sí.
			</p>
			<ul class="mt-3 space-y-2">
				{#each data.accesos as a (a.id)}
					<li class="flex items-center justify-between gap-3">
						<span class="min-w-0 flex-1 truncate font-medium">{a.nombre}</span>
						<button
							type="button"
							onclick={() => copiarAcceso(a.token, a.id)}
							class="presionable shrink-0 rounded-lg bg-cancha-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cancha-700"
						>
							{copiadoId === a.id ? '✓ Copiado' : 'Copiar enlace'}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.modoDiversion}
		<div
			class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-8 text-center text-[var(--texto-suave)]"
		>
			<div class="text-3xl">⚽</div>
			<p class="mt-2">
				Esta quiniela es <strong class="text-[var(--texto)]">solo por diversión</strong>. No hay
				gestión de dinero.
			</p>
		</div>
	{:else}
		<!-- Configuración del monto -->
		<section class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Inscripción</h2>
				{#if guardadoInscripcion}
					<span class="text-sm font-semibold text-cancha-600">Guardado ✓</span>
				{/if}
			</div>
			<div class="grid grid-cols-3 gap-3">
				<div class="col-span-2">
					<label for="monto" class="mb-1.5 block text-sm font-semibold">Monto por participante</label>
					<input
						id="monto"
						type="number"
						min="0"
						bind:value={monto}
						onchange={guardarInscripcion}
						class="tabular w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
					/>
				</div>
				<div>
					<label for="moneda" class="mb-1.5 block text-sm font-semibold">Moneda</label>
					<select
						id="moneda"
						bind:value={moneda}
						onchange={guardarInscripcion}
						class="w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] px-4 py-3 outline-none focus:border-cancha-500 focus:ring-2 focus:ring-cancha-500/20"
					>
						<option value="USD">USD</option>
						<option value="PAB">PAB</option>
					</select>
				</div>
			</div>
		</section>

		<!-- Resumen del bote (responsive: moneda pequeña + número grande, sin desborde) -->
		<section class="grid grid-cols-3 gap-2 sm:gap-3">
			<div class="rounded-xl border border-[var(--borde)] bg-[var(--superficie)] p-3 sm:p-4">
				<div class="text-xs font-semibold text-[var(--texto-suave)]">Bote total</div>
				<div class="mt-1 leading-tight">
					<span class="text-[0.65rem] font-semibold text-[var(--texto-suave)]">{moneda}</span>
					<div class="tabular font-display text-lg font-bold sm:text-xl">{numero(bote)}</div>
				</div>
			</div>
			<div class="rounded-xl border border-[var(--borde)] bg-[var(--superficie)] p-3 sm:p-4">
				<div class="text-xs font-semibold text-cancha-600">Recaudado</div>
				<div class="mt-1 leading-tight">
					<span class="text-[0.65rem] font-semibold text-cancha-600">{moneda}</span>
					<div class="tabular font-display text-lg font-bold text-cancha-600 sm:text-xl">
						{numero(recaudado)}
					</div>
				</div>
			</div>
			<div class="rounded-xl border border-[var(--borde)] bg-[var(--superficie)] p-3 sm:p-4">
				<div class="text-xs font-semibold text-oro-600">Pendiente</div>
				<div class="mt-1 leading-tight">
					<span class="text-[0.65rem] font-semibold text-oro-600">{moneda}</span>
					<div class="tabular font-display text-lg font-bold text-oro-600 sm:text-xl">
						{numero(pendiente)}
					</div>
				</div>
			</div>
		</section>

		<!-- Control de pagos -->
		<section class="rounded-2xl border border-[var(--borde)] bg-[var(--superficie)] p-5">
			<h2 class="mb-4 text-lg font-semibold">Pagos de participantes</h2>
			<ul class="space-y-1">
				{#each participantes as p (p.id)}
					<li class="flex items-center justify-between py-2">
						<span class="font-medium">{p.nombre}</span>
						<button
							onclick={() => togglePago(p.id)}
							class="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm font-bold transition {p.haPagado
								? 'bg-cancha-100 text-cancha-700 hover:bg-cancha-200'
								: 'bg-[var(--superficie-2)] text-[var(--texto-suave)] hover:bg-[var(--borde)]'}"
						>
							{p.haPagado ? '✓ Pagó' : 'Pendiente'}
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
