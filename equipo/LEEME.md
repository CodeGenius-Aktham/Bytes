# Fotos del equipo

Aquí van las fotos de las personas de Bytes: los dos fundadores y los tres
del equipo. El nombre del archivo importa, porque es el que buscan las
páginas. Si un archivo no existe, la web no se rompe ni muestra el icono
de imagen rota: en su lugar sale el monograma con las iniciales.

## Fundadores — `Navegacion_Bytes/fundadores.html`

| Archivo          | Quién                |
| ---------------- | -------------------- |
| `fundador-1.png` | Fundador de la izquierda |
| `fundador-2.png` | Fundador de la derecha   |

**Recorte sin fondo, en PNG con transparencia.** La figura sobresale por
encima del marco de la tarjeta, así que el fondo tiene que estar quitado
de verdad (no blanco, no gris: transparente).

- Formato: PNG con canal alfa
- Proporción: **3:4 vertical** (por ejemplo 900 × 1200 px)
- Encuadre: de la cintura o el pecho hacia arriba, con la figura ocupando
  todo el alto del recuadro
- La base se corta recta: esa parte queda apoyada en el borde del marco

Cuánto sobresale la figura depende de su proporción. Con 3:4 sobresale unos
90 px, que es lo que está calculado. Si tus recortes salen más cuadrados y
quieres ajustarlo, cambia `--foto-ancho` en `CSS/fundadores.css`; el cálculo
está anotado ahí mismo.

## Equipo — `Navegacion_Bytes/nuestro-equipo.html`

| Archivo        | Quién            |
| -------------- | ---------------- |
| `equipo-1.jpg` | Persona 01       |
| `equipo-2.jpg` | Persona 02       |
| `equipo-3.jpg` | Persona 03       |

**Fotos normales, con fondo.** Aquí no hace falta recortar nada: la foto se
encaja sola dentro de un marco 4:5 y se recorta al centro.

- Formato: JPG (o PNG, cambiando la extensión en el `src` del HTML)
- Proporción: **4:5 vertical** (por ejemplo 800 × 1000 px). Si mandas otra,
  se recorta al centro, así que deja aire alrededor de la cara
- Encuadre: retrato, de medio cuerpo

## Antes de subirlas

Las fotos sin optimizar son lo que más pesa en una web. Exporta a un tamaño
razonable: **con 1200 px de lado mayor sobra**, incluso en pantallas retina.
Una foto de 4000 px no se ve mejor, sólo tarda más en cargar.

## Añadir más personas

Duplica en el HTML el bloque `<article class="founder-card">` o
`<section class="member">`, según la página, y usa el siguiente número de
archivo (`equipo-4.jpg`, etc.). En la página de equipo las secciones
alternan el lado de la foto solas: el CSS usa `:nth-child(even)`, así que
no hay que tocar nada más.
