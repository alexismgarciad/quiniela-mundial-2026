// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				// Secretos (dev: .dev.vars · prod: wrangler secret put)
				API_FOOTBALL_KEY?: string;
				FOOTBALLDATA_TOKEN?: string;
				SYNC_SECRET?: string;
				// Vars públicas
				MODO_DIVERSION?: string; // "true" = oculta dinero (apto AdSense)
				FUENTE_DATOS?: string; // openfootball | footballdata | apifootball
				APIFOOTBALL_LEAGUE?: string;
				APIFOOTBALL_SEASON?: string;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
		}
	}
}

export {};
