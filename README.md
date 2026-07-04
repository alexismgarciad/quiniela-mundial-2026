# 🏆 Quiniela Mundial 2026

Arma una quiniela del Mundial 2026 con tus amigos: define el monto de inscripción, comparte un código, pronostica los 104 partidos y sigue la tabla de posiciones en tiempo real. **Sin apuestas ni pagos dentro de la app** — el bote es informativo y el dinero se coordina por fuera.

> App en español neutro, pensada para el público hispanohablante (quiniela / polla / prode / penca).

## ✨ Características

- **Multi-quiniela auto-servicio**: cualquiera crea una quiniela y comparte su código de invitación.
- **Bote acumulado**: se calcula automáticamente (`monto × participantes`); el admin marca quién pagó.
- **Pronósticos por marcador** con sistema de puntos granular (resultado + marcador exacto + total de goles + diferencia).
- **Seguimiento en vivo**: marcadores y tabla se actualizan solos durante los partidos.
- **Sin fricción**: te unes con nombre + código (PIN opcional), sin crear cuenta.

## 🧱 Stack

| Capa | Tecnología |
|---|---|
| Frontend + SSR | SvelteKit 2 · Svelte 5 (runes) · Tailwind v4 |
| Runtime | Cloudflare Workers (`@sveltejs/adapter-cloudflare`) |
| Base de datos | Cloudflare D1 (SQLite) + Drizzle ORM |
| Sincronización | Cron Worker → endpoint `/api/sync` → API de fútbol |

Todo corre en el **plan gratuito** de Cloudflare.

## 🚀 Desarrollo local

Requisitos: Node 20+ y npm.

```bash
git clone https://github.com/alexismgarciad/quiniela-mundial-2026.git
cd quiniela-mundial-2026
npm install
cp .dev.vars.example .dev.vars    # (opcional) para el marcador en vivo
npm run db:migrate:local          # crea el D1 local emulado
npm run dev                       # http://localhost:5173
```

Con `FUENTE_DATOS=openfootball` (por defecto) **no necesitas ninguna clave** para poblar los partidos. Para verlos, dispara un sync local:

```bash
curl -X POST localhost:5173/api/sync
```

## ☁️ Despliegue GRATIS en Cloudflare (paso a paso)

Todo esto corre en el **plan gratuito** de Cloudflare. Necesitas una cuenta gratis en [cloudflare.com](https://dash.cloudflare.com/sign-up).

**1. Autentícate y crea la base de datos**
```bash
npx wrangler login
npx wrangler d1 create quiniela-db
```
Copia el `database_id` que imprime y pégalo en `wrangler.jsonc` (campo `d1_databases[0].database_id`) **y** en `worker-cron/wrangler.jsonc`.

**2. Crea las tablas en la nube**
```bash
npm run db:migrate:remote
```

**3. Despliega la app y el cron**
```bash
npx wrangler deploy                                        # la app
npx wrangler deploy --config worker-cron/wrangler.jsonc    # el cron (sincroniza solo)
```
Wrangler te dará la URL pública (algo como `https://quiniela-mundial-2026.TU-SUBDOMINIO.workers.dev`).

**4. (Opcional) Marcador EN VIVO gratis**
Consigue un token gratuito en [football-data.org/client/register](https://www.football-data.org/client/register) (cubre el Mundial 2026, 10 req/min), cámbialo en ambos `wrangler.jsonc` a `"FUENTE_DATOS": "footballdata"` y ponlo como secret en la app **y** el cron:
```bash
echo "TU_TOKEN" | npx wrangler secret put FOOTBALLDATA_TOKEN
echo "TU_TOKEN" | npx wrangler secret put FOOTBALLDATA_TOKEN --config worker-cron/wrangler.jsonc
```
Sin este paso, la app usa **openfootball** (gratis, sin registro): fixtures + resultados finales, pero sin minuto-a-minuto en vivo.

## 🔑 Variables y secretos

| Nombre | Tipo | Descripción |
|---|---|---|
| `FUENTE_DATOS` | var | `openfootball` (sin key) · `footballdata` (en vivo) · `apifootball` |
| `FOOTBALLDATA_TOKEN` | secret | Token gratuito de football-data.org (si usas `footballdata`) |
| `SYNC_SECRET` | secret | Protege el endpoint `/api/sync` (genera uno con `openssl rand -hex 24`) |
| `API_FOOTBALL_KEY` | secret | Solo si usas `apifootball` (⚠️ el plan gratis NO tiene 2026) |

## 🔄 Cambiar la fuente de datos

La fuente es intercambiable con **una variable**. El despacho vive en `src/lib/server/sync.ts`
(función `obtenerPartidos`); cada fuente es un archivo aparte que devuelve `Partido[]`
(`openfootball.ts`, `footballdata.ts`, `apifootball.ts`).

**Pasos para cambiar (ej. a `footballdata`):**

1. Edita `FUENTE_DATOS` en **ambos**: `wrangler.jsonc` y `worker-cron/wrangler.jsonc`.
2. Si la fuente necesita token/clave, ponlo como secret en **la app y el cron**:
   ```bash
   echo "TU_TOKEN" | npx wrangler secret put FOOTBALLDATA_TOKEN
   echo "TU_TOKEN" | npx wrangler secret put FOOTBALLDATA_TOKEN --config worker-cron/wrangler.jsonc
   ```
3. Redespliega ambos:
   ```bash
   npx wrangler deploy
   npx wrangler deploy --config worker-cron/wrangler.jsonc
   ```
4. Los IDs de partido llevan prefijo por fuente (`of_`, `fd_`, el fixture id de API-Football).
   Al cambiar de fuente, borra los partidos de la fuente anterior y re-sincroniza:
   ```bash
   npx wrangler d1 execute quiniela-db --remote --command "DELETE FROM partidos WHERE id LIKE 'of_%';"
   curl -X POST https://TU-APP.workers.dev/api/sync -H "authorization: Bearer TU_SYNC_SECRET"
   ```

> **Añadir una fuente nueva:** crea `src/lib/server/<fuente>.ts` que exporte una función
> devolviendo `Partido[]`, y añade un `case` en `obtenerPartidos()` de `sync.ts`. Nada más cambia.

**Modo "solo por diversión" (apto AdSense):** pon `MODO_DIVERSION: "true"` en `wrangler.jsonc`
y redespliega. Oculta todo lo de dinero (monto, bote, pagos) en toda la app.

## 🧪 Tests

```bash
npm test        # motor de puntos (Vitest)
npm run check   # type-check
```

## 📄 Licencia

MIT
