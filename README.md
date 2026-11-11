# Catálogo de cachimba

App web (PWA) para gestionar el catálogo de sabores desde el iPad y generar el PDF. Funciona sin conexión.

- Código: [`catalogo_ipad_pwa/`](catalogo_ipad_pwa/)
- Instrucciones de uso: [`catalogo_ipad_pwa/LEEME.txt`](catalogo_ipad_pwa/LEEME.txt)

## Publicación en GitHub Pages

Cada push a `main` publica la app automáticamente con el workflow `.github/workflows/pages.yml`.

Configuración (solo la primera vez): en GitHub, **Settings → Pages → Build and deployment → Source: GitHub Actions**.

La dirección será `https://<usuario>.github.io/catalogo-para-tabaco/`. Ábrela en Safari en el iPad y usa Compartir → «Añadir a pantalla de inicio».

Al publicar cambios, sube la versión de `CACHE` en `catalogo_ipad_pwa/sw.js` para que el iPad descargue los archivos nuevos.
