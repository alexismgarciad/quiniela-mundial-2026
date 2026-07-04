import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { establecerPin, obtenerQuinielaPorCodigo } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

// El jugador (ya identificado por su cookie) se pone un PIN opcional
// para poder reconectarse desde otro dispositivo con su nombre + PIN.
export const POST: RequestHandler = async ({ params, request, platform, cookies }) => {
	const db = getDb(platform);
	const quiniela = await obtenerQuinielaPorCodigo(db, params.codigo);
	if (!quiniela) return json({ error: 'Quiniela no encontrada' }, { status: 404 });

	const participanteId = cookies.get(`pid_${params.codigo}`);
	if (!participanteId) return json({ error: 'No eres participante de esta quiniela' }, { status: 401 });

	const body = (await request.json()) as { pin?: string };
	if (!body.pin) return json({ error: 'Falta el PIN' }, { status: 400 });

	const r = await establecerPin(db, quiniela.id, participanteId, body.pin);
	if (!r.ok) return json({ error: r.motivo }, { status: 400 });
	return json({ ok: true });
};
