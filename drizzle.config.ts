import { defineConfig } from 'drizzle-kit';

// Genera migraciones SQL a ./drizzle. Se aplican a D1 con:
//   wrangler d1 migrations apply quiniela-db --local   (o --remote)
export default defineConfig({
	dialect: 'sqlite',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle'
});
