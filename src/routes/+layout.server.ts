import type { LayoutServerLoad } from './$types';

// Modo de sitio: "diversión" oculta TODO lo relacionado a dinero (apto AdSense).
// Se activa poniendo la var MODO_DIVERSION="true" en wrangler.jsonc.
export const load: LayoutServerLoad = ({ platform }) => {
	return {
		modoDiversion: platform?.env?.MODO_DIVERSION === 'true'
	};
};
