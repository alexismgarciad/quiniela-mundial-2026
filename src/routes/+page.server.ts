import { asc, ne } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { partidos } from '$lib/server/db/schema';
import type { Partido } from '$lib/types';
import type { PageServerLoad } from './$types';

// Muestra en el hero el partido EN VIVO o el próximo (más útil que las fechas del torneo).
export const load: PageServerLoad = async ({ platform }) => {
	try {
		const db = getDb(platform);
		const filas = await db
			.select()
			.from(partidos)
			.where(ne(partidos.estado, 'finalizado'))
			.orderBy(asc(partidos.inicio))
			.all();

		const enVivo = filas.find((m) => m.estado === 'en_vivo');
		const proximo = filas.find(
			(m) => m.equipoLocal !== 'Por definir' && m.equipoVisita !== 'Por definir'
		);
		const m = enVivo ?? proximo;
		if (!m) return { destacado: null };

		const destacado: Partido = {
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
		};
		return { destacado };
	} catch {
		return { destacado: null };
	}
};
