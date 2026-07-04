// Traducción de nombres de selección (inglés de API-Football → español) + bandera emoji.
// Si un equipo no está en la tabla, se usa el nombre de la API y una bandera genérica.

type Info = { nombre: string; bandera: string };

const TABLA: Record<string, Info> = {
	Argentina: { nombre: 'Argentina', bandera: '🇦🇷' },
	Australia: { nombre: 'Australia', bandera: '🇦🇺' },
	Belgium: { nombre: 'Bélgica', bandera: '🇧🇪' },
	Brazil: { nombre: 'Brasil', bandera: '🇧🇷' },
	Cameroon: { nombre: 'Camerún', bandera: '🇨🇲' },
	Canada: { nombre: 'Canadá', bandera: '🇨🇦' },
	Colombia: { nombre: 'Colombia', bandera: '🇨🇴' },
	'Costa Rica': { nombre: 'Costa Rica', bandera: '🇨🇷' },
	Croatia: { nombre: 'Croacia', bandera: '🇭🇷' },
	Denmark: { nombre: 'Dinamarca', bandera: '🇩🇰' },
	Ecuador: { nombre: 'Ecuador', bandera: '🇪🇨' },
	Egypt: { nombre: 'Egipto', bandera: '🇪🇬' },
	England: { nombre: 'Inglaterra', bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
	France: { nombre: 'Francia', bandera: '🇫🇷' },
	Germany: { nombre: 'Alemania', bandera: '🇩🇪' },
	Ghana: { nombre: 'Ghana', bandera: '🇬🇭' },
	Iran: { nombre: 'Irán', bandera: '🇮🇷' },
	Italy: { nombre: 'Italia', bandera: '🇮🇹' },
	Japan: { nombre: 'Japón', bandera: '🇯🇵' },
	'South Korea': { nombre: 'Corea del Sur', bandera: '🇰🇷' },
	'Korea Republic': { nombre: 'Corea del Sur', bandera: '🇰🇷' },
	Mexico: { nombre: 'México', bandera: '🇲🇽' },
	Morocco: { nombre: 'Marruecos', bandera: '🇲🇦' },
	Netherlands: { nombre: 'Países Bajos', bandera: '🇳🇱' },
	Nigeria: { nombre: 'Nigeria', bandera: '🇳🇬' },
	Paraguay: { nombre: 'Paraguay', bandera: '🇵🇾' },
	Peru: { nombre: 'Perú', bandera: '🇵🇪' },
	Poland: { nombre: 'Polonia', bandera: '🇵🇱' },
	Portugal: { nombre: 'Portugal', bandera: '🇵🇹' },
	Qatar: { nombre: 'Catar', bandera: '🇶🇦' },
	'Saudi Arabia': { nombre: 'Arabia Saudita', bandera: '🇸🇦' },
	Senegal: { nombre: 'Senegal', bandera: '🇸🇳' },
	Serbia: { nombre: 'Serbia', bandera: '🇷🇸' },
	Spain: { nombre: 'España', bandera: '🇪🇸' },
	Switzerland: { nombre: 'Suiza', bandera: '🇨🇭' },
	Tunisia: { nombre: 'Túnez', bandera: '🇹🇳' },
	'United States': { nombre: 'Estados Unidos', bandera: '🇺🇸' },
	'USA': { nombre: 'Estados Unidos', bandera: '🇺🇸' },
	Uruguay: { nombre: 'Uruguay', bandera: '🇺🇾' },
	Wales: { nombre: 'Gales', bandera: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
};

export function traducirEquipo(nombreEn: string): Info {
	return TABLA[nombreEn] ?? { nombre: nombreEn, bandera: '🏳️' };
}

// Traducción de la ronda (league.round de API-Football) al español.
export function traducirRonda(round: string): string {
	const r = round.toLowerCase();
	if (r.includes('final') && !r.includes('semi') && !r.includes('quarter') && !r.includes('16'))
		return 'Final';
	if (r.includes('semi')) return 'Semifinal';
	if (r.includes('quarter')) return 'Cuartos de Final';
	if (r.includes('16')) return 'Octavos de Final';
	if (r.includes('3rd place') || r.includes('third')) return 'Tercer Puesto';
	const grupo = round.match(/Group\s+([A-L])/i);
	if (grupo) {
		const jornada = round.match(/-\s*(\d+)/);
		return `Fase de Grupos · Grupo ${grupo[1].toUpperCase()}${jornada ? ` · J${jornada[1]}` : ''}`;
	}
	return round;
}
