import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from './index';
import { participantes, partidos, predicciones, quinielas } from './schema';
import {
	CONFIG_PUNTOS_DEFAULT,
	type ConfigPuntos,
	type Participante,
	type Partido,
	type Prediccion,
	type Quiniela
} from '$lib/types';
import { prediccionCerrada } from '$lib/quiniela';

const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generarCodigo(): string {
	// crypto.getRandomValues (no Math.random): 256 % 32 == 0, así que no hay sesgo de módulo.
	const bytes = crypto.getRandomValues(new Uint8Array(5));
	let s = '';
	for (let i = 0; i < 5; i++) s += ABC[bytes[i] % ABC.length];
	return `MUNDIAL-${s}`;
}

function ahoraISO(): string {
	return new Date().toISOString();
}

const hex = (buf: ArrayBuffer | Uint8Array) =>
	[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Hash del PIN con PBKDF2 + sal aleatoria (Web Crypto, disponible en Workers).
 * Formato: `pbkdf2$<iter>$<saltHex>$<hashHex>`. Un PIN de 4 dígitos es de bajo espacio,
 * así que la sal + iteraciones encarecen los ataques por fuerza bruta/rainbow tables.
 */
async function hashPin(pin: string): Promise<string> {
	const iter = 100_000;
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
		'deriveBits'
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
		key,
		256
	);
	return `pbkdf2$${iter}$${hex(salt)}$${hex(bits)}`;
}

