// ============================================================
// Worker de Cron (separado del app Worker de SvelteKit).
// El adapter-cloudflare solo exporta `fetch`, no `scheduled`,
// así que este Worker mínimo dispara la sincronización cada minuto
// llamando al endpoint /api/sync de la app (el cerebro vive allí).
// ============================================================

interface Env {
	APP_URL: string; // URL de la app desplegada
	SYNC_SECRET: string; // mismo secreto que la app
}

export default {
	async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
		ctx.waitUntil(dispararSync(env));
	},
	// Endpoint de salud / disparo manual.
	async fetch(_req: Request, env: Env) {
		const r = await dispararSync(env);
		return new Response(JSON.stringify(r), { headers: { 'content-type': 'application/json' } });
	}
};

async function dispararSync(env: Env) {
	try {
		const res = await fetch(`${env.APP_URL}/api/sync`, {
			method: 'POST',
			headers: { authorization: `Bearer ${env.SYNC_SECRET}` }
		});
		return { ok: res.ok, status: res.status };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : String(e) };
	}
}
