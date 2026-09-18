/* ============================================================
   NAV.JS — Navbar compartida por todas las páginas de Bytes.
   Sustituye al bloque de menú móvil que estaba duplicado
   dentro de cada HTML. Se carga con <script defer src=".../nav.js">
   ============================================================ */
(function () {
    'use strict';

    const toggle = document.getElementById('mobile-menu');
    const navList = document.getElementById('nav-list');

    // Sin guard, el script entero moría aquí en cualquier página sin navbar.
    if (!toggle || !navList) return;

    const setOpen = (open) => {
        navList.classList.toggle('active', open);
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-open', open);
    };

    const isOpen = () => navList.classList.contains('active');

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!isOpen());
    });

    // Cerrar al navegar, al pulsar Escape o al tocar fuera.
    navList.addEventListener('click', (e) => {
        if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
            setOpen(false);
            toggle.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (isOpen() && !navList.contains(e.target) && !toggle.contains(e.target)) {
            setOpen(false);
        }
    });

    // Si se vuelve a escritorio con el menú abierto, restablecer.
    const desktop = window.matchMedia('(min-width: 769px)');
    desktop.addEventListener('change', (e) => { if (e.matches) setOpen(false); });

    setOpen(false);
})();
