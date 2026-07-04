import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { error } from '@sveltejs/kit';

/** Devuelve el cliente Drizzle desde el binding D1 de la plataforma. */
export function getDb(platform: App.Platform | undefined) {
	if (!platform?.env?.DB) {
		throw error(500, 'Base de datos no disponible (falta el binding D1 "DB").');
	}
	return drizzle(platform.env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
