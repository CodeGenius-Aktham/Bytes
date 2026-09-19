/* ============================================================
   EQUIPO.JS — Navegacion_Bytes/nuestro-equipo.html

   Dos cosas, ambas medidas en cada frame como mucho una vez y
   sólo mientras la sección está en pantalla:
     · el número gigante de fondo aparece al entrar la sección
     · la foto se desplaza algo más despacio que el texto
       (parallax); se escribe en la custom property --py, que
       equipo.css aplica dentro del transform de la imagen, para
       no pisar el transform de la animación de entrada.
   ============================================================ */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const secciones = document.querySelectorAll('.member');
    if (!secciones.length) return;

    const AMPLITUD = 12;          // px de recorrido del parallax
    const enPantalla = new Set();

    /* ── Aparición del número de fondo ── */
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    enPantalla.add(e.target);
                } else {
                    enPantalla.delete(e.target);
                }
            });
            pedirFrame();
        }, { rootMargin: '10% 0px', threshold: 0 });

        secciones.forEach((s) => io.observe(s));
    } else {
        secciones.forEach((s) => { s.classList.add('visible'); enPantalla.add(s); });
    }

    /* ── Parallax ── */
    let pedido = false;

    function pedirFrame() {
        if (pedido) return;
        pedido = true;
        requestAnimationFrame(pintar);
    }

    function pintar() {
        pedido = false;
        if (!enPantalla.size) return;

        const alto = window.innerHeight;

        enPantalla.forEach((seccion) => {
            const foto = seccion.querySelector('.member-photo');
            if (!foto) return;

            const r = seccion.getBoundingClientRect();
            // -1 cuando la sección va saliendo por arriba, +1 al entrar por abajo
            const avance = ((r.top + r.height / 2) - alto / 2) / alto;
            const limitado = Math.max(-1, Math.min(1, avance));

            foto.style.setProperty('--py', (limitado * AMPLITUD).toFixed(1) + 'px');
        });
    }

    window.addEventListener('scroll', pedirFrame, { passive: true });
    window.addEventListener('resize', pedirFrame, { passive: true });
    pintar();
})();
