// Formato de fecha/hora en español panameño, 12h con AM/PM.

const TZ = 'America/Panama';

/** "sáb 4 jul, 2:00 p. m." */
export function formatoFecha(iso: string): string {
	return new Intl.DateTimeFormat('es-PA', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: TZ
	}).format(new Date(iso));
}

/** Solo la hora: "2:00 p. m." */
export function formatoHora(iso: string): string {
	return new Intl.DateTimeFormat('es-PA', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: TZ
	}).format(new Date(iso));
}

/** Cuenta regresiva legible hasta un ISO futuro. "en 2 h 15 min" / "en 30 min". */
export function tiempoRestante(iso: string, ahora: Date = new Date()): string {
	const ms = new Date(iso).getTime() - ahora.getTime();
	if (ms <= 0) return 'cerrado';
	const min = Math.floor(ms / 60_000);
	if (min < 60) return `en ${min} min`;
	const h = Math.floor(min / 60);
	const rem = min % 60;
	if (h < 24) return rem ? `en ${h} h ${rem} min` : `en ${h} h`;
	const d = Math.floor(h / 24);
	return `en ${d} d`;
}
