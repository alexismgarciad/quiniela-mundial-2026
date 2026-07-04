// Traducción de nombres de selección (inglés → español) + bandera emoji.
// Cubre las 48 selecciones del Mundial 2026. Placeholders de bracket → "Por definir".

type Info = { nombre: string; bandera: string };

const TABLA: Record<string, Info> = {
	Algeria: { nombre: 'Argelia', bandera: '🇩🇿' },
	Argentina: { nombre: 'Argentina', bandera: '🇦🇷' },
	Australia: { nombre: 'Australia', bandera: '🇦🇺' },
	Austria: { nombre: 'Austria', bandera: '🇦🇹' },
	Belgium: { nombre: 'Bélgica', bandera: '🇧🇪' },
	'Bosnia & Herzegovina': { nombre: 'Bosnia y Herzegovina', bandera: '🇧🇦' },
	Brazil: { nombre: 'Brasil', bandera: '🇧🇷' },
	Canada: { nombre: 'Canadá', bandera: '🇨🇦' },
	'Cape Verde': { nombre: 'Cabo Verde', bandera: '🇨🇻' },
	Colombia: { nombre: 'Colombia', bandera: '🇨🇴' },
	'Costa Rica': { nombre: 'Costa Rica', bandera: '🇨🇷' },
	Croatia: { nombre: 'Croacia', bandera: '🇭🇷' },
	'Curaçao': { nombre: 'Curazao', bandera: '🇨🇼' },
	'Czech Republic': { nombre: 'República Checa', bandera: '🇨🇿' },
	'DR Congo': { nombre: 'RD del Congo', bandera: '🇨🇩' },
	Denmark: { nombre: 'Dinamarca', bandera: '🇩🇰' },
	Ecuador: { nombre: 'Ecuador', bandera: '🇪🇨' },
	Egypt: { nombre: 'Egipto', bandera: '🇪🇬' },
	England: { nombre: 'Inglaterra', bandera: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
	France: { nombre: 'Francia', bandera: '🇫🇷' },
	Germany: { nombre: 'Alemania', bandera: '🇩🇪' },
	Ghana: { nombre: 'Ghana', bandera: '🇬🇭' },
	Haiti: { nombre: 'Haití', bandera: '🇭🇹' },
	Iran: { nombre: 'Irán', bandera: '🇮🇷' },
	Iraq: { nombre: 'Irak', bandera: '🇮🇶' },
	'Ivory Coast': { nombre: 'Costa de Marfil', bandera: '🇨🇮' },
	Italy: { nombre: 'Italia', bandera: '🇮🇹' },
	Japan: { nombre: 'Japón', bandera: '🇯🇵' },
	Jordan: { nombre: 'Jordania', bandera: '🇯🇴' },
	'South Korea': { nombre: 'Corea del Sur', bandera: '🇰🇷' },
	'Korea Republic': { nombre: 'Corea del Sur', bandera: '🇰🇷' },
	Mexico: { nombre: 'México', bandera: '🇲🇽' },
	Morocco: { nombre: 'Marruecos', bandera: '🇲🇦' },
	Netherlands: { nombre: 'Países Bajos', bandera: '🇳🇱' },
	'New Zealand': { nombre: 'Nueva Zelanda', bandera: '🇳🇿' },
	Nigeria: { nombre: 'Nigeria', bandera: '🇳🇬' },
	Norway: { nombre: 'Noruega', bandera: '🇳🇴' },
	Panama: { nombre: 'Panamá', bandera: '🇵🇦' },
	Paraguay: { nombre: 'Paraguay', bandera: '🇵🇾' },
	Peru: { nombre: 'Perú', bandera: '🇵🇪' },
	Poland: { nombre: 'Polonia', bandera: '🇵🇱' },
	Portugal: { nombre: 'Portugal', bandera: '🇵🇹' },
	Qatar: { nombre: 'Catar', bandera: '🇶🇦' },
	'Saudi Arabia': { nombre: 'Arabia Saudita', bandera: '🇸🇦' },
	Scotland: { nombre: 'Escocia', bandera: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
	Senegal: { nombre: 'Senegal', bandera: '🇸🇳' },
	Serbia: { nombre: 'Serbia', bandera: '🇷🇸' },
	'South Africa': { nombre: 'Sudáfrica', bandera: '🇿🇦' },
	Spain: { nombre: 'España', bandera: '🇪🇸' },
	Sweden: { nombre: 'Suecia', bandera: '🇸🇪' },
	Switzerland: { nombre: 'Suiza', bandera: '🇨🇭' },
	Tunisia: { nombre: 'Túnez', bandera: '🇹🇳' },
	Turkey: { nombre: 'Turquía', bandera: '🇹🇷' },
	'United States': { nombre: 'Estados Unidos', bandera: '🇺🇸' },
	USA: { nombre: 'Estados Unidos', bandera: '🇺🇸' },
	Uruguay: { nombre: 'Uruguay', bandera: '🇺🇾' },
	Uzbekistan: { nombre: 'Uzbekistán', bandera: '🇺🇿' },
	Wales: { nombre: 'Gales', bandera: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' }
};

/** ¿Es un placeholder de bracket (W89, L101, etc.) en vez de una selección real? */
function esPlaceholder(nombre: string): boolean {
	return /^[WL]\d+$/.test(nombre);
}

export function traducirEquipo(nombreEn: string): Info {
	if (esPlaceholder(nombreEn)) return { nombre: 'Por definir', bandera: '⏳' };
	return TABLA[nombreEn] ?? { nombre: nombreEn, bandera: '🏳️' };
}

// ---- Rondas de API-Football (formato "Group A - 1", "Round of 16"...) ----
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

// ---- Rondas de openfootball ("Matchday N" + group, "Round of 32"...) ----
export function traducirRondaOpenfootball(round: string, group?: string): string {
	const r = round.toLowerCase();
	if (r.startsWith('matchday')) {
		return group ? `Fase de Grupos · ${traducirGrupo(group)}` : 'Fase de Grupos';
	}
	if (r.includes('third place') || r.includes('match for third')) return 'Tercer Puesto';
	if (r === 'final') return 'Final';
	if (r.includes('semi')) return 'Semifinal';
	if (r.includes('quarter')) return 'Cuartos de Final';
	if (r.includes('round of 16')) return 'Octavos de Final';
	if (r.includes('round of 32')) return 'Dieciseisavos de Final';
	return round;
}

function traducirGrupo(group: string): string {
	const m = group.match(/([A-L])/i);
	return m ? `Grupo ${m[1].toUpperCase()}` : group;
}
