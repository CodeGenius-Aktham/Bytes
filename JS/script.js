/* ============================================================
   SCRIPT.JS — Lógica exclusiva de la portada (index.html).
   El menú móvil vive ahora en nav.js y los efectos genéricos
   en effects.js.
   ============================================================ */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Entrada de las tarjetas de producto ── */
    const products = document.querySelectorAll('.product-card');

    if (products.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            products.forEach(p => p.classList.add('is-visible'));
        } else {
            const productObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting);
                });
            }, { threshold: 0.3 });

            products.forEach(product => productObserver.observe(product));
        }
    }

    /* ── Desvanecido del hero al hacer scroll ──
       Antes se escribía en el DOM dentro del propio evento de scroll,
       lo que forzaba un reflow por evento. Ahora se agrupa en un rAF. */
    const heroSection = document.querySelector('.brand-landing');

    if (heroSection && !reduceMotion) {
        const FADE_DISTANCE = 500; // px hasta la opacidad 0
        let queued = false;

        const paint = () => {
            queued = false;
            const scrollPosition = window.scrollY;
            const opacity = Math.max(0, Math.min(1, 1 - scrollPosition / FADE_DISTANCE));

            heroSection.style.opacity = opacity;
            heroSection.style.transform = `translate3d(0, ${-scrollPosition * 0.2}px, 0)`;
            // Sin repintar cuando ya es invisible
            heroSection.style.visibility = opacity === 0 ? 'hidden' : '';
        };

        window.addEventListener('scroll', () => {
            if (!queued) { queued = true; requestAnimationFrame(paint); }
        }, { passive: true });

        paint();
    }
})();
