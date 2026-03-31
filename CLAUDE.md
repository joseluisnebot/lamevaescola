# Proyecto: lamevaescola.com

Plataforma educativa enfocada en acompañamiento infantil. Proyecto de la mujer de Jose Luis (maestra).

## Stack
- HTML estático en Cloudflare Pages
- Idioma: català

## Deploy
```bash
cd /root/lamevaescola
export CLOUDFLARE_API_TOKEN=KbzsvBydROCvDbDtOab3dJHV_6w5REZhPnJkheix
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
