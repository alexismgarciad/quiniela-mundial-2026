CREATE TABLE `participantes` (
	`id` text PRIMARY KEY NOT NULL,
	`quiniela_id` text NOT NULL,
	`nombre` text NOT NULL,
	`device_token` text NOT NULL,
	`pin_hash` text,
	`ha_pagado` integer DEFAULT false NOT NULL,
	`puntos_total` integer DEFAULT 0 NOT NULL,
	`unido_en` text NOT NULL,
	FOREIGN KEY (`quiniela_id`) REFERENCES `quinielas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_participantes_quiniela` ON `participantes` (`quiniela_id`);--> statement-breakpoint
CREATE TABLE `partidos` (
	`id` text PRIMARY KEY NOT NULL,
	`ronda` text NOT NULL,
	`grupo` text,
	`equipo_local` text NOT NULL,
	`equipo_visita` text NOT NULL,
	`bandera_local` text DEFAULT '' NOT NULL,
	`bandera_visita` text DEFAULT '' NOT NULL,
	`inicio` text NOT NULL,
	`estado` text DEFAULT 'programado' NOT NULL,
	`goles_local` integer,
	`goles_visita` integer,
	`minuto` integer,
	`actualizado_en` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `predicciones` (
	`id` text PRIMARY KEY NOT NULL,
	`participante_id` text NOT NULL,
	`partido_id` text NOT NULL,
	`goles_local` integer NOT NULL,
	`goles_visita` integer NOT NULL,
	`puntos_obtenidos` integer,
	FOREIGN KEY (`participante_id`) REFERENCES `participantes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`partido_id`) REFERENCES `partidos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_pred_unica` ON `predicciones` (`participante_id`,`partido_id`);--> statement-breakpoint
CREATE TABLE `quinielas` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`codigo_invitacion` text NOT NULL,
	`admin_token` text NOT NULL,
	`monto_inscripcion` real DEFAULT 0 NOT NULL,
	`moneda` text DEFAULT 'USD' NOT NULL,
	`config_puntos` text NOT NULL,
	`creada_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `quinielas_codigo_invitacion_unique` ON `quinielas` (`codigo_invitacion`);--> statement-breakpoint
CREATE TABLE `sync_log` (
	`id` text PRIMARY KEY NOT NULL,
	`corrida_en` text NOT NULL,
	`partidos_actualizados` integer DEFAULT 0 NOT NULL,
	`estado` text NOT NULL,
	`error_msg` text
);
