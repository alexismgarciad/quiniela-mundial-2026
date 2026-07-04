import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { actualizarInscripcion, alternarCongelada, marcarPago, verificarAdmin } from '$lib/server/db/queries';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, platform, cookies }) => {
	const db = getDb(platform);

	// El navegador del creador guarda el token de admin en cookie, indexado por código.
	const adminToken = cookies.get(`admin_${params.codigo}`) ?? '';
	const quiniela = await verificarAdmin(db, params.codigo, adminToken);
	if (!quiniela) return json({ error: 'No autorizado (se requiere token de admin)' }, { status: 403 });

	const body = (await request.json()) as {
		accion?: 'pago' | 'inscripcion' | 'congelar';
		participanteId?: string;
		haPagado?: boolean;
		montoInscripcion?: number;
		moneda?: string;
		congelada?: boolean;
	};

	if (body.accion === 'pago' && body.participanteId != null && body.haPagado != null) {
		await marcarPago(db, quiniela.id, body.participanteId, body.haPagado);
		return json({ ok: true });
	}
	if (body.accion === 'congelar' && body.congelada != null) {
		await alternarCongelada(db, quiniela.id, body.congelada);
		return json({ ok: true });
	}
	if (body.accion === 'inscripcion' && body.montoInscripcion != null && body.moneda) {
		await actualizarInscripcion(db, quiniela.id, {
			montoInscripcion: body.montoInscripcion,
			moneda: body.moneda
		});
		return json({ ok: true });
	}
	return json({ error: 'Acción inválida' }, { status: 400 });
};
