# scripts/

Utilidades reproducibles del proyecto.

## Importar predicciones previas (quiniela en curso)

Para cargar las predicciones que los jugadores hicieron **antes** de usar la app
(fase de grupos, dieciseisavos, etc.). El motor de puntos las califica solo
contra los resultados reales que ya están en la base.

### 1. Llenar el archivo de datos

Copia la plantilla y llénala con lo que te pasen los jugadores:

```bash
cp scripts/predicciones-previas.ejemplo.json scripts/predicciones-previas.json
```

Formato de cada predicción:

| Campo | Obligatorio | Ejemplo | Notas |
|---|---|---|---|
| `local` / `visita` | sí | `"Argentina"` / `"México"` | Nombres en español. **El orden no importa** — el script alinea el marcador al fixture real. |
| `marcador` | sí | `"2-1"` | Goles local-visita según como lo escribiste. |
| `momento` | recomendado | `"1T"` | Cuándo cayó el 1er gol: `1T`, `2T`, `1TE`, `2TE`. |
| `pasa` | solo eliminatorias | `"Inglaterra"` | Equipo que el jugador cree que avanza (solo si predijo empate en eliminatoria). |
| `ronda` | opcional | `"Octavos"` | Solo para desambiguar si un par de equipos se enfrenta más de una vez. |

`predicciones-previas.json` está en `.gitignore` (datos de jugadores, repo público).

### 2. Dry-run (no toca nada)

Valida los nombres, alinea marcadores, resuelve desempates y escribe el SQL a
revisar, **sin** modificar la base:

```bash
node scripts/importar-predicciones.mjs
```

Si hay algún error (equipo mal escrito, momento inválido...) lo lista y no carga nada.

### 3. Aplicar

Cuando el dry-run se vea bien:

```bash
node scripts/importar-predicciones.mjs --aplicar
```

Reusa los participantes que ya existen (por nombre) y crea los que falten.
Es **idempotente**: puedes re-correrlo y actualiza en vez de duplicar.

### 4. Puntuar

Dispara el sync forzado para calcular los puntos de los partidos ya finalizados:

```bash
curl -s -X POST "https://quiniela-mundial-2026.3qbic.workers.dev/api/sync?force=1" \
  -H "Authorization: Bearer <SYNC_SECRET>"
```

(El cron también los puntuará solo la próxima vez que corra dentro de la ventana.)
