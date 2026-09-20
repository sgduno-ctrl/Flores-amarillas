# 🌼 Día de las flores amarillas

Una página hecha con HTML, CSS y JavaScript puro (sin librerías) para el 21 de marzo.
Sirve para **crear una dedicatoria** de flores amarillas y regalarla con un enlace.

- **index.html** — compones la dedicatoria (nombre, mensaje y flor) y obtienes un enlace.
- **dedicatoria.html** — lo que recibe la otra persona: **solo la dedicatoria**, que se abre
  como un regalo entre flores, con amanecer, polen y pétalos. No lleva las demás secciones.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Página para crear la dedicatoria, con vista previa en vivo |
| `dedicatoria.html` | El regalo que se comparte (solo la dedicatoria) |
| `style.css` | Colores, tipografías, diseño y animaciones |
| `flores.js` | Motor común: dibuja las flores, el prado y el polen |
| `index.js` | Lógica de la página para crear la dedicatoria |
| `dedicatoria.js` | Lógica del regalo: abrir y mostrar la carta |

## Cómo verla en tu computadora

Descarga los seis archivos en una misma carpeta y abre `index.html` con doble clic.

## Cómo se comparte una dedicatoria

En `index.html` se escribe el mensaje y se pulsa **Crear el enlace**. Ese enlace apunta a
`dedicatoria.html` con el mensaje dentro. Quien lo abra verá solo la dedicatoria.
Crea el enlace desde la versión publicada (GitHub Pages), no desde el archivo local.

## Cómo personalizarla

- **Colores:** al inicio de `style.css`, en `:root`.
- **Textos de la portada:** en `index.html`.
- **Flores del prado:** función `sembrarPrado` en `flores.js`.

## Publicación

Gratis con GitHub Pages: *Settings → Pages → Deploy from a branch → main / (root)*.
