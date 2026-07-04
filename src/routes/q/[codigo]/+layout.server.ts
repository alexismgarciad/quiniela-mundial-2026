import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDb } from '$lib/server/db';
import { cargarPanel, verificarAdmin } from '$lib/server/db/queries';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, platform, cookies }) => {
	const db = getDb(platform);
	const panel = await cargarPanel(db, params.codigo);
	if (!panel) throw error(404, 'Quiniela no encontrada. Revisa el código.');

	// Identidad SOLO desde la cookie válida (indexada por código). Sin cookie = espectador.
	const cookieYo = cookies.get(`pid_${params.codigo}`);
	let yo = cookieYo && panel.participantes.some((p) => p.id === cookieYo) ? cookieYo : '';

	// Conveniencia SOLO en desarrollo: adoptar al primer participante para el demo local.
	// En producción NUNCA se auto-asigna identidad (evita suplantación).
	if (!yo && dev) {
		yo = panel.participantes[0]?.id ?? '';
		if (yo) {
			cookies.set(`pid_${params.codigo}`, yo, {
				path: '/',
				httpOnly: true,
				maxAge: 60 * 60 * 24 * 90
			});
		}
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
