import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { unirseQuiniela } from '$lib/server/db/queries';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const form = await request.formData();
		const codigo = String(form.get('codigo') ?? '')
			.trim()
			.toUpperCase();
		const nombre = String(form.get('nombre') ?? '').trim();
		const pin = String(form.get('pin') ?? '').trim();

		if (!codigo || !nombre) return fail(400, { error: 'Código y nombre son obligatorios.' });

		const db = getDb(platform);
		const deviceToken = cookies.get('device') ?? crypto.randomUUID();
		cookies.set('device', deviceToken, { path: '/', httpOnly: true, maxAge: 60 * 60 * 24 * 365 });

		const r = await unirseQuiniela(db, { codigo, nombre, deviceToken, pin: pin || undefined });
		if (!r.ok) return fail(404, { error: r.motivo });

		// Identidad del participante para esta quiniela.
		cookies.set(`pid_${codigo}`, r.participanteId, {
			path: '/',
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 90
		});

		throw redirect(303, `/q/${codigo}`);
	}
};
