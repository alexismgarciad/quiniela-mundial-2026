// ============================================================
// Lógica de dominio derivada — funciones puras.
// Reutilizable en frontend (UI) y backend (endpoints/cron).
// ============================================================

import type { FilaTabla, Participante, Partido, Prediccion, Quiniela } from './types';
import { calcularPuntos, esMarcadorExacto } from './scoring';

/**
 * Bote acumulado = monto de inscripción × número de participantes.
 * No se almacena: se deriva siempre para no desincronizarse.
 */
export function calcularBote(quiniela: Quiniela, participantes: Participante[]): number {
	return quiniela.montoInscripcion * participantes.length;
}

/** Monto ya recaudado según los que están marcados como pagados (informativo). */
export function calcularRecaudado(quiniela: Quiniela, participantes: Participante[]): number {
	const pagados = participantes.filter((p) => p.haPagado).length;
	return quiniela.montoInscripcion * pagados;
}

/** Formatea un monto con su moneda, estilo panameño (12h/es no aplica aquí). */
export function formatoMoneda(monto: number, moneda: string): string {
	return new Intl.NumberFormat('es-PA', {
		style: 'currency',
		currency: moneda === 'PAB' ? 'PAB' : 'USD'
	}).format(monto);
}

/**
 * Construye la tabla de posiciones ordenada.
 * Recalcula puntos desde cero (idempotente): puntos = suma de predicciones
 * sobre partidos finalizados. Desempate: más marcadores exactos.
 */
export function calcularTabla(
	quiniela: Quiniela,
	participantes: Participante[],
	partidos: Partido[],
	predicciones: Prediccion[]
): FilaTabla[] {
	const porId = new Map(partidos.map((p) => [p.id, p]));

	const filas = participantes.map((participante) => {
		let puntos = 0;
		let exactos = 0;

		for (const pred of predicciones) {
			if (pred.participanteId !== participante.id) continue;
			const partido = porId.get(pred.partidoId);
			if (!partido || partido.estado !== 'finalizado') continue;
			if (partido.golesLocal === null || partido.golesVisita === null) continue;

			const real = { local: partido.golesLocal, visita: partido.golesVisita };
			const prediccion = { local: pred.golesLocal, visita: pred.golesVisita };
			puntos += calcularPuntos(prediccion, real, quiniela.configPuntos);
			if (esMarcadorExacto(prediccion, real)) exactos++;
		}

		return { participante: { ...participante, puntosTotal: puntos }, aciertosExactos: exactos };
	});

	filas.sort((a, b) => {
		if (b.participante.puntosTotal !== a.participante.puntosTotal) {
			return b.participante.puntosTotal - a.participante.puntosTotal;
		}
		if (b.aciertosExactos !== a.aciertosExactos) return b.aciertosExactos - a.aciertosExactos;
		return a.participante.nombre.localeCompare(b.participante.nombre, 'es');
	});

	return filas.map((f, i) => ({ posicion: i + 1, ...f }));
}

/** ¿Ya cerró la predicción de este partido? (kickoff pasado o en juego). */
export function prediccionCerrada(partido: Partido, ahora: Date = new Date()): boolean {
	if (partido.estado !== 'programado') return true;
	return new Date(partido.inicio).getTime() <= ahora.getTime();
}
