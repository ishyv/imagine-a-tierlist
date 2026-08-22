# Taste Profile: metodología de Judge Profiles

## Propósito

Un Taste Profile describe patrones observables en una tier list terminada. No
intenta diagnosticar la personalidad del usuario ni convierte una preferencia
en una verdad psicológica. La investigación metodológica se incorpora aquí y
en los perfiles versionados del producto; un análisis individual solo aplica
esas reglas a la evidencia disponible.

La unidad de evidencia es la asignación de un ítem a un tier. El orden entre
ítems dentro del mismo tier no tiene significado y se ignora. Los ítems del
holding buffer no forman parte del análisis principal, aunque se informa su
cantidad.

## Capas de afirmación

Cada salida debe separar cuatro niveles:

1. **Observación:** qué ítems aparecen y cómo se distribuyen por la jerarquía
   de tiers.
2. **Inferencia:** un patrón comparativo que se desprende de varias
   observaciones y cita ítems concretos.
3. **Hipótesis:** una lectura tentativa sobre el criterio estético o funcional
   que podría explicar el patrón.
4. **Incertidumbre:** qué metadata falta, qué entidades son ambiguas y qué
   alternativas siguen siendo plausibles.

Una inferencia necesita más de un ítem salvo que se marque explícitamente como
una señal débil. Una hipótesis nunca puede presentarse como rasgo estable,
diagnóstico clínico, tipo de personalidad, intención inconsciente o predicción
de conducta.

## Reglas comunes a los cinco perfiles

- La jerarquía de tiers es evidencia ordinal; no se inventa una distancia
  numérica entre tiers.
- Una dimensión solo se publica si tiene evidencia concreta y al menos una
  explicación legible.
- Toda dimensión, observación y contraste debe citar IDs de ítems de la lista.
- Metadata externa es una capa auxiliar y no reemplaza el nombre, la imagen,
  el tier ni el contexto originales del board.
- Las coincidencias ambiguas o los proveedores ausentes reducen la confianza y
  aparecen en limitaciones.
- Las contradicciones se muestran: no se promedian silenciosamente señales que
  apunten en direcciones opuestas.
- El perfil general sirve para listas coherentes que no encajan en una
  taxonomía especializada; no rescata una mezcla incompatible de entidades.

## Perfiles iniciales

### Videojuegos (`games`)

Compara bucles de juego, agencia, ritmo, dominio, exploración, construcción de
mundo y relación entre sistema y recompensa. Puede permitir dimensiones
emergentes como tolerancia a la fricción o preferencia por descubrimiento,
siempre que estén respaldadas por varios juegos y no se expresen como rasgos
psicológicos fijos.

### Cine (`movies`)

Compara tono, puesta en escena, estructura narrativa, actuación, ritmo,
ambición formal y resonancia temática cuando la metadata lo permite. No
confunde género con calidad ni atribuye una película favorita a una identidad
del usuario.

### Música (`music`)

Compara textura, voz, composición, energía, producción, repetición, escena y
relación con la emoción descrita en la obra. Género, década o popularidad son
contexto, no explicaciones suficientes del gusto.

### Libros (`books`)

Compara voz, ideas, construcción de mundo, densidad, estructura, personajes y
ritmo de lectura según la metadata disponible. No deduce nivel educativo,
ideología o salud mental a partir de títulos o géneros.

### General (`general`)

Usa solo dimensiones cross-domain que sigan siendo comparables: intensidad,
complejidad, accesibilidad, novedad, intimidad o escala, por ejemplo. Si la
lista mezcla entidades que no pueden compararse con coherencia, se rechaza en
vez de producir una lectura decorativa.

## Base de investigación

La separación entre observación, inferencia y limitación sigue una práctica de
medición prudente: las preferencias declaradas pueden relacionarse con rasgos
amplios, pero las correlaciones poblacionales no autorizan diagnósticos
individuales. La literatura revisada para esta primera versión incluye:

- trabajos sobre personalidad y preferencias musicales en [Frontiers in
  Psychology (2020)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01307/full)
  y [Frontiers in Psychology (2013)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00608/full);
- estudios sobre estructura de preferencias musicales y diferencias
  individuales en [este artículo indexado en
  PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC4675523/);
- investigación sobre preferencias de entretenimiento y personalidad en
  [este artículo indexado en PubMed Central](https://pmc.ncbi.nlm.nih.gov/articles/PMC3559433/).

Estas fuentes informan qué dimensiones pueden ser preguntas razonables; no se
usan para afirmar que una tier list revele una personalidad latente. Las
versiones de los perfiles son contratos de producto: si cambia una regla,
sube `version` y los snapshots nuevos registran esa versión.

## Fuentes de metadata

Los adaptadores normalizan respuestas externas antes de construir el prompt:

- IGDB para videojuegos, mediante autenticación de Twitch cuando está
  configurada.
- TMDB para cine.
- MusicBrainz para música, respetando `User-Agent` y su límite de frecuencia.
- Google Books para libros.
- Wikipedia/Wikidata y búsqueda existente como fallback visible.

Las credenciales son opcionales. Una respuesta parcial nunca se presenta como
certeza completa: el informe de enriquecimiento conserva proveedores,
coincidencias y fallos para que el usuario pueda auditar la lectura.
