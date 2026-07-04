// ============================================================
// Datos MOCK para construir la UI sin backend.
// Se reemplazarán por consultas a D1 en la fase de backend.
// ============================================================

import {
	CONFIG_PUNTOS_DEFAULT,
	type Participante,
	type Partido,
	type Prediccion,
	type Quiniela
} from '$lib/types';

const ahora = Date.now();
const H = 3600_000;
const D = 24 * H;
const iso = (ms: number) => new Date(ms).toISOString();

export const quinielaMock: Quiniela = {
	id: 'q_demo',
	nombre: 'Quiniela de la Oficina',
	codigoInvitacion: 'MUNDIAL-4X9K',
	montoInscripcion: 20,
	moneda: 'USD',
	configPuntos: CONFIG_PUNTOS_DEFAULT,
	creadaEn: iso(ahora - 10 * D)
};

export const participantesMock: Participante[] = [
	{ id: 'u1', quinielaId: 'q_demo', nombre: 'Alexis', haPagado: true, puntosTotal: 0 },
	{ id: 'u2', quinielaId: 'q_demo', nombre: 'Iris', haPagado: true, puntosTotal: 0 },
	{ id: 'u3', quinielaId: 'q_demo', nombre: 'Carlos', haPagado: true, puntosTotal: 0 },
	{ id: 'u4', quinielaId: 'q_demo', nombre: 'María', haPagado: false, puntosTotal: 0 },
	{ id: 'u5', quinielaId: 'q_demo', nombre: 'José', haPagado: true, puntosTotal: 0 },
	{ id: 'u6', quinielaId: 'q_demo', nombre: 'Ana', haPagado: false, puntosTotal: 0 },
	{ id: 'u7', quinielaId: 'q_demo', nombre: 'Luis', haPagado: true, puntosTotal: 0 }
];

export const partidosMock: Partido[] = [
	{
		id: 'm1',
		ronda: 'Octavos de Final',
		equipoLocal: 'Argentina',
		equipoVisita: 'Australia',
		banderaLocal: '🇦🇷',
		banderaVisita: '🇦🇺',
		inicio: iso(ahora - 2 * D),
		estado: 'finalizado',
		golesLocal: 2,
		golesVisita: 1
	},
	{
		id: 'm2',
		ronda: 'Octavos de Final',
		equipoLocal: 'España',
		equipoVisita: 'Marruecos',
		banderaLocal: '🇪🇸',
		banderaVisita: '🇲🇦',
		inicio: iso(ahora - 2 * D + 3 * H),
		estado: 'finalizado',
		golesLocal: 3,
		golesVisita: 1
	},
	{
		id: 'm3',
		ronda: 'Octavos de Final',
		equipoLocal: 'Brasil',
		equipoVisita: 'Corea del Sur',
		banderaLocal: '🇧🇷',
		banderaVisita: '🇰🇷',
		inicio: iso(ahora - 1 * D),
		estado: 'finalizado',
		golesLocal: 2,
		golesVisita: 0
	},
	{
		id: 'm4',
		ronda: 'Octavos de Final',
		equipoLocal: 'Uruguay',
		equipoVisita: 'Colombia',
		banderaLocal: '🇺🇾',
		banderaVisita: '🇨🇴',
		inicio: iso(ahora - 1 * D + 3 * H),
		estado: 'finalizado',
		golesLocal: 0,
		golesVisita: 1
	},
	{
		id: 'm5',
		ronda: 'Cuartos de Final',
		equipoLocal: 'Francia',
		equipoVisita: 'Inglaterra',
		banderaLocal: '🇫🇷',
		banderaVisita: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
		inicio: iso(ahora - 63 * 60_000),
		estado: 'en_vivo',
		golesLocal: 1,
		golesVisita: 1,
		minuto: 63
	},
	{
		id: 'm6',
		ronda: 'Cuartos de Final',
		equipoLocal: 'México',
		equipoVisita: 'Portugal',
		banderaLocal: '🇲🇽',
		banderaVisita: '🇵🇹',
		inicio: iso(ahora + 2 * H),
		estado: 'programado',
		golesLocal: null,
		golesVisita: null
	},
	{
		id: 'm7',
		ronda: 'Cuartos de Final',
		equipoLocal: 'Alemania',
		equipoVisita: 'Estados Unidos',
		banderaLocal: '🇩🇪',
		banderaVisita: '🇺🇸',
		inicio: iso(ahora + 1 * D),
		estado: 'programado',
		golesLocal: null,
		golesVisita: null
	},
	{
		id: 'm8',
		ronda: 'Cuartos de Final',
		equipoLocal: 'Países Bajos',
		equipoVisita: 'Croacia',
		banderaLocal: '🇳🇱',
		banderaVisita: '🇭🇷',
		inicio: iso(ahora + 1 * D + 3 * H),
		estado: 'programado',
		golesLocal: null,
		golesVisita: null
	}
];

// Predicciones por participante. Formato compacto: [partidoId, local, visita].
const preds: Record<string, [string, number, number][]> = {
	u1: [['m1', 2, 1], ['m2', 2, 0], ['m3', 2, 0], ['m4', 1, 1], ['m5', 2, 1], ['m6', 1, 0]],
	u2: [['m1', 1, 0], ['m2', 3, 1], ['m3', 1, 0], ['m4', 0, 1], ['m5', 1, 1], ['m6', 2, 2]],
	u3: [['m1', 2, 1], ['m2', 2, 1], ['m3', 3, 1], ['m4', 0, 2], ['m5', 0, 0]],
	u4: [['m1', 0, 0], ['m2', 1, 1], ['m3', 2, 0], ['m4', 1, 2], ['m6', 2, 1]],
	u5: [['m1', 3, 1], ['m2', 2, 0], ['m3', 2, 1], ['m4', 0, 1], ['m5', 3, 2]],
	u6: [['m1', 1, 1], ['m2', 4, 0], ['m3', 1, 1], ['m4', 2, 1]],
	u7: [['m1', 2, 0], ['m2', 3, 1], ['m3', 2, 0], ['m4', 0, 1], ['m5', 1, 0], ['m6', 0, 0]]
};

export const prediccionesMock: Prediccion[] = Object.entries(preds).flatMap(([uid, lista]) =>
	lista.map(([partidoId, golesLocal, golesVisita]) => ({
		participanteId: uid,
		partidoId,
		golesLocal,
		golesVisita,
		puntosObtenidos: null
	}))
);

/** El "yo" actual del demo (simula la identidad por dispositivo). */
export const yoMock = 'u1';
