// ============================================================
// Cerebro de sincronización. Idempotente: se puede correr N veces.
// Lo invocan el endpoint /api/sync (dev/manual) y el Worker de cron (prod).
// ============================================================

import { eq, inArray } from 'drizzle-orm';
import type { Db } from './db';
import { participantes, partidos, predicciones, quinielas, syncLog } from './db/schema';
import { obtenerTodosLosPartidos } from './apifootball';
import { obtenerPartidosOpenfootball } from './openfootball';
import { obtenerPartidosFootballData } from './footballdata';
import { calcularPuntos } from '$lib/scoring';
import type { ConfigPuntos, Partido, Prediccion } from '$lib/types';

interface EnvSync {
	FUENTE_DATOS?: string; // "openfootball" (default) | "footballdata" | "apifootball"
	FOOTBALLDATA_TOKEN?: string;
	API_FOOTBALL_KEY?: string;
	APIFOOTBALL_LEAGUE?: string;
	APIFOOTBALL_SEASON?: string;
}

/** Elige la fuente de datos según la configuración. */
async function obtenerPartidos(env: EnvSync): Promise<Partido[]> {
	const fuente = env.FUENTE_DATOS ?? 'openfootball';
	if (fuente === 'footballdata') {
		if (!env.FOOTBALLDATA_TOKEN) throw new Error('Falta FOOTBALLDATA_TOKEN');
		// football-data da el marcador en vivo pero NO el minuto del gol.
		// Se enriquece el "momento del 1er gol" desde openfootball (gratis) por par de equipos.
		const [fd, of] = await Promise.all([
			obtenerPartidosFootballData(env.FOOTBALLDATA_TOKEN),
			obtenerPartidosOpenfootball().catch(() => [] as Partido[])
		]);
		const clave = (a: string, b: string) => [a, b].sort().join('|');
		const momentoPorPar = new Map<string, Partido['momentoPrimerGol']>();
		for (const m of of) {
			if (m.momentoPrimerGol) momentoPorPar.set(clave(m.equipoLocal, m.equipoVisita), m.momentoPrimerGol);
		}
		for (const m of fd) {
			if (m.estado === 'finalizado' && !m.momentoPrimerGol) {
				m.momentoPrimerGol = momentoPorPar.get(clave(m.equipoLocal, m.equipoVisita)) ?? null;
			}
		}
		return fd;
	}
	if (fuente === 'apifootball') {
		if (!env.API_FOOTBALL_KEY) throw new Error('Falta API_FOOTBALL_KEY');
		return obtenerTodosLosPartidos(
			env.API_FOOTBALL_KEY,
			env.APIFOOTBALL_LEAGUE ?? '1',
			env.APIFOOTBALL_SEASON ?? '2026'
		);
	}
	// openfootball: gratis, sin key, sin cuota.
	return obtenerPartidosOpenfootball();
}

/**
 * ¿Vale la pena llamar la API ahora? Solo si hay un partido EN VIVO o a ±20 min
 * de su inicio (para captar el arranque). Fuera de eso no cambia nada → 0 requests.
 * Esto mantiene el consumo bajo aunque el cron dispare cada minuto.
 */
async function hayVentana(db: Db): Promise<boolean> {
	const filas = await db.select({ estado: partidos.estado, inicio: partidos.inicio }).from(partidos).all();
	if (filas.length === 0) return true; // tabla vacía → sembrar
	const ahora = Date.now();
	const antes = 20 * 60_000; // 20 min antes del inicio (captar el arranque)
	const despues = 3.5 * 3600_000; // 3.5 h después (cubre partido + prórroga + marcaje final)
	return filas.some((m) => {
		if (m.estado === 'en_vivo') return true;
		if (m.estado === 'finalizado') return false;
		const t = new Date(m.inicio).getTime();
		return ahora >= t - antes && ahora <= t + despues;
	});
}

