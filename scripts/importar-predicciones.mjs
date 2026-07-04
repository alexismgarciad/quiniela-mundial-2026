#!/usr/bin/env node
// ============================================================
// Importador de predicciones previas (quinielas en curso).
//
// Lee un JSON en lenguaje natural (nombres de equipo + marcador + momento),
// resuelve cada partido contra D1, ALINEA el marcador al local/visita real
// del fixture (corrige si escribiste los equipos al revés), y genera UPSERT
// idempotentes. El motor de puntos los calcula en el siguiente sync.
//
// Uso:
//   node scripts/importar-predicciones.mjs [archivo.json]        # dry-run: valida + escribe el .sql, NO toca nada
//   node scripts/importar-predicciones.mjs [archivo.json] --aplicar   # ejecuta contra D1 remoto
//
// Requiere wrangler logueado (el mismo que usas para deploy).
// Tras aplicar, corre el sync forzado para puntuar (el script te lo recuerda).
// ============================================================

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const DB = 'quiniela-db';
const AQUI = dirname(fileURLToPath(import.meta.url));
const MOMENTOS = ['1T', '2T', '1TE', '2TE'];

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const archivo = resolve(args.find((a) => !a.startsWith('--')) ?? join(AQUI, 'predicciones-previas.json'));

// --- utilidades -------------------------------------------------------------
const norm = (s) =>
	String(s ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim();
const esc = (s) => String(s).replace(/'/g, "''");
const esEliminatoria = (ronda) => !/grupo|group/i.test(ronda);
const morir = (msg) => {
	console.error(`\n❌ ${msg}\n`);
	process.exit(1);
};

/** Corre una consulta de solo-lectura en D1 remoto y devuelve las filas. */
function d1Query(sql) {
	const out = execFileSync(
		'npx',
		['wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', sql],
		{ encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
	);
	// wrangler puede anteponer líneas de log antes del JSON; agarra desde el primer '['/'{'.
	const i = out.search(/[[{]/);
	const parsed = JSON.parse(out.slice(i));
	const arr = Array.isArray(parsed) ? parsed : [parsed];
	return arr[0]?.results ?? [];
}

// --- 1. cargar el archivo de entrada ---------------------------------------
let data;
try {
	data = JSON.parse(readFileSync(archivo, 'utf8'));
} catch (e) {
	morir(`No pude leer ${archivo}: ${e.message}`);
}
if (!data.quinielaCodigo) morir('Falta "quinielaCodigo" en el JSON.');
if (!Array.isArray(data.jugadores) || data.jugadores.length === 0) morir('No hay "jugadores" en el JSON.');

console.log(`\n📥 Importando desde ${archivo}`);
console.log(`   Quiniela: ${data.quinielaCodigo}  ·  ${data.jugadores.length} jugador(es)\n`);

// --- 2. leer contexto de D1 -------------------------------------------------
const [quiniela] = d1Query(
	`SELECT id, nombre FROM quinielas WHERE codigo_invitacion = '${esc(data.quinielaCodigo)}'`
);
if (!quiniela) morir(`No existe una quiniela con código ${data.quinielaCodigo}.`);

const partidos = d1Query(
	`SELECT id, ronda, equipo_local, equipo_visita FROM partidos`
);
const participantes = d1Query(
	`SELECT id, nombre FROM participantes WHERE quiniela_id = '${esc(quiniela.id)}'`
);

// índice de partidos por par de equipos (orden-insensible)
const porPar = new Map();
for (const p of partidos) {
	const k = [norm(p.equipo_local), norm(p.equipo_visita)].sort().join('|');
	if (!porPar.has(k)) porPar.set(k, []);
	porPar.get(k).push(p);
}
// índice de participantes por nombre normalizado
const porNombre = new Map(participantes.map((p) => [norm(p.nombre), p]));

// --- 3. resolver todo (validación estricta antes de escribir nada) ----------
const now = new Date().toISOString();
const sql = [];
const errores = [];
let nuevosParticipantes = 0;
let totalPreds = 0;

for (const jugador of data.jugadores) {
	if (!jugador.nombre) {
		errores.push('Un jugador no tiene "nombre".');
		continue;
	}
	// participante: reusar si ya existe (por nombre), si no crearlo
	let part = porNombre.get(norm(jugador.nombre));
	if (!part) {
		part = { id: randomUUID(), nombre: jugador.nombre };
		porNombre.set(norm(jugador.nombre), part);
		nuevosParticipantes++;
		sql.push(
			`INSERT INTO participantes (id, quiniela_id, nombre, device_token, ha_pagado, puntos_total, unido_en) ` +
				`VALUES ('${part.id}', '${esc(quiniela.id)}', '${esc(jugador.nombre)}', '${randomUUID()}', 0, 0, '${now}');`
		);
	}

	for (const pred of jugador.predicciones ?? []) {
		const etiqueta = `${jugador.nombre}: ${pred.local} vs ${pred.visita}`;

		// marcador "L-V"
		const m = /^\s*(\d+)\s*-\s*(\d+)\s*$/.exec(pred.marcador ?? '');
		if (!m) {
			errores.push(`${etiqueta} → marcador inválido "${pred.marcador}" (usa "2-1").`);
			continue;
		}
		let golesU_local = Number(m[1]);
		let golesU_visita = Number(m[2]);

		// resolver el partido por par de equipos
		const k = [norm(pred.local), norm(pred.visita)].sort().join('|');
		let candidatos = porPar.get(k) ?? [];
		if (candidatos.length === 0) {
			errores.push(`${etiqueta} → no encontré ese partido (¿nombres correctos?).`);
			continue;
		}
		if (candidatos.length > 1 && pred.ronda) {
			candidatos = candidatos.filter((c) => norm(c.ronda).includes(norm(pred.ronda)));
		}
		if (candidatos.length !== 1) {
			errores.push(
				`${etiqueta} → ${candidatos.length} partidos coinciden; agrega "ronda" para desambiguar.`
			);
			continue;
		}
		const partido = candidatos[0];

		// ALINEAR el marcador al local/visita real del fixture
		let golesLocal, golesVisita;
		if (norm(partido.equipo_local) === norm(pred.local)) {
			golesLocal = golesU_local;
			golesVisita = golesU_visita;
		} else {
			golesLocal = golesU_visita; // el usuario los escribió al revés
			golesVisita = golesU_local;
		}

		// momento (opcional)
		let momento = null;
		if (pred.momento != null && pred.momento !== '') {
			momento = String(pred.momento).toUpperCase();
			if (!MOMENTOS.includes(momento)) {
				errores.push(`${etiqueta} → momento inválido "${pred.momento}" (usa 1T/2T/1TE/2TE).`);
				continue;
			}
		}

		// desempate "pasa" (solo eliminatorias)
		let ganadorDesempate = 'NULL';
		if (pred.pasa != null && pred.pasa !== '') {
			if (!esEliminatoria(partido.ronda)) {
				errores.push(`${etiqueta} → "pasa" no aplica en fase de grupos.`);
				continue;
			}
			const lado =
				norm(partido.equipo_local) === norm(pred.pasa)
					? 'local'
					: norm(partido.equipo_visita) === norm(pred.pasa)
						? 'visita'
						: null;
			if (!lado) {
				errores.push(`${etiqueta} → "${pred.pasa}" no juega ese partido.`);
				continue;
			}
			ganadorDesempate = `'${lado}'`;
		}

		// UPSERT idempotente (deja puntos_obtenidos en NULL → lo calcula el sync)
		sql.push(
			`INSERT INTO predicciones (id, participante_id, partido_id, goles_local, goles_visita, momento_primer_gol, ganador_desempate, puntos_obtenidos) ` +
				`VALUES ('${randomUUID()}', '${part.id}', '${esc(partido.id)}', ${golesLocal}, ${golesVisita}, ${momento ? `'${momento}'` : 'NULL'}, ${ganadorDesempate}, NULL) ` +
				`ON CONFLICT (participante_id, partido_id) DO UPDATE SET ` +
				`goles_local = excluded.goles_local, goles_visita = excluded.goles_visita, ` +
				`momento_primer_gol = excluded.momento_primer_gol, ganador_desempate = excluded.ganador_desempate, ` +
				`puntos_obtenidos = NULL;`
		);
		totalPreds++;
	}
}

// --- 4. reporte + salida ----------------------------------------------------
if (errores.length) {
	console.error('Se encontraron problemas — no se cargó nada:\n');
	for (const e of errores) console.error(`  • ${e}`);
	morir(`${errores.length} error(es). Corrige el JSON y vuelve a correr.`);
}

const rutaSql = join(AQUI, '_importar-predicciones.sql');
writeFileSync(rutaSql, sql.join('\n') + '\n');
console.log(`✓ Validado: ${totalPreds} predicción(es), ${nuevosParticipantes} participante(s) nuevo(s).`);
console.log(`✓ SQL escrito en ${rutaSql}`);

if (!aplicar) {
	console.log(`\n🔎 Dry-run. Revisa el SQL y, si está bien, vuelve a correr con --aplicar:\n`);
	console.log(`   node scripts/importar-predicciones.mjs ${args[0] && !args[0].startsWith('--') ? args[0] : ''} --aplicar\n`);
	process.exit(0);
}

console.log(`\n🚀 Aplicando en D1 remoto...`);
execFileSync('npx', ['wrangler', 'd1', 'execute', DB, '--remote', '--file', rutaSql], {
	stdio: 'inherit'
});
console.log(`\n✅ Predicciones cargadas.`);
console.log(`   Ahora corre el sync forzado para puntuar los partidos ya finalizados:`);
console.log(`   curl -s -X POST "https://quiniela-mundial-2026.3qbic.workers.dev/api/sync?force=1" -H "Authorization: Bearer <SYNC_SECRET>"\n`);
