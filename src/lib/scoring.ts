// ============================================================
// Motor de puntos — función pura, idempotente, testeable.
// 3 marcador exacto · 1 solo resultado · +1 quién pasa · +1 momento del 1er gol.
// ============================================================

import type { ConfigPuntos, MomentoGol } from './types';

type Lado = 'local' | 'visita';

export interface PrediccionEval {
	local: number;
	visita: number;
	momentoPrimerGol?: MomentoGol | null;
	ganadorDesempate?: Lado | null;
}

export interface ResultadoEval {
	local: number;
	visita: number;
	momentoPrimerGol?: MomentoGol | null; // tiempo real del 1er gol
	avanza?: Lado | null; // quién pasó (solo empates de eliminatoria)
}

/** Signo del partido: 1 = local, 0 = empate, -1 = visita. */
function resultado(local: number, visita: number): -1 | 0 | 1 {
	if (local > visita) return 1;
	if (local < visita) return -1;
	return 0;
}

/**
 * Calcula los puntos de una predicción contra el resultado real.
 * - Marcador exacto → marcador_exacto (3). Si no, mismo resultado → solo_ganador (1).
 * - Acertar quién pasa (cuando hubo empate y desempate) → +quien_pasa (1).
 * - Acertar el tiempo del 1er gol → +momento_gol (1).
 */
export function calcularPuntos(
	pred: PrediccionEval,
	real: ResultadoEval,
	config: ConfigPuntos
): number {
	// Defensivo: si falta una clave en la config (quiniela vieja), cuenta 0 en vez de NaN.
	const c = (v: number | undefined) => (Number.isFinite(v) ? (v as number) : 0);
	let puntos = 0;

	if (pred.local === real.local && pred.visita === real.visita) {
		puntos += c(config.marcador_exacto);
	} else if (resultado(pred.local, pred.visita) === resultado(real.local, real.visita)) {
		puntos += c(config.solo_ganador);
	}

	// Quién pasa: solo suma si el partido real terminó empatado y hubo un avance definido.
	if (real.avanza && pred.ganadorDesempate === real.avanza) {
		puntos += c(config.quien_pasa);
	}

	// Momento del 1er gol.
	if (real.momentoPrimerGol && pred.momentoPrimerGol === real.momentoPrimerGol) {
		puntos += c(config.momento_gol);
	}

	return puntos;
}

/** ¿La predicción fue un marcador exacto? (para métricas de la tabla) */
export function esMarcadorExacto(pred: { local: number; visita: number }, real: { local: number; visita: number }): boolean {
	return pred.local === real.local && pred.visita === real.visita;
}

/** Convierte el minuto del primer gol en el tiempo correspondiente. */
export function momentoDesdeMinuto(minuto: number): MomentoGol {
	if (minuto <= 45) return '1T';
	if (minuto <= 90) return '2T';
	if (minuto <= 105) return '1TE';
	return '2TE';
}
