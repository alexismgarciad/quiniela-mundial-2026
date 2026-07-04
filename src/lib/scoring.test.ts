import { describe, it, expect } from 'vitest';
import { calcularPuntos, esMarcadorExacto, momentoDesdeMinuto } from './scoring';
import { CONFIG_PUNTOS_DEFAULT as C } from './types';

const g = (local: number, visita: number, extra = {}) => ({ local, visita, ...extra });

describe('calcularPuntos — base (3 exacto / 1 resultado / 0)', () => {
	it('marcador exacto = 3', () => {
		expect(calcularPuntos(g(2, 1), g(2, 1), C)).toBe(3);
	});
	it('mismo resultado sin marcador exacto = 1', () => {
		expect(calcularPuntos(g(2, 1), g(3, 1), C)).toBe(1);
	});
	it('resultado equivocado = 0', () => {
		expect(calcularPuntos(g(2, 1), g(1, 2), C)).toBe(0);
	});
	it('empate exacto = 3', () => {
		expect(calcularPuntos(g(1, 1), g(1, 1), C)).toBe(3);
	});
});

describe('calcularPuntos — momento del 1er gol (+1)', () => {
	it('acierta el momento suma +1', () => {
		expect(
			calcularPuntos(g(2, 1, { momentoPrimerGol: '1T' }), g(3, 1, { momentoPrimerGol: '1T' }), C)
		).toBe(2); // 1 (resultado) + 1 (momento)
	});
	it('falla el momento no suma', () => {
		expect(
			calcularPuntos(g(2, 1, { momentoPrimerGol: '2T' }), g(2, 1, { momentoPrimerGol: '1T' }), C)
		).toBe(3); // exacto 3, momento no
	});
});

describe('calcularPuntos — quién pasa (+1, solo en empates con avance)', () => {
	it('acierta quién pasa suma +1', () => {
		const pred = g(1, 1, { ganadorDesempate: 'local' });
		const real = g(1, 1, { avanza: 'local' });
		expect(calcularPuntos(pred, real, C)).toBe(4); // exacto 3 + quién pasa 1
	});
	it('no suma si no hubo avance (partido no empatado)', () => {
		const pred = g(1, 1, { ganadorDesempate: 'local' });
		const real = g(1, 1, { avanza: null });
		expect(calcularPuntos(pred, real, C)).toBe(3);
	});
	it('máximo posible = 5 (exacto + quién pasa + momento)', () => {
		const pred = g(1, 1, { ganadorDesempate: 'visita', momentoPrimerGol: '2T' });
		const real = g(1, 1, { avanza: 'visita', momentoPrimerGol: '2T' });
		expect(calcularPuntos(pred, real, C)).toBe(5);
	});
});

describe('momentoDesdeMinuto', () => {
	it('mapea los rangos correctamente', () => {
		expect(momentoDesdeMinuto(10)).toBe('1T');
		expect(momentoDesdeMinuto(45)).toBe('1T');
		expect(momentoDesdeMinuto(46)).toBe('2T');
		expect(momentoDesdeMinuto(90)).toBe('2T');
		expect(momentoDesdeMinuto(100)).toBe('1TE');
		expect(momentoDesdeMinuto(115)).toBe('2TE');
	});
});

describe('esMarcadorExacto', () => {
	it('true cuando coincide', () => {
		expect(esMarcadorExacto(g(2, 1), g(2, 1))).toBe(true);
	});
	it('false cuando no', () => {
		expect(esMarcadorExacto(g(2, 1), g(1, 1))).toBe(false);
	});
});
