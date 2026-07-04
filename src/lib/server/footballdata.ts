// Cliente de football-data.org (v4) — tier gratis cubre el Mundial 2026.
// Da marcador EN VIVO (status IN_PLAY/PAUSED + score + minute). 10 req/min.
// Requiere un Auth Token gratuito (football-data.org/client/register).

import type { EstadoPartido, Partido } from '$lib/types';
import { traducirEquipo } from './equipos';

const BASE = 'https://api.football-data.org/v4';

interface MatchFD {
	id: number;
	utcDate: string;
	status: string;
	stage: string; // GROUP_STAGE, LAST_16, QUARTER_FINALS, ...
	group: string | null; // "GROUP_A"
	minute?: number | null;
	homeTeam: { name: string | null };
	awayTeam: { name: string | null };
	score: {
		winner?: string | null; // HOME_TEAM | AWAY_TEAM | DRAW
		duration?: string | null; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
		fullTime: { home: number | null; away: number | null };
	};
}

function mapearEstado(status: string): EstadoPartido {
	if (['IN_PLAY', 'PAUSED'].includes(status)) return 'en_vivo';
	if (['FINISHED', 'AWARDED'].includes(status)) return 'finalizado';
	return 'programado';
}

function mapearEtapa(stage: string, group: string | null): string {
	switch (stage) {
		case 'GROUP_STAGE':
			return group ? `Fase de Grupos · Grupo ${group.replace('GROUP_', '')}` : 'Fase de Grupos';
		case 'LAST_32':
			return 'Dieciseisavos de Final';
		case 'LAST_16':
			return 'Octavos de Final';
		case 'QUARTER_FINALS':
			return 'Cuartos de Final';
		case 'SEMI_FINALS':
			return 'Semifinal';
		case 'THIRD_PLACE':
			return 'Tercer Puesto';
		case 'FINAL':
			return 'Final';
		default:
			return stage;
	}
}

function mapear(m: MatchFD): Partido {
	const local = traducirEquipo(m.homeTeam.name ?? 'Por definir');
	const visita = traducirEquipo(m.awayTeam.name ?? 'Por definir');

	// Quién pasa: solo si fue eliminatoria decidida por prórroga/penales (hubo empate).
	const huboDesempate =
		m.stage !== 'GROUP_STAGE' &&
		(m.score.duration === 'EXTRA_TIME' || m.score.duration === 'PENALTY_SHOOTOUT');
	const avanza: Partido['avanza'] = !huboDesempate
		? null
		: m.score.winner === 'HOME_TEAM'
			? 'local'
			: m.score.winner === 'AWAY_TEAM'
				? 'visita'
				: null;

	return {
		id: `fd_${m.id}`,
		ronda: mapearEtapa(m.stage, m.group),
		grupo: m.group ? m.group.replace('GROUP_', '') : undefined,
		equipoLocal: local.nombre,
		equipoVisita: visita.nombre,
		banderaLocal: local.bandera,
		banderaVisita: visita.bandera,
		inicio: m.utcDate,
		estado: mapearEstado(m.status),
		golesLocal: m.score.fullTime.home,
		golesVisita: m.score.fullTime.away,
		minuto: m.minute ?? null,
		avanza
	};
}

/** Trae los partidos del Mundial 2026 (competición WC) desde football-data.org. */
export async function obtenerPartidosFootballData(token: string): Promise<Partido[]> {
	const res = await fetch(`${BASE}/competitions/WC/matches`, {
		headers: { 'X-Auth-Token': token }
	});
	if (!res.ok) throw new Error(`football-data.org respondió ${res.status}`);
	const data = (await res.json()) as { matches?: MatchFD[] };
	if (!Array.isArray(data.matches)) throw new Error('football-data.org: formato inesperado');
	return data.matches.map(mapear);
}
