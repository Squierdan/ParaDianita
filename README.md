# ParaDianita

Sitio romántico estático listo para desplegar en GitHub Pages.

## Estructura del proyecto

```text
.
|-- index.html                 # Estructura y contenido
|-- assets/
|   |-- css/styles.css         # Estilos (tokens de color, tipografía, modo día/noche)
|   |-- js/app.js              # Lógica: contador, galería, recuerdos, frases, carta, música
|   |-- img/                   # Ícono (SVG) y apple-touch-icon
|   `-- covers/                # Portadas de las canciones (320 px)
|-- music/
|   |-- library.json
|   `-- *.flac
|-- CNAME
`-- .nojekyll
```

## Despliegue en GitHub Pages

1. Sube el repositorio a la rama `main`.
2. Ve a `Settings -> Pages`.
3. En `Build and deployment` selecciona:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` y carpeta `/ (root)`
4. Guarda y espera 1-3 minutos.

Con `CNAME` en la raíz, GitHub Pages mantiene el dominio personalizado.

## Configuración

Al inicio de `assets/js/app.js` está el objeto `CONFIG`: fecha y hora de inicio, zona horaria, nombres, el texto de la carta y la firma.

## Música

- Guarda canciones en `music/` como `.flac` (recomendado: cada archivo menor a 100 MB).
- Mantén `music/library.json` actualizado. Las rutas se escriben desde la raíz del sitio.
- La portada es opcional; si la agregas, usa una imagen cuadrada pequeña en `assets/covers/`.

```json
[
  { "src": "music/Impacto.flac", "title": "Impacto", "artist": "Enjambre, Denise Gutiérrez", "album": "El Segundo Es Felino", "cover": "assets/covers/impacto.jpg" }
]
```

La música no arranca sola: se inicia con el botón “Poner nuestra música” o desde el reproductor.

## Datos locales (fotos, recuerdos y frases)

- Todo lo que se agrega, edita o elimina desde la página se guarda en `localStorage` del navegador.
- Las fotos pueden subirse desde el dispositivo (se reducen a 1280 px en JPEG) o enlazarse desde Google Drive.
- Eliminar o editar muestra un aviso con “Deshacer”.
- En el pie de página:
  - `Descargar respaldo`
  - `Cargar respaldo` (también se puede deshacer)

## Cache y versionado

Para forzar que los clientes carguen la última versión:

1. Cambia `<meta name="app-release">` en `index.html`.
2. Cambia también el `?v=` de los `<link>` y `<script>` de `assets/` en `index.html`.
3. Haz commit y push.

Al abrir la URL, la página redirige a `?v=<versión>` antes de pintarse. Esto reduce caché vieja y permite migraciones de datos entre versiones.

## Accesibilidad y uso

- Navegación completa con teclado, enlace “Saltar al contenido” y foco visible.
- Diálogos nativos (`<dialog>`) para el editor y el visor de fotos: `Esc` cierra, las flechas cambian de foto y en el teléfono se puede deslizar.
- Modo día/noche (respeta la preferencia del sistema y recuerda la elección).
- Respeta “reducir movimiento” del sistema.
- Sanitización de contenido del usuario y de URLs de imágenes.
