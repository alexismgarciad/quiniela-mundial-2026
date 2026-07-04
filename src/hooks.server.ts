import type { Handle } from '@sveltejs/kit';

// Endurecimiento: nunca enviar la ruta/query a orígenes externos (evita filtrar
// el token de recuperación de admin si estuviera en la URL). También cabeceras
// básicas de seguridad.
export const handle: Handle = async ({ event, resolve }) => {
	const res = await resolve(event);
	res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	res.headers.set('X-Content-Type-Options', 'nosniff');
	res.headers.set('X-Frame-Options', 'SAMEORIGIN');
	return res;
};
