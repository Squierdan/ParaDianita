# ParaDianita

Sitio estático romántico preparado para desplegarse en GitHub Pages.

## Estructura

```text
.
├─ index.html
├─ CNAME
├─ .nojekyll
└─ music/
   ├─ library.json
   └─ *.flac
```

## Despliegue en GitHub Pages

1. Sube el repositorio a GitHub (rama `main`).
2. Ve a `Settings` -> `Pages`.
3. En `Build and deployment` selecciona:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` y carpeta `/ (root)`
4. Guarda y espera 1-3 minutos.

Con `CNAME` configurado, GitHub Pages mantendrá el dominio personalizado.

## Música

- Guarda canciones en `music/` (formato `.flac`).
- Mantén `music/library.json` actualizado para producción.
- Recomendado: cada archivo `< 100 MB` para evitar problemas al subir al repositorio.

Ejemplo de `music/library.json`:

```json
[
  { "src": "music/Impacto.flac", "title": "Impacto", "artist": "Artista desconocido" }
]
```

## Datos locales (fotos, recuerdos y frases)

- Se guardan en `localStorage` del navegador del usuario.
- Usa los botones de pie de página:
  - `Exportar respaldo`
  - `Importar respaldo`

## Buenas prácticas aplicadas

- Limpieza de archivos de respaldo local y checkpoints.
- `.gitignore` reforzado para no subir archivos temporales/editor/logs.
- Proyecto listo para repositorio público con estructura mínima.
