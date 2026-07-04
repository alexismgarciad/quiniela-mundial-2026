import { describe, it, expect } from 'vitest';
import { calcularPuntos, esMarcadorExacto } from './scoring';
import { CONFIG_PUNTOS_DEFAULT as C } from './types';

const p = (local: number, visita: number) => ({ local, visita });

describe('calcularPuntos (config por defecto, máx 7)', () => {
	it('marcador exacto suma todo: resultado+exacto+total+diferencia = 7', () => {
		expect(calcularPuntos(p(2, 1), p(2, 1), C)).toBe(7);
	});

	it('empate exacto también suma 7', () => {
		expect(calcularPuntos(p(1, 1), p(1, 1), C)).toBe(7);
	});

	it('predijo 2-1 y quedó 3-1: solo acierta resultado (+3) = 3', () => {
		// diferencia NO coincide: 2-1 → +1, pero 3-1 → +2
		expect(calcularPuntos(p(2, 1), p(3, 1), C)).toBe(3);
	});

	it('predijo 2-1 y quedó 3-2: resultado (+3) + diferencia (+1) = 4', () => {
		// ambos con diferencia +1, pero marcador y total distintos
		expect(calcularPuntos(p(2, 1), p(3, 2), C)).toBe(4);
	});

	it('acierta resultado y total de goles pero no exacto ni diferencia', () => {
		// predijo 3-0 (dif +3, total 3), quedó 2-1 (dif +1, total 3): resultado(+3) + total(+1) = 4
		expect(calcularPuntos(p(3, 0), p(2, 1), C)).toBe(4);
	});

	it('falla el resultado pero acierta total de goles: solo +1', () => {
		// predijo 2-1 (local gana), quedó 1-2 (visita gana): total 3==3 → +1
		expect(calcularPuntos(p(2, 1), p(1, 2), C)).toBe(1);
	});

	it('falla todo: 0 puntos', () => {
		expect(calcularPuntos(p(0, 0), p(3, 1), C)).toBe(0);
	});

	it('acierta empate como resultado pero marcador distinto: resultado(+3) + total? + dif(+1 siempre en empates)', () => {
		// predijo 0-0 (empate, dif 0, total 0), quedó 2-2 (empate, dif 0, total 4)
		// resultado(+3) + diferencia(+1) = 4
		expect(calcularPuntos(p(0, 0), p(2, 2), C)).toBe(4);
	});
});

describe('idempotencia', () => {
	it('llamar dos veces con los mismos datos da el mismo resultado', () => {
		const a = calcularPuntos(p(2, 1), p(3, 1), C);
		const b = calcularPuntos(p(2, 1), p(3, 1), C);
		expect(a).toBe(b);
	});
});

describe('esMarcadorExacto', () => {
	it('true cuando coincide', () => {
		expect(esMarcadorExacto(p(2, 1), p(2, 1))).toBe(true);
	});
	it('false cuando no', () => {
		expect(esMarcadorExacto(p(2, 1), p(1, 1))).toBe(false);
	});
});
