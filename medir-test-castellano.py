#!/usr/bin/env python3
"""
Mide el test de las herramientas en castellano (/es/) de lamevaescola.com.

Lee el export de Search Console más reciente de /root/inbox/ y separa las
páginas /es/ del resto. Ver TEST-CASTELLANO.md para el criterio de éxito.

Uso:  python3 /root/lamevaescola/medir-test-castellano.py [carpeta]
"""
import csv
import glob
import os
import re
import sys

INBOX = sys.argv[1] if len(sys.argv) > 1 else "/root/inbox"

# Línea base: las mismas cinco herramientas en catalán, 19/07 → 18/10/2026 (90 días).
BASE_CA = {"clics": 25, "impresiones": 159, "dias": 90}

# Umbrales de TEST-CASTELLANO.md, en impresiones de /es/ a las ~6 semanas.
UMBRAL_VERDE = 1500
UMBRAL_AMBAR = 400


def set_mas_reciente(carpeta):
    """Los exports vienen con prefijo de timestamp; coge el grupo más alto.

    Search Console exporta varios CSV con el mismo prefijo (Consultas, Páginas,
    Países...). Nos interesa el de Páginas, pero hay que asegurarse de coger el
    del MISMO export, no mezclar el de Páginas de un día con el de otro.
    """
    paginas = glob.glob(os.path.join(carpeta, "*Páginas.csv"))
    if not paginas:
        sys.exit(f"No encuentro ningún '*Páginas.csv' en {carpeta}")

    def ts(ruta):
        m = re.match(r"(\d+)_", os.path.basename(ruta))
        return int(m.group(1)) if m else 0

    elegido = max(paginas, key=ts)
    prefijo = elegido[: elegido.rindex("Páginas.csv")]
    return elegido, prefijo


def leer_filtros(prefijo):
    """Devuelve el rango de fechas que declara el export, si está."""
    ruta = prefijo + "Filtros.csv"
    if not os.path.exists(ruta):
        return "(sin fichero de filtros)"
    with open(ruta, encoding="utf-8-sig") as f:
        return " · ".join(f"{r[0]}: {r[1]}" for r in csv.reader(f) if len(r) == 2 and r[0] != "Filtrar")


def main():
    ruta, prefijo = set_mas_reciente(INBOX)
    print(f"Export: {os.path.basename(ruta)}")
    print(f"Rango declarado: {leer_filtros(prefijo)}\n")

    es = {"clics": 0, "impresiones": 0, "paginas": []}
    ca = {"clics": 0, "impresiones": 0}

    with open(ruta, encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            url = r["Páginas principales"]
            c, i = int(r["Clics"]), int(r["Impresiones"])
            pos = float(r["Posición"])
            if "/es/" in url:
                es["clics"] += c
                es["impresiones"] += i
                es["paginas"].append((url, c, i, pos))
            else:
                ca["clics"] += c
                ca["impresiones"] += i

    ctr = lambda c, i: (c / i * 100) if i else 0.0

    print("=" * 62)
    print(f"  CASTELLANO (/es/)  {es['clics']:>5} clics {es['impresiones']:>7} impr   CTR {ctr(es['clics'], es['impresiones']):6.2f}%")
    print(f"  CATALÁN (resto)    {ca['clics']:>5} clics {ca['impresiones']:>7} impr   CTR {ctr(ca['clics'], ca['impresiones']):6.2f}%")
    print("=" * 62)

    if es["paginas"]:
        print("\nDetalle de /es/:")
        for url, c, i, pos in sorted(es["paginas"], key=lambda x: -x[2]):
            corta = url.replace("https://lamevaescola.com", "")
            print(f"  {i:>6} impr {c:>4} clics  CTR {ctr(c, i):6.2f}%  pos {pos:5.1f}  {corta}")
    else:
        print("\n⚠️  Ninguna página /es/ aparece en el export.")
        print("    Si han pasado menos de 4 semanas desde el 20/10/2026, es normal:")
        print("    Google aún no las ha indexado. Si han pasado más de 6, comprobar")
        print("    en Search Console → Inspección de URLs que /es/ruleta esté indexada.")

    print("\n--- Veredicto ---")
    print(f"Referencia: las 5 herramientas en catalán hicieron "
          f"{BASE_CA['impresiones']} impresiones en {BASE_CA['dias']} días.")
    imp = es["impresiones"]
    if imp > UMBRAL_VERDE:
        print(f"🟢 {imp} impresiones (> {UMBRAL_VERDE}). HAY MERCADO.")
        print("   Siguiente paso: dominio propio en castellano y migrar las herramientas.")
    elif imp >= UMBRAL_AMBAR:
        print(f"🟡 {imp} impresiones (entre {UMBRAL_AMBAR} y {UMBRAL_VERDE}). Hay algo, no es concluyente.")
        print("   Siguiente paso: traducir el resto de herramientas y volver a medir en enero.")
    else:
        print(f"🔴 {imp} impresiones (< {UMBRAL_AMBAR}). La hipótesis del idioma no se sostiene.")
        print("   Siguiente paso: borrar /es/ (ver TEST-CASTELLANO.md) y buscar el problema en otro sitio.")

    if es["impresiones"] and ctr(es["clics"], es["impresiones"]) < 5:
        print("\n⚠️  Llegan impresiones pero el CTR es bajo: revisar títulos y descripciones")
        print("    de /es/ antes de descartar el idioma como hipótesis.")


if __name__ == "__main__":
    main()
