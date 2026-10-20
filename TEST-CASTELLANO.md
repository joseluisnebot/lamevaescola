# Test: ¿hay demanda en castellano? — abierto el 20/10/2026

## Por qué

Search Console, últimos 3 meses (19/07 → 18/10/2026), propiedad `lamevaescola.com`:

| Tipo de página | Clics | Impresiones | CTR |
|---|---|---|---|
| Herramientas | 25 | 159 | **15,72%** |
| Contenido / normativa | 7 | 1.377 | **0,51%** |
| Home | 47 | 288 | 16,32% |
| **TOTAL** | **77** | **1.767** | 4,36% |

El sitio no tiene un problema de SEO: tiene un problema de demanda. Estas páginas
están en el **top 5** de Google y reciben casi cero impresiones:

| Página | Posición media | Impresiones en 90 días | CTR |
|---|---|---|---|
| `/prompts` | 1,9 | 10 | 30,0% |
| `/bingo` | 3,9 | 19 | 36,8% |
| `/ruleta` | 4,8 | 4 | 25,0% |
| `/grups` | 4,5 | 32 | 12,5% |
| `/horari` | 6,0 | 48 | 18,8% |

Estar en posición 2 y recibir diez impresiones en tres meses solo significa una
cosa: la búsqueda no existe en catalán. No es que Google no nos enseñe — nos
enseña de los primeros.

En cambio, el contenido normativo acumula visibilidad y no convierte: `/decret-175-2022`
tiene **630 impresiones en posición 9,9 y un solo clic** (0,16%). Ahí se compite
contra gencat.cat y el DOGC por un PDF que publican ellos. No se puede ganar.

**Hipótesis a probar:** las herramientas funcionan, el techo es el idioma. El mercado
docente catalán ronda los 80.000 profesores; el castellano supera los 700.000 solo en
España. Y ya llegan búsquedas en castellano a un sitio íntegramente en catalán
("cuando es carnaval en los colegios", "vacaciones escolares semana santa",
"escala notas", "bien que nota es").

## Qué se ha hecho

Las **cinco herramientas que mejor convierten**, traducidas y adaptadas, en `/es/`:

| Nueva | Original | Palabra clave objetivo |
|---|---|---|
| `/es/ruleta` | `/ruleta` | ruleta de nombres, elegir alumno al azar |
| `/es/grupos` | `/grups` | generador de grupos aleatorios |
| `/es/bingo` | `/bingo` | generador de bingo para imprimir |
| `/es/horario` | `/horari` | horario semanal de clase para imprimir |
| `/es/prompts` | `/prompts` | prompts de IA para profesores |
| `/es/` | `/` | herramientas gratis para profesores |

Decisiones tomadas:

- **Va en `/es/` del mismo dominio, no en un dominio nuevo.** Un dominio recién
  registrado tarda meses en rankear: a las seis semanas no habría señal, habría ruido.
  `lamevaescola.com` ya tiene autoridad e indexa rápido. Si el test sale bien, ENTONCES
  se monta el dominio propio en castellano y se migra.
- **`hreflang` recíproco** entre cada par ca↔es (en `<head>` de las diez páginas) más
  un enlace "Versión en español" en el pie de las catalanas. Sin reciprocidad Google
  ignora la relación y puede tratarlas como duplicados.
  ⚠️ `grups.html` no tiene `<footer>`, así que ahí solo está el `hreflang` del head.
- **Sin normativa autonómica.** Se habla de LOMLOE (estatal) y nunca del Decret
  175/2022, que es solo de Cataluña.
- **FAQ honestas.** Las catalanas prometen cosas que la herramienta no hace: que
  exporta PDF (es el diálogo de imprimir del navegador), que guarda la lista de
  alumnos (`/grups` y `/ruleta` NO la guardan), que se pueden excluir alumnos
  marcándolos (no existe esa opción), que se pueden tener varias listas por clase
  (no existe). En castellano se dice lo que hay. **Pendiente: corregir también las
  catalanas.**
- **`/es/prompts` no lleva muro de suscripción.** La versión catalana enseña 5 prompts
  y pide el correo para los otros 10, pero esos 10 no existen en castellano y la
  newsletter está en catalán. En su lugar hay **10 prompts completos y gratis**.

## Cómo medir — a partir del 01/12/2026

Hacen falta unas **seis semanas** desde el 20/10: Google tiene que descubrir,
indexar y empezar a posicionar. Antes de diciembre, cualquier número es ruido.

Jose Luis exporta el CSV de Search Console de `lamevaescola.com` a `/root/inbox/`
con rango **personalizado del 20/10/2026 a la fecha** y se analiza con:

```bash
python3 /root/lamevaescola/medir-test-castellano.py
```

El script separa las páginas `/es/` del resto y compara.

### Qué cuenta como éxito

El test NO va de clics (seis semanas es poco para acumular clics). Va de
**impresiones**, que es lo que mide si existe demanda:

| Resultado | Impresiones `/es/` en 6 semanas | Lectura |
|---|---|---|
| 🟢 Claro | **> 1.500** | Hay mercado. Montar dominio propio en castellano y migrar. |
| 🟡 Dudoso | 400 – 1.500 | Hay algo. Traducir el resto de herramientas y volver a medir en enero. |
| 🔴 No | **< 400** | La hipótesis era falsa. El problema no es el idioma. Borrar `/es/`. |

La referencia: las herramientas en catalán hicieron **159 impresiones en 90 días**.
Si las mismas cinco en castellano pasan de 1.500 en 42 días, el mercado es ~20×
mayor y la decisión es obvia.

### Vigilar también

- Que el CTR de `/es/` se parezca al catalán (15%+). Si llegan impresiones pero
  nadie entra, el problema es el título, no el idioma.
- Que las páginas catalanas **no pierdan** clics. Si los pierden, el `hreflang`
  está mal aplicado y Google está sustituyendo la catalana por la castellana en
  búsquedas en catalán.

## Cómo deshacerlo

```bash
cd /root/lamevaescola
rm -rf es/
# quitar del sitemap.xml el bloque marcado "TEST en castellano"
# quitar de _redirects el bloque "Versión en castellano"
# quitar las 2 líneas rel="alternate" del <head> de bingo/horari/grups/ruleta/prompts.html
# quitar el enlace "Versión en español" del pie de bingo/horari/ruleta/prompts.html
bash deploy  # o el comando de wrangler de CLAUDE.md
```
