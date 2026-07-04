// ============================================================
// Esquema Drizzle para D1 (SQLite). Refleja src/lib/types.ts.
// Timestamps como texto ISO para no convertir en la capa de dominio.
// ============================================================

import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const quinielas = sqliteTable('quinielas', {
	id: text('id').primaryKey(),
	nombre: text('nombre').notNull(),
	codigoInvitacion: text('codigo_invitacion').notNull().unique(),
	adminToken: text('admin_token').notNull(),
	montoInscripcion: real('monto_inscripcion').notNull().default(0),
	moneda: text('moneda').notNull().default('USD'),
	// Pesos del sistema de puntos (JSON serializado).
	configPuntos: text('config_puntos', { mode: 'json' }).notNull(),
	creadaEn: text('creada_en').notNull()
});

export const participantes = sqliteTable(
	'participantes',
	{
		id: text('id').primaryKey(),
		quinielaId: text('quiniela_id')
			.notNull()
			.references(() => quinielas.id, { onDelete: 'cascade' }),
		nombre: text('nombre').notNull(),
		deviceToken: text('device_token').notNull(),
		pinHash: text('pin_hash'),
		haPagado: integer('ha_pagado', { mode: 'boolean' }).notNull().default(false),
		puntosTotal: integer('puntos_total').notNull().default(0),
		unidoEn: text('unido_en').notNull()
	},
	(t) => [index('idx_participantes_quiniela').on(t.quinielaId)]
);

// Partidos globales: poblados una vez desde API-Football, compartidos por todas las quinielas.
export const partidos = sqliteTable('partidos', {
	id: text('id').primaryKey(), // fixture_id de API-Football
	ronda: text('ronda').notNull(),
	grupo: text('grupo'),
	equipoLocal: text('equipo_local').notNull(),
	equipoVisita: text('equipo_visita').notNull(),
	banderaLocal: text('bandera_local').notNull().default(''),
	banderaVisita: text('bandera_visita').notNull().default(''),
	inicio: text('inicio').notNull(),
	estado: text('estado').notNull().default('programado'),
	golesLocal: integer('goles_local'),
	golesVisita: integer('goles_visita'),
	minuto: integer('minuto'),
	actualizadoEn: text('actualizado_en').notNull()
});

export const predicciones = sqliteTable(
	'predicciones',
	{
		id: text('id').primaryKey(),
		participanteId: text('participante_id')
			.notNull()
			.references(() => participantes.id, { onDelete: 'cascade' }),
		partidoId: text('partido_id')
			.notNull()
			.references(() => partidos.id, { onDelete: 'cascade' }),
		golesLocal: integer('goles_local').notNull(),
		golesVisita: integer('goles_visita').notNull(),
		puntosObtenidos: integer('puntos_obtenidos')
	},
	(t) => [uniqueIndex('idx_pred_unica').on(t.participanteId, t.partidoId)]
);

// Auditoría del cron: para depurar la sincronización con la API.
export const syncLog = sqliteTable('sync_log', {
	id: text('id').primaryKey(),
	corridaEn: text('corrida_en').notNull(),
	partidosActualizados: integer('partidos_actualizados').notNull().default(0),
	estado: text('estado').notNull(), // "ok" | "error" | "sin_ventana"
	errorMsg: text('error_msg')
});
