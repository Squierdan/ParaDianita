# ParaDianita

Sitio romantico estatico listo para desplegar en GitHub Pages.

## Estructura del proyecto

```text
.
|-- index.html
|-- CNAME
|-- .nojekyll
`-- music/
    |-- library.json
    `-- *.flac
```

## Despliegue en GitHub Pages

1. Sube el repositorio a la rama `main`.
2. Ve a `Settings -> Pages`.
3. En `Build and deployment` selecciona:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` y carpeta `/ (root)`
4. Guarda y espera 1-3 minutos.

Con `CNAME` en la raiz, GitHub Pages mantiene el dominio personalizado.

## Musica

- Guarda canciones en `music/` como `.flac`.
- Manten `music/library.json` actualizado para produccion.
- Recomendado: cada archivo menor a 100 MB.

Ejemplo de `music/library.json`:

```json
[
  { "src": "music/Impacto.flac", "title": "Impacto", "artist": "Artista desconocido" }
]
```

## Datos locales (fotos, recuerdos y frases)

- El contenido se guarda en `localStorage` del navegador.
- Usa los botones del footer:
  - `Exportar respaldo`
  - `Importar respaldo`

## Cache y versionado recomendado

Para forzar que los clientes carguen la ultima version:

1. Actualiza `APP_RELEASE` en `index.html`.
2. Haz commit y push.
3. Abre la URL del sitio normalmente; la app redirige a `?v=<APP_RELEASE>` automaticamente.

Esto reduce cache viejo y permite migraciones de datos entre releases.

## Mejoras aplicadas

- Sanitizacion de contenido dinamico del usuario.
- Manejo seguro de URLs externas para imagenes.
- Mejoras de responsividad para pantallas pequenas.
- Ajustes de repositorio (`.gitignore`, `.gitattributes`).
