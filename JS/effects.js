/* ============================================================
   EFFECTS.JS — Efectos compartidos (reveal al scroll + tilt).
   Antes estaban copiados dentro de cada HTML y recalculaban
   getBoundingClientRect() de todos los elementos en CADA evento
   de scroll. Ahora usan IntersectionObserver y rAF.
   ============================================================ */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Reveal al entrar en viewport ── */
    const reveals = document.querySelectorAll('.reveal');

    if (reveals.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            reveals.forEach(el => el.classList.add('active'));
        } else {
            const io = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target); // una sola vez: no gastamos más CPU
                });
            }, { rootMargin: '0px 0px -150px 0px', threshold: 0 });

            reveals.forEach(el => io.observe(el));
        }
    }

    /* ── Tilt sutil del portátil siguiendo el ratón ── */
    const laptop = document.querySelector('.laptop-container');

    if (laptop && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
        let x = 0, y = 0, queued = false;

        const apply = () => {
            queued = false;
            laptop.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
        };

        document.addEventListener('mousemove', (e) => {
            // Divisor alto = movimiento sutil y controlado
            x = (window.innerWidth / 2 - e.clientX) / 100;
            y = (window.innerHeight / 2 - e.clientY) / 100;
            if (!queued) { queued = true; requestAnimationFrame(apply); }
        }, { passive: true });
    }
})();
