import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDb } from '$lib/server/db';
import { sincronizar } from '$lib/server/sync';
import type { RequestHandler } from './$types';

// Ejecuta la sincronización con API-Football. Protegido por SYNC_SECRET
// (excepto en dev). En producción lo llama el Worker de cron.
export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env ?? ({} as NonNullable<App.Platform['env']>);
	const secreto = env.SYNC_SECRET;

	// Falla CERRADO: en producción se exige el secret; si falta o no coincide, 401.
	if (!dev) {
		const auth = request.headers.get('authorization');
		if (!secreto || auth !== `Bearer ${secreto}`) {
			return json({ error: 'No autorizado' }, { status: 401 });
		}
	}

	const db = getDb(platform);
	const resultado = await sincronizar(db, env);
	const status = resultado.estado === 'error' ? 502 : 200;
	return json(resultado, { status });
};
