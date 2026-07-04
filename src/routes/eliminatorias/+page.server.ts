import { asc } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { partidos } from '$lib/server/db/schema';
import type { Partido } from '$lib/types';
import type { PageServerLoad } from './$types';

// Orden de las rondas de eliminatoria (Mundial 2026: 32 → 16 → 8 → 4 → 2 → final).
const ORDEN = [
	'Dieciseisavos de Final',
	'Octavos de Final',
	'Cuartos de Final',
	'Semifinal',
	'Final',
	'Tercer Puesto'
];

export const load: PageServerLoad = async ({ platform }) => {
	try {
		const db = getDb(platform);
		const filas = await db.select().from(partidos).orderBy(asc(partidos.inicio)).all();

		const aPartido = (m: (typeof filas)[number]): Partido => ({
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
		});

		// Agrupa por ronda, solo eliminatorias, en el orden definido.
		const rondas = ORDEN.map((nombre) => ({
			nombre,
			partidos: filas.filter((m) => m.ronda === nombre).map(aPartido)
		})).filter((r) => r.partidos.length > 0);

		return { rondas };
	} catch {
		return { rondas: [] };
	}
};
