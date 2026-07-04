import { fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { crearQuiniela } from '$lib/server/db/queries';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const form = await request.formData();
		const nombre = String(form.get('nombre') ?? '').trim();
		const montoInscripcion = Number(form.get('monto') ?? 0);
		const moneda = String(form.get('moneda') ?? 'USD');

		if (!nombre) return fail(400, { error: 'El nombre es obligatorio.' });

		const db = getDb(platform);
		const { codigo, adminToken } = await crearQuiniela(db, {
			nombre,
			montoInscripcion: Number.isFinite(montoInscripcion) ? montoInscripcion : 0,
			moneda
		});

		// El creador guarda su token de admin en cookie (indexado por código).
		cookies.set(`admin_${codigo}`, adminToken, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 90
		});

		return { creada: true, codigo, nombre };
	}
};
