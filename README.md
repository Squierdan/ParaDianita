# ParaDianita

Sitio estático romántico listo para desplegar en GitHub Pages.

## Publicación

1. Sube el contenido de este repositorio a la rama `main`.
2. En GitHub: `Settings` -> `Pages`.
3. En `Build and deployment`, selecciona:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` y carpeta `/ (root)`
4. Guarda y espera 1-3 minutos.

## Música

- Archivos en `music/` (formato `.flac`, menos de 100 MB por archivo).
- Lista base en `music/library.json`.
- El player también intenta descubrir automáticamente los `.flac`.

## Respaldo de datos (fotos/recuerdos/frases)

- Usa los botones del footer:
  - `Exportar respaldo`
  - `Importar respaldo`
- Esto evita pérdida de datos al cambiar de navegador/dispositivo.

## Nota de privacidad

El sitio usa `localStorage` para guardar datos del usuario final (fotos, recuerdos y frases) en su navegador.
