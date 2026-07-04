// Cliente de API-Football (api-sports.io). Solo se llama desde el servidor/cron.
import type { EstadoPartido, Partido } from '$lib/types';
import { traducirEquipo, traducirRonda } from './equipos';

const BASE = 'https://v3.football.api-sports.io';

interface FixtureAPI {
	fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
	league: { round: string };
	teams: { home: { name: string }; away: { name: string } };
	goals: { home: number | null; away: number | null };
}

function mapearEstado(short: string): EstadoPartido {
	if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(short)) return 'en_vivo';
	if (['FT', 'AET', 'PEN'].includes(short)) return 'finalizado';
	return 'programado';
}

function mapearFixture(f: FixtureAPI): Partido {
	const local = traducirEquipo(f.teams.home.name);
	const visita = traducirEquipo(f.teams.away.name);
	return {
		id: String(f.fixture.id),
		ronda: traducirRonda(f.league.round),
		equipoLocal: local.nombre,
		equipoVisita: visita.nombre,
		banderaLocal: local.bandera,
		banderaVisita: visita.bandera,
		inicio: f.fixture.date,
		estado: mapearEstado(f.fixture.status.short),
		golesLocal: f.goals.home,
		golesVisita: f.goals.away,
		minuto: f.fixture.status.elapsed
	};
}

async function pedir(key: string, params: Record<string, string>): Promise<FixtureAPI[]> {
	const url = `${BASE}/fixtures?${new URLSearchParams(params)}`;
	const res = await fetch(url, { headers: { 'x-apisports-key': key } });
	if (!res.ok) throw new Error(`API-Football respondió ${res.status}`);
	const data = (await res.json()) as { response?: FixtureAPI[]; errors?: unknown };
	if (!Array.isArray(data.response)) {
		throw new Error(`Respuesta inesperada de API-Football: ${JSON.stringify(data.errors ?? data)}`);
	}
	return data.response;
}

/** Todos los partidos del torneo (para el poblado inicial). */
export async function obtenerTodosLosPartidos(
	key: string,
	league: string,
	season: string
): Promise<Partido[]> {
	const fixtures = await pedir(key, { league, season });
	return fixtures.map(mapearFixture);
}

/** Solo los partidos en vivo del torneo (para el cron; 1 request cubre todos). */
export async function obtenerPartidosEnVivo(key: string, league: string): Promise<Partido[]> {
	const fixtures = await pedir(key, { league, live: 'all' });
	return fixtures.map(mapearFixture);
}
