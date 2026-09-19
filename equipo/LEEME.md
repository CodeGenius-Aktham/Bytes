# Fotos del equipo

Aquí van las fotos de las personas de Bytes: los dos fundadores y los tres
del equipo. El nombre del archivo importa, porque es el que buscan las
páginas. Si un archivo falta, la web no se rompe ni muestra el icono de
imagen rota: en su lugar sale el monograma con las iniciales.

| Archivo             | Dónde sale                      |
| ------------------- | ------------------------------- |
| `fundador-1.webp`   | Fundadores, tarjeta izquierda   |
| `fundador-2.webp`   | Fundadores, tarjeta derecha     |
| `equipo-1.webp`     | Nuestro equipo, persona 01      |
| `equipo-2.webp`     | Nuestro equipo, persona 02      |
| `equipo-3.webp`     | Nuestro equipo, persona 03      |

## Cómo tienen que ser

Las cinco son **recortes sin fondo**: la persona sobre transparencia, nada
de blanco ni de gris. En Fundadores la figura sobresale por encima del
marco, y en Equipo se apoya en la base; las dos cosas dependen de que el
fondo esté realmente quitado.

- Proporción **3:4 vertical** (por ejemplo 900 × 1200 px)
- La base cortada recta, a la altura de la cintura o la cadera
- Deja un poco de aire sobre la cabeza, unos 60 px de los 1200

Si las cinco se hacen con el mismo encuadre y a la misma distancia, las
caras salen del mismo tamaño en la web. Si una se toma más de cerca que
las demás, esa persona se verá más grande: no es un fallo de la página,
es el encuadre de la foto.

## Formato: por qué .webp y no .png

Las fotos llegaron en PNG y pesaban **12,5 MB entre las cinco** — más de
treinta veces todo el resto del sitio junto. En WebP con calidad 88 pesan
**366 KB** y no se distingue la diferencia a simple vista (lo comparamos
cara a cara antes de decidirlo).

Con PNG lo mejor que se conseguía eran 5 MB. Reducir la paleta bajaba
mucho más el peso, pero dejaba la piel granulada, así que se descartó.

**Cuando cambies o añadas una foto, súbela en PNG igual que hiciste.**
Avísame y la convierto: hay que redimensionarla a 1200 px de alto y
pasarla a WebP para que la página no se vuelva pesada.

Los PNG originales, a tamaño completo, siguen guardados en el historial
de Git (commit `12ef9ae`) por si alguna vez hay que volver a recortarlos.

## Añadir más personas

Duplica en el HTML el bloque `<article class="founder-card">` o
`<section class="member">`, según la página, y usa el siguiente número de
archivo (`equipo-4.webp`, etc.). En la página de equipo las secciones
alternan el lado de la foto solas: el CSS usa `:nth-child(even)`, así que
no hay que tocar nada más.
