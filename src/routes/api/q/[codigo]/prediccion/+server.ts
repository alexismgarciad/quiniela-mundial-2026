import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { guardarPrediccion, obtenerQuinielaPorCodigo } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform, cookies }) => {
	const db = getDb(platform);
	const quiniela = await obtenerQuinielaPorCodigo(db, params.codigo);
	if (!quiniela) return json({ error: 'Quiniela no encontrada' }, { status: 404 });

	const participanteId = cookies.get(`pid_${params.codigo}`);
	if (!participanteId) return json({ error: 'No eres participante de esta quiniela' }, { status: 401 });

	const body = (await request.json()) as {
		partidoId?: string;
		golesLocal?: number;
		golesVisita?: number;
		momentoPrimerGol?: string | null;
		ganadorDesempate?: string | null;
	};
	if (!body.partidoId || body.golesLocal == null || body.golesVisita == null) {
		return json({ error: 'Datos incompletos' }, { status: 400 });
	}

	const r = await guardarPrediccion(db, {
		participanteId,
		partidoId: body.partidoId,
		golesLocal: body.golesLocal,
		golesVisita: body.golesVisita,
		momentoPrimerGol: body.momentoPrimerGol,
		ganadorDesempate: body.ganadorDesempate
	});
	if (!r.ok) return json({ error: r.motivo }, { status: 409 });
	return json({ ok: true });
};