export async function sincronizar(
	db: Db,
	env: EnvSync,
	forzar = false
): Promise<{ estado: string; actualizados: number; error?: string }> {
	const registrar = (estado: string, actualizados: number, error?: string) =>
		db
			.insert(syncLog)
			.values({
				id: crypto.randomUUID(),
				corridaEn: new Date().toISOString(),
				partidosActualizados: actualizados,
				estado,
				errorMsg: error ?? null
			})
			.catch(() => {});

	const fuente = env.FUENTE_DATOS ?? 'openfootball';

	// La ventana ahorra cuota en fuentes con límite. openfootball es gratis/estático → siempre corre.
	if (!forzar && fuente !== 'openfootball' && !(await hayVentana(db))) {
		await registrar('sin_ventana', 0);
		return { estado: 'sin_ventana', actualizados: 0 };
	}

	try {
		const fixtures = await obtenerPartidos(env);
		const ahoraISO = new Date().toISOString();

		// Upsert de cada partido.
		for (const m of fixtures) {
			await db
				.insert(partidos)
				.values({
					id: m.id,
					ronda: m.ronda,
					grupo: m.grupo ?? null,
					equipoLocal: m.equipoLocal,
					equipoVisita: m.equipoVisita,
					banderaLocal: m.banderaLocal,
					banderaVisita: m.banderaVisita,
					inicio: m.inicio,
					estado: m.estado,
					golesLocal: m.golesLocal,
					golesVisita: m.golesVisita,
					minuto: m.minuto ?? null,
					momentoPrimerGol: m.momentoPrimerGol ?? null,
					avanza: m.avanza ?? null,
					actualizadoEn: ahoraISO
				})
				.onConflictDoUpdate({
					target: partidos.id,
					set: {
						estado: m.estado,
						golesLocal: m.golesLocal,
						golesVisita: m.golesVisita,
						minuto: m.minuto ?? null,
						momentoPrimerGol: m.momentoPrimerGol ?? null,
						avanza: m.avanza ?? null,
						inicio: m.inicio,
						actualizadoEn: ahoraISO
					}
				});
		}

		// Recalcular puntos de los partidos finalizados (idempotente: sobrescribe).
		const finalizados = fixtures.filter(
			(m) => m.estado === 'finalizado' && m.golesLocal !== null && m.golesVisita !== null
		);
		const participantesAfectados = await puntuarFinalizados(db, finalizados);
		await recalcularTotales(db, participantesAfectados);

		await registrar('ok', fixtures.length);
		return { estado: 'ok', actualizados: fixtures.length };
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		await registrar('error', 0, msg);
		return { estado: 'error', actualizados: 0, error: msg };
	}
}

/** Calcula puntosObtenidos de cada predicción sobre partidos finalizados. */
async function puntuarFinalizados(db: Db, finalizados: Partido[]): Promise<Set<string>> {
	const afectados = new Set<string>();
	if (finalizados.length === 0) return afectados;

	// Config de puntos por quiniela (para respetar pesos personalizados).
	const qs = await db.select().from(quinielas).all();
	const configPorQuiniela = new Map<string, ConfigPuntos>(
		qs.map((q) => [q.id, q.configPuntos as ConfigPuntos])
	);

	for (const partido of finalizados) {
		const preds = await db
			.select()
			.from(predicciones)
			.where(eq(predicciones.partidoId, partido.id))
			.all();

		for (const pred of preds) {
			// Config de la quiniela del participante.
			const part = await db
				.select({ quinielaId: participantes.quinielaId })
				.from(participantes)
				.where(eq(participantes.id, pred.participanteId))
				.get();
			const config = (part && configPorQuiniela.get(part.quinielaId)) ?? qs[0]?.configPuntos;
			if (!config) continue;

			const puntos = calcularPuntos(
				{
					local: pred.golesLocal,
					visita: pred.golesVisita,
					momentoPrimerGol: pred.momentoPrimerGol as Prediccion['momentoPrimerGol'],
					ganadorDesempate: pred.ganadorDesempate as Prediccion['ganadorDesempate']
				},
				{
					local: partido.golesLocal!,
					visita: partido.golesVisita!,
					momentoPrimerGol: partido.momentoPrimerGol,
					avanza: partido.avanza
				},
				config as ConfigPuntos
			);
			await db
				.update(predicciones)
				.set({ puntosObtenidos: puntos })
				.where(eq(predicciones.id, pred.id));
			afectados.add(pred.participanteId);
		}
	}
	return afectados;
}

/** Recalcula participantes.puntosTotal desde cero (idempotente). */
async function recalcularTotales(db: Db, participantesIds: Set<string>): Promise<void> {
	for (const id of participantesIds) {
		const preds = await db
			.select({ puntos: predicciones.puntosObtenidos })
			.from(predicciones)
			.where(eq(predicciones.participanteId, id))
			.all();
		const total = preds.reduce((s, p) => s + (p.puntos ?? 0), 0);
		await db.update(participantes).set({ puntosTotal: total }).where(eq(participantes.id, id));
	}
}

/** Poblado inicial explícito (siembra los 104 partidos). Reusa sincronizar. */
export async function sembrar(db: Db, env: EnvSync) {
	return sincronizar(db, env);
}
