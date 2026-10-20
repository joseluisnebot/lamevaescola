# Proyecto: lamevaescola.com

Plataforma educativa enfocada en acompañamiento infantil. Proyecto de la mujer de Jose Luis (maestra).

## Stack
- HTML estático en Cloudflare Pages
- Idioma: català

## Deploy
```bash
cd /root/lamevaescola
# El token NO se guarda aquí: este repo es público y GitHub rechaza el push.
# Está en la memoria del agente (credentials.md, token maestro agente-ia-master-v2).
# El antiguo KbzsvByd… caducó el 20/10/2026 y daba "Invalid access token [code: 9109]".
export CLOUDFLARE_API_TOKEN=<token maestro de credentials.md>
export CLOUDFLARE_ACCOUNT_ID=0c4d9c91bb0f3a4c905545ecc158ec65
npx wrangler pages deploy . --project-name=lamevaescola --branch=main
```

## URLs
- Producción: https://lamevaescola.com
- Pages: https://lamevaescola.pages.dev

## Diseño actual
- Colores neutros, sin ruido visual
- Badge "Pròximament" + título + texto coming soon
- Sin formulario de momento

## GitHub
- Repo: joseluisnebot/lamevaescola
- Local CT: /root/lamevaescola/

## Pendiente
- Definir dirección del proyecto con la mujer de Jose Luis
- Contenido: filosofía educativa, recursos para familias, talleres
- Posible newsletter o blog
