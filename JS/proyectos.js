/* ============================================================
   PROYECTOS.JS — Navegacion_Bytes/proyectos.html

   Cuatro piezas, todas apagadas con prefers-reduced-motion y
   ninguna trabajando fuera de pantalla:
     · barra de progreso de lectura
     · constelación del hero en canvas
     · contadores de las cifras
     · entradas al hacer scroll
   ============================================================ */
(function () {
    'use strict';

    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Ejecuta fn como mucho una vez por frame. */
    function porFrame(fn) {
        let pedido = false;
        return function () {
            if (pedido) return;
            pedido = true;
            requestAnimationFrame(() => { pedido = false; fn(); });
        };
    }

    /* ==========================================================
       1. BARRA DE PROGRESO
       ========================================================== */
    function iniProgreso() {
        const barra = document.getElementById('progreso');
        if (!barra) return;

        // scaleX en vez de width: no provoca reflow en cada scroll
        barra.style.width = '100%';
        barra.style.transform = 'scaleX(0)';

        const pintar = () => {
            const alto = document.documentElement.scrollHeight - window.innerHeight;
            const avance = alto > 0 ? window.scrollY / alto : 0;
            barra.style.transform = 'scaleX(' + Math.min(1, Math.max(0, avance)).toFixed(4) + ')';
        };

        const alScroll = porFrame(pintar);
        window.addEventListener('scroll', alScroll, { passive: true });
        window.addEventListener('resize', alScroll, { passive: true });
        pintar();
    }

    /* ==========================================================
       2. CONSTELACIÓN DEL HERO
       Se pausa fuera de pantalla y con la pestaña oculta.
       ========================================================== */
    function iniConstelacion() {
        const canvas = document.getElementById('constelacion');
        if (!canvas || !canvas.getContext) return;

        const ctx = canvas.getContext('2d');
        const hero = canvas.closest('.pr-launch') || canvas;
        const DISTANCIA = 150;

        let puntos = [];
        let corriendo = false;
        let enPantalla = false;
        let frame = null;

        function medir() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (!w || !h) return false;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            return true;
        }

        function sembrar() {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            // Menos puntos en pantallas pequeñas: el coste es cuadrático
            const total = w < 700 ? 26 : 46;
            puntos = Array.from({ length: total }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.22,
                vy: (Math.random() - 0.5) * 0.22,
                r: Math.random() * 1.6 + 0.6
            }));
        }

        function dibujar() {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            for (const p of puntos) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            ctx.lineWidth = 0.7;
            for (let i = 0; i < puntos.length; i++) {
                for (let j = i + 1; j < puntos.length; j++) {
                    const dx = puntos[i].x - puntos[j].x;
                    const dy = puntos[i].y - puntos[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 >= DISTANCIA * DISTANCIA) continue;   // sin sqrt si no hace falta
                    const d = Math.sqrt(d2);
                    ctx.beginPath();
                    ctx.moveTo(puntos[i].x, puntos[i].y);
                    ctx.lineTo(puntos[j].x, puntos[j].y);
                    ctx.strokeStyle = 'rgba(46,204,64,' + (0.32 * (1 - d / DISTANCIA)).toFixed(3) + ')';
                    ctx.stroke();
                }
            }

            ctx.fillStyle = 'rgba(46,204,64,.55)';
            for (const p of puntos) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }

            if (corriendo) frame = requestAnimationFrame(dibujar);
        }

        function arrancar() {
            if (corriendo || quieto) return;
            corriendo = true;
            frame = requestAnimationFrame(dibujar);
        }

        function parar() {
            corriendo = false;
            if (frame) { cancelAnimationFrame(frame); frame = null; }
        }

        if (!medir()) return;
        sembrar();

        if (quieto) { dibujar(); return; }   // un solo fotograma, sin bucle

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((e) => {
                enPantalla = e[0].isIntersecting;
                enPantalla ? arrancar() : parar();
            }, { rootMargin: '100px' }).observe(hero);
        } else {
            enPantalla = true; arrancar();
        }

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) parar();
            else if (enPantalla) arrancar();
        });

        window.addEventListener('resize', porFrame(() => {
            if (medir()) sembrar();
        }), { passive: true });
    }

    /* ==========================================================
       3. CONTADORES
       ========================================================== */
    function iniContadores() {
        const cifras = document.querySelectorAll('[data-contador]');
        if (!cifras.length) return;

        const pintarFinal = (el) => {
            el.textContent = el.dataset.contador + (el.dataset.sufijo || '');
        };

        if (quieto || !('IntersectionObserver' in window)) {
            cifras.forEach(pintarFinal);
            return;
        }

        const contar = (el) => {
            const destino = parseInt(el.dataset.contador, 10);
            const sufijo = el.dataset.sufijo || '';
            if (!Number.isFinite(destino)) { pintarFinal(el); return; }

            // Los años arrancan cerca para no desfilar desde cero
            const desde = destino > 1900 ? destino - 12 : 0;
            const inicio = performance.now();
            const DURACION = 1400;

            const paso = (ahora) => {
                const t = Math.min(1, (ahora - inicio) / DURACION);
                const suave = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(desde + (destino - desde) * suave) + sufijo;
                if (t < 1) requestAnimationFrame(paso);
            };
            requestAnimationFrame(paso);
        };

        const io = new IntersectionObserver((entradas, obs) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting) return;
                contar(e.target);
                obs.unobserve(e.target);      // una sola vez
            });
        }, { threshold: 0.5 });

        cifras.forEach((el) => io.observe(el));
    }

    /* ==========================================================
       4. ENTRADAS AL HACER SCROLL
       ========================================================== */
    function iniEntradas() {
        const objetivos = document.querySelectorAll('[data-proyecto], .pr-lista-cabecera');
        if (!objetivos.length) return;

        if (quieto || !('IntersectionObserver' in window)) {
            objetivos.forEach((el) => el.classList.add('visible'));
            return;
        }

        const io = new IntersectionObserver((entradas, obs) => {
            entradas.forEach((e) => {
                if (!e.isIntersecting) return;
                e.target.classList.add('visible');
                obs.unobserve(e.target);      // una sola vez: no gastamos más CPU
            });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });

        objetivos.forEach((el) => io.observe(el));
    }

    function iniciar() {
        iniProgreso();
        iniConstelacion();
        iniContadores();
        iniEntradas();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
