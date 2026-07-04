// ============================================================
// Motor de puntos — función pura, idempotente, testeable.
// No toca la base de datos: recibe datos, devuelve puntos.
// El cron de sincronización la invoca al finalizar cada partido.
// ============================================================

import type { ConfigPuntos } from './types';

type Marcador = { local: number; visita: number };

/** Signo del partido: 1 = gana local, 0 = empate, -1 = gana visita. */
function resultado(m: Marcador): -1 | 0 | 1 {
	if (m.local > m.visita) return 1;
	if (m.local < m.visita) return -1;
	return 0;
}

/**
 * Calcula los puntos de una predicción contra el resultado real.
 * Granular: suma por capas independientes (estilo Picks4All).
 * Máximo con la config por defecto: 7 puntos.
 */
export function calcularPuntos(
	prediccion: Marcador,
	real: Marcador,
	config: ConfigPuntos
): number {
	let puntos = 0;

	// +3 acertar el resultado (ganador/empate)
	if (resultado(prediccion) === resultado(real)) {
		puntos += config.acertar_resultado;
	}

	// +2 marcador exacto
	if (prediccion.local === real.local && prediccion.visita === real.visita) {
		puntos += config.marcador_exacto;
	}

	// +1 total de goles correcto
	if (prediccion.local + prediccion.visita === real.local + real.visita) {
		puntos += config.total_goles;
	}

	// +1 diferencia de goles correcta
	if (prediccion.local - prediccion.visita === real.local - real.visita) {
		puntos += config.diferencia_goles;
	}

	return puntos;
}

/** ¿La predicción fue un marcador exacto? (para métricas de la tabla) */
export function esMarcadorExacto(prediccion: Marcador, real: Marcador): boolean {
	return prediccion.local === real.local && prediccion.visita === real.visita;
}