/** Verifica un PIN contra su hash almacenado (comparación en tiempo ~constante). */
export async function verificarPin(pin: string, almacenado: string): Promise<boolean> {
	const [algo, iterStr, saltHex, hashHex] = almacenado.split('$');
	if (algo !== 'pbkdf2') return false;
	const salt = new Uint8Array((saltHex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, [
		'deriveBits'
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: Number(iterStr), hash: 'SHA-256' },
		key,
		256
	);
	const calc = hex(bits);
	if (calc.length !== hashHex.length) return false;
	let diff = 0;
	for (let i = 0; i < calc.length; i++) diff |= calc.charCodeAt(i) ^ hashHex.charCodeAt(i);
	return diff === 0;
}

// ---------- Crear / Unirse ----------

export async function crearQuiniela(
	db: Db,
	datos: { nombre: string; montoInscripcion: number; moneda: string; configPuntos?: ConfigPuntos }
): Promise<{ id: string; codigo: string; adminToken: string }> {
	const id = crypto.randomUUID();
	const adminToken = crypto.randomUUID();
	// Reintenta si el código colisiona (muy improbable).
	let codigo = generarCodigo();
	for (let intento = 0; intento < 5; intento++) {
		const existe = await db
			.select({ id: quinielas.id })
			.from(quinielas)
			.where(eq(quinielas.codigoInvitacion, codigo))
			.get();
		if (!existe) break;
		codigo = generarCodigo();
	}

	await db.insert(quinielas).values({
		id,
		nombre: datos.nombre.trim(),
		codigoInvitacion: codigo,
		adminToken,
		montoInscripcion: datos.montoInscripcion,
		moneda: datos.moneda,
		configPuntos: datos.configPuntos ?? CONFIG_PUNTOS_DEFAULT,
		creadaEn: ahoraISO()
	});

	return { id, codigo, adminToken };
}

export async function unirseQuiniela(
	db: Db,
	datos: { codigo: string; nombre: string; deviceToken: string; pin?: string }
): Promise<{ ok: true; participanteId: string } | { ok: false; motivo: string }> {
	const codigo = datos.codigo.trim().toUpperCase();
	const nombre = datos.nombre.trim();
	const q = await db
		.select({ id: quinielas.id })
		.from(quinielas)
		.where(eq(quinielas.codigoInvitacion, codigo))
		.get();
	if (!q) return { ok: false, motivo: 'Código de quiniela no encontrado.' };

	// ¿Ya hay un participante con ese nombre en esta quiniela?
	const existente = await db
		.select()
		.from(participantes)
		.where(and(eq(participantes.quinielaId, q.id), eq(participantes.nombre, nombre)))
		.get();
	if (existente) {
		if (existente.pinHash) {
			// Reconexión (p.ej. otro dispositivo): se exige el PIN correcto.
			if (!datos.pin || !(await verificarPin(datos.pin, existente.pinHash))) {
				return { ok: false, motivo: 'Ese nombre ya está en uso. Ingresa su PIN para reconectarte.' };
			}
			return { ok: true, participanteId: existente.id };
		}
		// Sin PIN no se puede reclamar un nombre existente (evita confusión/suplantación).
		return { ok: false, motivo: 'Ese nombre ya está en uso en esta quiniela. Elige otro.' };
	}

	const id = crypto.randomUUID();
	await db.insert(participantes).values({
		id,
		quinielaId: q.id,
		nombre,
		deviceToken: datos.deviceToken,
		pinHash: datos.pin ? await hashPin(datos.pin) : null,
		haPagado: false,
		puntosTotal: 0,
		unidoEn: ahoraISO()
	});
	return { ok: true, participanteId: id };
}

// ---------- Lectura del panel ----------

function aQuiniela(row: typeof quinielas.$inferSelect): Quiniela {
	return {
		id: row.id,
		nombre: row.nombre,
		codigoInvitacion: row.codigoInvitacion,
		montoInscripcion: row.montoInscripcion,
		moneda: row.moneda,
		configPuntos: row.configPuntos as ConfigPuntos,
		congelada: row.congelada,
		creadaEn: row.creadaEn
	};
}

export async function obtenerQuinielaPorCodigo(db: Db, codigo: string): Promise<Quiniela | null> {
	const row = await db
		.select()
		.from(quinielas)
		.where(eq(quinielas.codigoInvitacion, codigo.trim().toUpperCase()))
		.get();
	return row ? aQuiniela(row) : null;
}

/** Carga todo lo que el panel necesita en pocas consultas. */
export async function cargarPanel(
	db: Db,
	codigo: string
): Promise<{
	quiniela: Quiniela;
	participantes: Participante[];
	partidos: Partido[];
	predicciones: Prediccion[];
} | null> {
	const qRow = await db
		.select()
		.from(quinielas)
		.where(eq(quinielas.codigoInvitacion, codigo.trim().toUpperCase()))
		.get();
	if (!qRow) return null;

	const parts = await db
		.select()
		.from(participantes)
		.where(eq(participantes.quinielaId, qRow.id))
		.all();

	const mats = await db.select().from(partidos).all();

	const ids = parts.map((p) => p.id);
	const preds = ids.length
		? await db.select().from(predicciones).where(inArray(predicciones.participanteId, ids)).all()
		: [];

	return {
		quiniela: aQuiniela(qRow),
		participantes: parts.map((p) => ({
			id: p.id,
			quinielaId: p.quinielaId,
			nombre: p.nombre,
			haPagado: p.haPagado,
			puntosTotal: p.puntosTotal
		})),
		partidos: mats.map((m) => ({
			id: m.id,
			ronda: m.ronda,
			grupo: m.grupo ?? undefined,
			equipoLocal: m.equipoLocal,
			equipoVisita: m.equipoVisita,
			banderaLocal: m.banderaLocal,
			banderaVisita: m.banderaVisita,
			inicio: m.inicio,
			estado: m.estado as Partido['estado'],
			golesLocal: m.golesLocal,
			golesVisita: m.golesVisita,
			minuto: m.minuto,
			momentoPrimerGol: m.momentoPrimerGol as Partido['momentoPrimerGol'],
			avanza: m.avanza as Partido['avanza']
		})),
		predicciones: preds.map((p) => ({
			participanteId: p.participanteId,
			partidoId: p.partidoId,
			golesLocal: p.golesLocal,
			golesVisita: p.golesVisita,
			momentoPrimerGol: p.momentoPrimerGol as Prediccion['momentoPrimerGol'],
			ganadorDesempate: p.ganadorDesempate as Prediccion['ganadorDesempate'],
			puntosObtenidos: p.puntosObtenidos
		}))
	};
}

// ---------- Escritura de predicciones ----------

export async function guardarPrediccion(
	db: Db,
	datos: {
		participanteId: string;
		partidoId: string;
		golesLocal: number;
		golesVisita: number;
		momentoPrimerGol?: string | null;
		ganadorDesempate?: string | null;
	}
): Promise<{ ok: true } | { ok: false; motivo: string }> {
	const partido = await db.select().from(partidos).where(eq(partidos.id, datos.partidoId)).get();
	if (!partido) return { ok: false, motivo: 'Partido no encontrado.' };

	// Cierre validado en el SERVIDOR (no confiar en la UI).
	if (prediccionCerrada({ ...partido, estado: partido.estado as Partido['estado'] } as Partido)) {
		return { ok: false, motivo: 'El pronóstico de este partido ya está cerrado.' };
	}

	const gl = Math.max(0, Math.min(20, Math.round(datos.golesLocal)));
	const gv = Math.max(0, Math.min(20, Math.round(datos.golesVisita)));
	const momento = ['1T', '2T', '1TE', '2TE'].includes(datos.momentoPrimerGol ?? '')
		? datos.momentoPrimerGol!
		: null;
	const desempate = ['local', 'visita'].includes(datos.ganadorDesempate ?? '')
		? datos.ganadorDesempate!
		: null;

	const existente = await db
		.select({ id: predicciones.id })
		.from(predicciones)
		.where(
			and(
				eq(predicciones.participanteId, datos.participanteId),
				eq(predicciones.partidoId, datos.partidoId)
			)
		)
		.get();

	if (existente) {
		await db
			.update(predicciones)
			.set({
				golesLocal: gl,
				golesVisita: gv,
				momentoPrimerGol: momento,
				ganadorDesempate: desempate
			})
			.where(eq(predicciones.id, existente.id));
	} else {
		await db.insert(predicciones).values({
			id: crypto.randomUUID(),
			participanteId: datos.participanteId,
			partidoId: datos.partidoId,
			golesLocal: gl,
			golesVisita: gv,
			momentoPrimerGol: momento,
			ganadorDesempate: desempate,
			puntosObtenidos: null
		});
	}
	return { ok: true };
}

// ---------- Acciones de admin ----------

export async function verificarAdmin(db: Db, codigo: string, adminToken: string): Promise<Quiniela | null> {
	const row = await db
		.select()
		.from(quinielas)
		.where(
			and(
				eq(quinielas.codigoInvitacion, codigo.trim().toUpperCase()),
				eq(quinielas.adminToken, adminToken)
			)
		)
		.get();
	return row ? aQuiniela(row) : null;
}

export async function marcarPago(
	db: Db,
	quinielaId: string,
	participanteId: string,
	haPagado: boolean
): Promise<void> {
	// Scope a la quiniela del admin: evita escrituras cruzadas a otras quinielas.
	await db
		.update(participantes)
		.set({ haPagado })
		.where(and(eq(participantes.id, participanteId), eq(participantes.quinielaId, quinielaId)));
}

export async function actualizarInscripcion(
	db: Db,
	quinielaId: string,
	datos: { montoInscripcion: number; moneda: string }
): Promise<void> {
	await db
		.update(quinielas)
		.set({ montoInscripcion: datos.montoInscripcion, moneda: datos.moneda })
		.where(eq(quinielas.id, quinielaId));
}

/** Congela/descongela la quiniela (cierra la edición para todos los jugadores). */
export async function alternarCongelada(db: Db, quinielaId: string, congelada: boolean): Promise<void> {
	await db.update(quinielas).set({ congelada }).where(eq(quinielas.id, quinielaId));
}

/** Enlaces de acceso por jugador (solo para el admin: incluye el token secreto). */
export async function listarAccesos(
	db: Db,
	quinielaId: string
): Promise<{ id: string; nombre: string; token: string }[]> {
	const filas = await db
		.select({ id: participantes.id, nombre: participantes.nombre, token: participantes.deviceToken })
		.from(participantes)
		.where(eq(participantes.quinielaId, quinielaId))
		.all();
	return filas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

// ---------- Acceso personal por enlace ----------

/**
 * Valida un enlace de acceso personal: /q/CODE?acceso=<token>.
 * El token es el device_token (UUID secreto, nunca expuesto al cliente).
 * Devuelve el id del participante si coincide, o null.
 */
export async function verificarAcceso(
	db: Db,
	codigo: string,
	token: string
): Promise<string | null> {
	if (!token) return null;
	const q = await db
		.select({ id: quinielas.id })
		.from(quinielas)
		.where(eq(quinielas.codigoInvitacion, codigo.trim().toUpperCase()))
		.get();
	if (!q) return null;
	const p = await db
		.select({ id: participantes.id })
		.from(participantes)
		.where(and(eq(participantes.quinielaId, q.id), eq(participantes.deviceToken, token)))
		.get();
	return p?.id ?? null;
}

/** El jugador (ya identificado) se pone un PIN opcional para reconectar desde otro dispositivo. */
export async function establecerPin(
	db: Db,
	quinielaId: string,
	participanteId: string,
	pin: string
): Promise<{ ok: true } | { ok: false; motivo: string }> {
	if (!/^\d{4}$/.test(pin)) return { ok: false, motivo: 'El PIN debe ser de 4 dígitos.' };
	const hash = await hashPin(pin);
	await db
		.update(participantes)
		.set({ pinHash: hash })
		.where(and(eq(participantes.id, participanteId), eq(participantes.quinielaId, quinielaId)));
	return { ok: true };
}
