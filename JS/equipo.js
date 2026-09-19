/* ============================================================
   EQUIPO.JS — Navegacion_Bytes/nuestro-equipo.html

   Sólo hace una cosa: encender el número gigante de fondo cuando
   su sección entra en pantalla.

   Antes también movía la foto con parallax, pero desde que la
   figura sobresale del marco cualquier desplazamiento vertical la
   despegaba de la base o la sacaba por debajo, así que se quitó.
   ============================================================ */
(function () {
    'use strict';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const secciones = document.querySelectorAll('.member');
    if (!secciones.length) return;

    if (!('IntersectionObserver' in window)) {
        secciones.forEach((s) => s.classList.add('visible'));
        return;
    }

    const io = new IntersectionObserver((entradas, obs) => {
        entradas.forEach((e) => {
            if (!e.isIntersecting) return;
            e.target.classList.add('visible');
            obs.unobserve(e.target);        // una sola vez
        });
    }, { rootMargin: '10% 0px', threshold: 0 });

    secciones.forEach((s) => io.observe(s));
})();
