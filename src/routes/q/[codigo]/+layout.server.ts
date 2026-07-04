import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { cargarPanel, verificarAdmin } from '$lib/server/db/queries';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, platform, cookies }) => {
	const db = getDb(platform);
	const panel = await cargarPanel(db, params.codigo);
	if (!panel) throw error(404, 'Quiniela no encontrada. Revisa el código.');

	// Identidad por cookie (sin cuentas), indexada por código. Fallback dev: primer participante.
	const cookieYo = cookies.get(`pid_${params.codigo}`);
	const yo =
		cookieYo && panel.participantes.some((p) => p.id === cookieYo)
			? cookieYo
			: (panel.participantes[0]?.id ?? '');

	// Persiste la identidad para que los endpoints de escritura la reconozcan.
	if (yo && yo !== cookieYo) {
		cookies.set(`pid_${params.codigo}`, yo, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 90 });
	}

	// ¿El navegador tiene el token de admin de esta quiniela?
	const adminToken = cookies.get(`admin_${params.codigo}`);
	const esAdmin = adminToken ? !!(await verificarAdmin(db, params.codigo, adminToken)) : false;

	return {
		codigo: params.codigo,
		quiniela: panel.quiniela,
		participantes: panel.participantes,
		partidos: panel.partidos,
		predicciones: panel.predicciones,
		yo,
		esAdmin
	};
};
