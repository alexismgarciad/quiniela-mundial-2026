// ============================================================
// Tipos de dominio — Quiniela Mundial 2026
// Reflejan el modelo de datos en D1 (ver docs de diseño).
// ============================================================

export type EstadoPartido = 'programado' | 'en_vivo' | 'finalizado';

/** Momento del primer gol del partido. */
export type MomentoGol = '1T' | '2T' | '1TE' | '2TE';

export const MOMENTOS: { valor: MomentoGol; etiqueta: string }[] = [
	{ valor: '1T', etiqueta: '1er Tiempo' },
	{ valor: '2T', etiqueta: '2do Tiempo' },
	{ valor: '1TE', etiqueta: '1er T. Extra' },
	{ valor: '2TE', etiqueta: '2do T. Extra' }
];

/** Pesos del sistema de puntos. */
export interface ConfigPuntos {
	marcador_exacto: number; // marcador idéntico
	solo_ganador: number; // resultado correcto sin marcador exacto
	quien_pasa: number; // acertar quién avanza en un empate (eliminatorias)
	momento_gol: number; // acertar el tiempo del 1er gol
}

export const CONFIG_PUNTOS_DEFAULT: ConfigPuntos = {
	marcador_exacto: 3,
	solo_ganador: 1,
	quien_pasa: 1,
	momento_gol: 1
};

/** Una liga/pool. El bote NO se guarda: se calcula desde monto × participantes. */
export interface Quiniela {
	id: string;
	nombre: string;
	codigoInvitacion: string;
	montoInscripcion: number;
	moneda: string; // "USD", "PAB"...
	configPuntos: ConfigPuntos;
	congelada: boolean; // el admin cerró la edición para todos
	creadaEn: string; // ISO
}

/** Jugador dentro de una quiniela. */
export interface Participante {
	id: string;
	quinielaId: string;
	nombre: string;
	haPagado: boolean; // informativo
	puntosTotal: number; // desnormalizado, recalculado tras cada sync
}

/** Partido del Mundial (global, poblado desde API-Football). */
export interface Partido {
	id: string;
	ronda: string; // "Fase de Grupos · J1", "Octavos de Final"...
	grupo?: string; // "A".."L" en fase de grupos
	equipoLocal: string; // nombre en español
	equipoVisita: string;
	banderaLocal: string; // emoji o código
	banderaVisita: string;
	inicio: string; // ISO — define el cierre de predicciones
	estado: EstadoPartido;
	golesLocal: number | null;
	golesVisita: number | null;
	minuto?: number | null; // minuto de juego si está en vivo
	// Derivados del resultado (para puntuar momento y desempate):
	momentoPrimerGol?: MomentoGol | null; // tiempo del 1er gol real
	avanza?: 'local' | 'visita' | null; // quién pasó (solo empates de eliminatoria)
}

/** Pronóstico de un participante sobre un partido. */
export interface Prediccion {
	participanteId: string;
	partidoId: string;
	golesLocal: number;
	golesVisita: number;
	momentoPrimerGol?: MomentoGol | null; // tiempo del 1er gol pronosticado
	ganadorDesempate?: 'local' | 'visita' | null; // quién pasa si hay empate
	puntosObtenidos: number | null; // se llena al finalizar el partido
}

/** Fila de la tabla de posiciones (derivada). */
export interface FilaTabla {
	posicion: number;
	participante: Participante;
	aciertosExactos: number;
}
