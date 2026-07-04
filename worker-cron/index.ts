// ============================================================
// Worker de Cron (separado del app Worker de SvelteKit).
// El adapter-cloudflare solo exporta `fetch`, no `scheduled`, así que este
// Worker corre la sincronización DIRECTAMENTE cada minuto contra su propio
// binding a D1 (reutiliza la misma función `sincronizar` de la app).
// ============================================================

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../src/lib/server/db/schema';
import { sincronizar } from '../src/lib/server/sync';

interface Env {
	DB: D1Database;
	SYNC_SECRET?: string;
	FUENTE_DATOS?: string;
	FOOTBALLDATA_TOKEN?: string;
	API_FOOTBALL_KEY?: string;
	APIFOOTBALL_LEAGUE?: string;
	APIFOOTBALL_SEASON?: string;
}

export default {
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		const db = drizzle(env.DB, { schema });
		ctx.waitUntil(sincronizar(db, env).then(() => undefined));
	},
	// Disparo manual protegido por SYNC_SECRET (falla cerrado si falta el secret).
	async fetch(req: Request, env: Env) {
		if (!env.SYNC_SECRET || req.headers.get('authorization') !== `Bearer ${env.SYNC_SECRET}`) {
			return new Response(JSON.stringify({ error: 'No autorizado' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		}
		const db = drizzle(env.DB, { schema });
		const r = await sincronizar(db, env);
		return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } });
	}
};
