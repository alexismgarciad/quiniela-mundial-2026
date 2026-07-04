// ============================================================
// Tipos de dominio — Quiniela Mundial 2026
// Reflejan el modelo de datos en D1 (ver docs de diseño).
// ============================================================

export type EstadoPartido = 'programado' | 'en_vivo' | 'finalizado';

/** Pesos del sistema de puntos granular (estilo Picks4All). */
export interface ConfigPuntos {
	acertar_resultado: number; // acertar ganador/empate
	marcador_exacto: number; // marcador idéntico
	total_goles: number; // suma de goles correcta
	diferencia_goles: number; // diferencia de goles correcta
}

export const CONFIG_PUNTOS_DEFAULT: ConfigPuntos = {
	acertar_resultado: 3,
	marcador_exacto: 2,
	total_goles: 1,
	diferencia_goles: 1
};

/** Una liga/pool. El bote NO se guarda: se calcula desde monto × participantes. */
export interface Quiniela {
	id: string;
	nombre: string;
	codigoInvitacion: string;
	montoInscripcion: number;
	moneda: string; // "USD", "PAB"...
	configPuntos: ConfigPuntos;
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
}

/** Pronóstico de un participante sobre un partido. */
export interface Prediccion {
	participanteId: string;
	partidoId: string;
	golesLocal: number;
	golesVisita: number;
	puntosObtenidos: number | null; // se llena al finalizar el partido
}

/** Fila de la tabla de posiciones (derivada). */
export interface FilaTabla {
	posicion: number;
	participante: Participante;
	aciertosExactos: number;
}
