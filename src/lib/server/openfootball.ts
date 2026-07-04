// Cliente de openfootball (worldcup.json) — datos públicos, SIN API key.
// Cubre fixtures + resultados finales del Mundial 2026. No da marcador en vivo
// (para "en vivo" real usar football-data.org). Fuente gratuita de poblado.

import type { EstadoPartido, Partido } from '$lib/types';
import { traducirEquipo, traducirRondaOpenfootball } from './equipos';

const URL_2026 =
	'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

interface MatchOF {
	round: string;
	date: string; // "2026-06-11"
	time?: string; // "13:00 UTC-6"
	team1: string;
	team2: string;
	group?: string; // "Group A"
	score?: { ft?: [number, number]; et?: [number, number]; p?: [number, number] };
}

/** Convierte "2026-06-11" + "13:00 UTC-6" en ISO. */
function aISO(date: string, time?: string): string {
	if (!time) return `${date}T00:00:00Z`;
	const hm = time.match(/(\d{1,2}):(\d{2})/);
	const tz = time.match(/UTC([+-])(\d{1,2})/);
	const hh = hm ? hm[1].padStart(2, '0') : '00';
	const mm = hm ? hm[2] : '00';
	const offset = tz ? `${tz[1]}${tz[2].padStart(2, '0')}:00` : 'Z';
	const d = new Date(`${date}T${hh}:${mm}:00${offset}`);
	return isNaN(d.getTime()) ? `${date}T00:00:00Z` : d.toISOString();
}

function grupoLetra(group?: string): string | undefined {
	const m = group?.match(/([A-L])/i);
	return m ? m[1].toUpperCase() : undefined;
}

function idEstable(m: MatchOF): string {
	const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
	return `of_${m.date}_${slug(m.team1)}_${slug(m.team2)}`;
}

function mapear(m: MatchOF): Partido {
	const local = traducirEquipo(m.team1);
	const visita = traducirEquipo(m.team2);
	const ft = m.score?.ft;
	const estado: EstadoPartido = ft ? 'finalizado' : 'programado';
	return {
		id: idEstable(m),
		ronda: traducirRondaOpenfootball(m.round, m.group),
		grupo: grupoLetra(m.group),
		equipoLocal: local.nombre,
		equipoVisita: visita.nombre,
		banderaLocal: local.bandera,
		banderaVisita: visita.bandera,
		inicio: aISO(m.date, m.time),
		estado,
		golesLocal: ft ? ft[0] : null,
		golesVisita: ft ? ft[1] : null,
		minuto: null
	};
}

/** Trae los 104 partidos del Mundial 2026 desde openfootball. */
export async function obtenerPartidosOpenfootball(): Promise<Partido[]> {
	const res = await fetch(URL_2026, { headers: { accept: 'application/json' } });
	if (!res.ok) throw new Error(`openfootball respondió ${res.status}`);
	const data = (await res.json()) as { matches?: MatchOF[] };
	if (!Array.isArray(data.matches)) throw new Error('openfootball: formato inesperado');
	return data.matches.map(mapear);
}
