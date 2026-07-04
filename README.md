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

```bash
npm install
cp .dev.vars.example .dev.vars   # rellena tus secretos
npm run db:migrate:local          # crea el D1 local
npm run dev                       # http://localhost:5173
curl -X POST localhost:5173/api/dev/seed   # (opcional) datos de ejemplo
```

## ☁️ Despliegue

```bash
npx wrangler login
npx wrangler d1 create quiniela-db          # copia el database_id a wrangler.jsonc
npm run db:migrate:remote
npx wrangler deploy                          # app
npx wrangler deploy --config worker-cron/wrangler.jsonc   # cron
npx wrangler secret put API_FOOTBALL_KEY
npx wrangler secret put SYNC_SECRET
```

## 🔑 Variables de entorno

| Variable | Dónde | Descripción |
|---|---|---|
| `API_FOOTBALL_KEY` | secret | Clave del proveedor de datos de fútbol |
| `SYNC_SECRET` | secret | Protege el endpoint `/api/sync` |
| `APIFOOTBALL_LEAGUE` / `APIFOOTBALL_SEASON` | vars | Liga y temporada a sincronizar |

## 🧪 Tests

```bash
npm test        # motor de puntos (Vitest)
npm run check   # type-check
```

## 📄 Licencia

MIT
