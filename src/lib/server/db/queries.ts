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
	let s = '';
	for (let i = 0; i < 4; i++) s += ABC[Math.floor(Math.random() * ABC.length)];
	return `MUNDIAL-${s}`;
}

function ahoraISO(): string {
	return new Date().toISOString();
}

/** Hash SHA-256 del PIN (Web Crypto, disponible en Workers). */
async function hashPin(pin: string): Promise<string> {
	const data = new TextEncoder().encode(pin);
	const buf = await crypto.subtle.digest('SHA-256', data);
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
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
	const q = await db
		.select({ id: quinielas.id })
		.from(quinielas)
		.where(eq(quinielas.codigoInvitacion, codigo))
		.get();
	if (!q) return { ok: false, motivo: 'Código de quiniela no encontrado.' };

	const id = crypto.randomUUID();
	await db.insert(participantes).values({
		id,
		quinielaId: q.id,
		nombre: datos.nombre.trim(),
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
			minuto: m.minuto
		})),
		predicciones: preds.map((p) => ({
			participanteId: p.participanteId,
			partidoId: p.partidoId,
			golesLocal: p.golesLocal,
			golesVisita: p.golesVisita,
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
			.set({ golesLocal: gl, golesVisita: gv })
			.where(eq(predicciones.id, existente.id));
	} else {
		await db.insert(predicciones).values({
			id: crypto.randomUUID(),
			participanteId: datos.participanteId,
			partidoId: datos.partidoId,
			golesLocal: gl,
			golesVisita: gv,
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

export async function marcarPago(db: Db, participanteId: string, haPagado: boolean): Promise<void> {
	await db.update(participantes).set({ haPagado }).where(eq(participantes.id, participanteId));
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
