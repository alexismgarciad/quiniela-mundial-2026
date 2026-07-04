import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getDb } from '$lib/server/db';
import { participantes, partidos, predicciones, quinielas } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
	quinielaMock,
	participantesMock,
	partidosMock,
	prediccionesMock
} from '$lib/mock/mundial';
import type { RequestHandler } from './$types';

// Siembra la quiniela de demostración en D1 (solo entorno dev).
export const POST: RequestHandler = async ({ platform }) => {
	if (!dev) return json({ error: 'Solo disponible en desarrollo.' }, { status: 403 });

	const db = getDb(platform);
	const ahora = new Date().toISOString();

	// Limpia la quiniela demo previa (cascade borra participantes/predicciones).
	await db.delete(quinielas).where(eq(quinielas.id, quinielaMock.id));

	await db.insert(quinielas).values({
		id: quinielaMock.id,
		nombre: quinielaMock.nombre,
		codigoInvitacion: quinielaMock.codigoInvitacion,
		adminToken: 'demo-admin-token',
		montoInscripcion: quinielaMock.montoInscripcion,
		moneda: quinielaMock.moneda,
		configPuntos: quinielaMock.configPuntos,
		creadaEn: quinielaMock.creadaEn
	});

	// Partidos globales (upsert).
	for (const m of partidosMock) {
		await db
			.insert(partidos)
			.values({
				id: m.id,
				ronda: m.ronda,
				grupo: m.grupo ?? null,
				equipoLocal: m.equipoLocal,
				equipoVisita: m.equipoVisita,
				banderaLocal: m.banderaLocal,
				banderaVisita: m.banderaVisita,
				inicio: m.inicio,
				estado: m.estado,
				golesLocal: m.golesLocal,
				golesVisita: m.golesVisita,
				minuto: m.minuto ?? null,
				actualizadoEn: ahora
			})
			.onConflictDoUpdate({
				target: partidos.id,
				set: {
					estado: m.estado,
					golesLocal: m.golesLocal,
					golesVisita: m.golesVisita,
					minuto: m.minuto ?? null,
					inicio: m.inicio,
					actualizadoEn: ahora
				}
			});
	}

	for (const p of participantesMock) {
		await db.insert(participantes).values({
			id: p.id,
			quinielaId: quinielaMock.id,
			nombre: p.nombre,
			deviceToken: `demo-${p.id}`,
			pinHash: null,
			haPagado: p.haPagado,
			puntosTotal: 0,
			unidoEn: ahora
		});
	}

	for (const pr of prediccionesMock) {
		await db.insert(predicciones).values({
			id: crypto.randomUUID(),
			participanteId: pr.participanteId,
			partidoId: pr.partidoId,
			golesLocal: pr.golesLocal,
			golesVisita: pr.golesVisita,
			puntosObtenidos: null
		});
	}

	return json({ ok: true, mensaje: 'Quiniela demo sembrada.', codigo: quinielaMock.codigoInvitacion });
};
