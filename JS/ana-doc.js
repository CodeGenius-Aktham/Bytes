/* ============================================================
   ANA-DOC.JS — Lógica de html/ana-doc.html
   Extraído de los ~360 líneas que vivían inline en el HTML.
   Cambios de rendimiento frente a la versión anterior:
     · los handlers de scroll se agrupan en requestAnimationFrame
     · el canvas de la red neuronal se pausa fuera de pantalla
       y cuando la pestaña no está visible (antes corría siempre)
     · el canvas es consciente del devicePixelRatio (antes borroso)
     · la luz de la cueva usa custom properties en vez de
       reconstruir el string del gradiente en cada evento
     · todo respeta prefers-reduced-motion
   ============================================================ */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /** Ejecuta fn como mucho una vez por frame. */
    function rafThrottle(fn) {
        let queued = false;
        return function () {
            if (queued) return;
            queued = true;
            requestAnimationFrame(() => { queued = false; fn(); });
        };
    }

    /** Llama a onEnter/onLeave cuando el elemento entra o sale del viewport. */
    function onVisible(el, onEnter, onLeave, options) {
        if (!('IntersectionObserver' in window)) { onEnter(); return; }
        new IntersectionObserver((entries) => {
            entries.forEach(e => (e.isIntersecting ? onEnter() : onLeave && onLeave()));
        }, options || { rootMargin: '200px' }).observe(el);
    }

    /* ==========================================================
       1. HERO — expansión del orbe al hacer scroll
       ========================================================== */
    function initOrb() {
        const orbContainer = document.getElementById('orb-container');
        if (!orbContainer) return;

        const heroText = document.getElementById('hero-text');
        const infoOverlay = document.getElementById('info-overlay');
        const infoSteps = document.querySelectorAll('.info-step');
        const expansionSection = document.getElementById('expansion-section');

        const isMobile = window.innerWidth < 800;

        // En móvil la escala objetivo es menor para que la animación sea manejable
        const targetScale = isMobile ? 30 : 61.1;
        const baseScale = 1.1;
        const scaleDiff = targetScale - baseScale;

        const expansionEnd = 800;
        const infoDuration = 2000;
        const collapseStart = 2900;
        const collapseDuration = isMobile ? 2500 : 800;

        // La sección necesita altura suficiente para recorrer las tres fases
        const minPageHeight = collapseStart + collapseDuration + 600;
        if (expansionSection) expansionSection.style.minHeight = minPageHeight + 'px';

        function updateFrame() {
            const currentScroll = window.pageYOffset;
            let currentScale, zIndex;

            // FASE 1: APERTURA (0 → 800)
            if (currentScroll < expansionEnd) {
                const progress = currentScroll / expansionEnd;
                if (progress <= 0.3) {
                    currentScale = 1 + (0.1 * (progress / 0.3));
                } else {
                    const p2 = (progress - 0.3) / 0.7;
                    currentScale = baseScale + (scaleDiff * Math.pow(p2, 2));
                }
                orbContainer.style.position = 'fixed';
                orbContainer.style.top = '50%';
                zIndex = 50;
                if (infoOverlay) infoOverlay.classList.add('hidden');
            }

            // FASE 2: INFO ACTIVA (800 → 2900)
            else if (currentScroll < collapseStart) {
                currentScale = targetScale;
                zIndex = 99999;
                orbContainer.style.position = 'fixed';
                orbContainer.style.top = '50%';
                if (infoOverlay) infoOverlay.classList.remove('hidden');

                const relativeScroll = currentScroll - expansionEnd;
                const stepProgress = Math.max(0, Math.min(1, relativeScroll / infoDuration));
                const total = infoSteps.length;

                infoSteps.forEach((step, index) => {
                    const start = index / total;
                    const end = (index + 1) / total;
                    step.classList.toggle('visible', stepProgress >= start && stepProgress < end);
                });
            }

            // FASE 3: CIERRE (2900 → fin)
            else {
                const collapseProgress = Math.min(1, (currentScroll - collapseStart) / collapseDuration);

                // Ease-out cúbico: empieza rápido, termina suave
                const eased = 1 - Math.pow(1 - collapseProgress, 3);
                currentScale = targetScale - ((targetScale - 1) * eased);

                if (infoOverlay) infoOverlay.classList.add('hidden');

                if (collapseProgress >= 1) {
                    // Anclaje final: pasa a absolute para no quedar flotando
                    orbContainer.style.position = 'absolute';
                    orbContainer.style.top = (collapseStart + collapseDuration + window.innerHeight / 2) + 'px';
                    zIndex = 5;
                    currentScale = 1; // garantizamos escala exacta final
                } else {
                    orbContainer.style.position = 'fixed';
                    orbContainer.style.top = '50%';
                    zIndex = 99999;
                }
            }

            orbContainer.style.zIndex = zIndex;
            orbContainer.style.transform = `translate3d(-50%, -50%, 0) scale(${currentScale})`;

            if (heroText) heroText.style.opacity = Math.max(0, 1 - (currentScroll / 400));
        }

        const onScroll = rafThrottle(updateFrame);
        updateFrame();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
    }

    /* ==========================================================
       2. CAVE SECTION — partículas, luz y bloques
       ========================================================== */
    function initCave() {
        const caveSection = document.getElementById('cave-section');
        if (!caveSection) return;

        /* ── Partículas ── */
        const particleContainer = document.getElementById('cave-particles');
        if (particleContainer && !reduceMotion) {
            // Un único fragment: 1 reflow en vez de 40
            const frag = document.createDocumentFragment();
            for (let i = 0; i < 40; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                p.style.setProperty('--size', (Math.random() * 3 + 1) + 'px');
                p.style.setProperty('--x', Math.random() * 100 + '%');
                p.style.setProperty('--y', Math.random() * 100 + '%');
                p.style.setProperty('--dur', (Math.random() * 6 + 5) + 's');
                p.style.setProperty('--delay', (Math.random() * 8) + 's');
                frag.appendChild(p);
            }
            particleContainer.appendChild(frag);
        }

        /* ── Luz que crece con el scroll ──
           Ojo: #cave-light está definido en el CSS pero el <div> no
           existe hoy en el HTML. Si no está, ni siquiera registramos
           los listeners (antes se ejecutaban en vacío en cada scroll). */
        const caveLight = document.getElementById('cave-light');
        let caveVisible = true;

        function updateLight() {
            if (!caveVisible) return;

            const rangeH = caveSection.offsetHeight - window.innerHeight;
            const raw = rangeH > 0 ? (window.pageYOffset - caveSection.offsetTop) / rangeH : 0;
            const progress = Math.max(0, Math.min(1, raw));

            // Se escriben dos custom properties; el gradiente vive en el CSS,
            // así no reconstruimos el string del background en cada frame.
            caveLight.style.setProperty('--cave-o', Math.min(1, progress * 2.5).toFixed(3));
            caveLight.style.setProperty('--cave-s', (20 + progress * 60).toFixed(2) + '%');
        }

        if (caveLight) {
            const onScroll = rafThrottle(updateLight);
            onVisible(caveSection, () => { caveVisible = true; updateLight(); },
                                   () => { caveVisible = false; });
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', onScroll, { passive: true });
            updateLight();
        }

        /* ── Bloques de texto ── */
        const caveBlocks = document.querySelectorAll('.cave-block');
        if (!caveBlocks.length) return;

        if (reduceMotion || !('IntersectionObserver' in window)) {
            caveBlocks.forEach(b => b.classList.add('visible'));
            return;
        }

        const blockObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                } else if (entry.boundingClientRect.top > 0) {
                    // Solo al salir por abajo, para re-animar al volver a bajar
                    entry.target.classList.remove('visible');
                }
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

        caveBlocks.forEach(block => blockObserver.observe(block));
    }

    /* ==========================================================
       3. DASHBOARD DE IMPACTO
       ========================================================== */
    function initDashboard() {
        const wrapper = document.querySelector('.ana-impact-dashboard-v3 .w');
        if (!wrapper) return;

        /* ── Capas de seguridad ── */
        const layers = [
            ['01', 'AES-256'], ['02', 'Firewall'],
            ['03', 'Biometría'], ['04', 'Sandbox'],
            ['05', 'Anti-DDoS'], ['06', 'Auditoría'],
            ['07', 'Aislamiento'], ['08', 'Integridad']
        ];

        const lg = document.getElementById('lyr');
        if (lg) {
            const frag = document.createDocumentFragment();
            layers.forEach(([n, t], i) => {
                const d = document.createElement('div');
                d.className = 'layer';
                // textContent en vez de innerHTML: nada de parsear HTML por nodo
                const sn = document.createElement('span');
                sn.className = 'layer-n';
                sn.textContent = n;
                const st = document.createElement('span');
                st.className = 'layer-t';
                st.textContent = t;
                d.append(sn, st);
                d.style.transitionDelay = (0.7 + i * 0.07) + 's';
                frag.appendChild(d);
            });
            lg.appendChild(frag);
        }

        /* ── Nodos del ecosistema ── */
        const ng = document.getElementById('ngrid');
        if (ng) {
            const frag = document.createDocumentFragment();
            for (let i = 0; i < 48; i++) {
                const n = document.createElement('div');
                const on = i < 4;
                n.className = 'node-sq' + (on ? ' on pulse' : '');
                if (on) n.style.animationDelay = (i * 0.3) + 's';
                frag.appendChild(n);
            }
            ng.appendChild(frag);
        }

        /* ── Animación de arcos y contadores ── */
        function animArc(id, valId, target, circ) {
            const arc = document.getElementById(id);
            const val = document.getElementById(valId);
            if (!arc || !val) return;
            if (reduceMotion) {
                arc.style.strokeDasharray = (target / 100) * circ + ' ' + circ;
                val.textContent = target + '%';
                return;
            }
            let c = 0;
            const step = () => {
                c = Math.min(c + 1, target);
                arc.style.strokeDasharray = ((c / 100) * circ) + ' ' + circ;
                val.textContent = c + '%';
                if (c < target) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        function animCount(id, target, suffix) {
            const el = document.getElementById(id);
            if (!el) return;
            if (reduceMotion) { el.textContent = target + (suffix || ''); return; }
            let c = 0;
            const inc = Math.ceil(target / 60);
            const step = () => {
                c = Math.min(c + inc, target);
                el.textContent = c + (suffix || '');
                if (c < target) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        const setStyle = (id, prop, value) => {
            const el = document.getElementById(id);
            if (el) el.style[prop] = value;
        };
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        let started = false;
        let blinkTimer = null;

        // Parpadeo aleatorio de nodos. Antes era un setInterval eterno;
        // ahora sólo corre mientras el dashboard está en pantalla.
        function startBlink() {
            if (blinkTimer || reduceMotion || !ng) return;
            blinkTimer = setInterval(() => {
                const sqs = ng.querySelectorAll('.node-sq:not(.on)');
                if (!sqs.length) return;
                const rand = sqs[Math.floor(Math.random() * sqs.length)];
                rand.classList.add('on');
                setTimeout(() => rand.classList.remove('on'), 800 + Math.random() * 600);
            }, 400);
        }

        function stopBlink() {
            if (blinkTimer) { clearInterval(blinkTimer); blinkTimer = null; }
        }

        function startDashboard() {
            if (started) return;
            started = true;

            animArc('arc1', 'arcv1', 98, 163.4);
            setStyle('b1', 'width', '98%');
            setText('bl1', '98%');
            setStyle('b2', 'width', '82%');

            animArc('arc2', 'arcv2', 88, 163.4);
            animCount('autonum', 1240);

            setStyle('spl', 'strokeDashoffset', '0');
            setStyle('spa', 'opacity', '1');
            setStyle('spd', 'opacity', '1');

            document.querySelectorAll('.layer').forEach(l => {
                l.style.opacity = '1';
                l.style.transform = 'translateX(0)';
            });

        }

        onVisible(wrapper, () => { startDashboard(); startBlink(); },
                           stopBlink,
                           { rootMargin: '100px' });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopBlink();
        });

        initNeuralNet(wrapper);
    }

    /* ==========================================================
       4. RED NEURONAL EN CANVAS (fondo del dashboard)
       ========================================================== */
    function initNeuralNet(wrapper) {
        const canvas = document.getElementById('bg');
        if (!canvas || !canvas.getContext) return;

        const ctx = canvas.getContext('2d');
        const COUNT = 28;
        const LINK_DIST = 130;

        let pts = [];
        let running = false;
        let inView = false;
        let frameId = null;

        function resize() {
            // Consciente del devicePixelRatio: antes se veía borroso en retina
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            if (!w || !h) return;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function initPts() {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            pts = Array.from({ length: COUNT }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3
            }));
        }

        function drawNet() {
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            for (const p of pts) {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;
            }

            // Las líneas comparten un solo begin/stroke por par, pero
            // agrupamos el estilo común para reducir cambios de estado.
            ctx.lineWidth = 0.6;
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 >= LINK_DIST * LINK_DIST) continue; // sin sqrt si no hace falta
                    const dist = Math.sqrt(d2);
                    ctx.beginPath();
                    ctx.moveTo(pts[i].x, pts[i].y);
                    ctx.lineTo(pts[j].x, pts[j].y);
                    ctx.strokeStyle = `rgba(25,81,10,${0.4 * (1 - dist / LINK_DIST)})`;
                    ctx.stroke();
                }
            }

            ctx.fillStyle = 'rgba(25,81,10,.4)';
            for (const p of pts) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            if (running) frameId = requestAnimationFrame(drawNet);
        }

        function start() {
            if (running || reduceMotion) return;
            running = true;
            frameId = requestAnimationFrame(drawNet);
        }

        function stop() {
            running = false;
            if (frameId) { cancelAnimationFrame(frameId); frameId = null; }
        }

        resize();
        initPts();

        if (reduceMotion) {
            drawNet();          // un solo fotograma estático, sin bucle
        } else {
            // El bucle sólo corre con el canvas en pantalla y la pestaña activa
            onVisible(wrapper || canvas, () => { inView = true; start(); },
                                          () => { inView = false; stop(); },
                                          { rootMargin: '100px' });

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) stop();
                else if (inView) start();
            });
        }

        window.addEventListener('resize', rafThrottle(() => { resize(); initPts(); }), { passive: true });
    }

    /* ── Arranque ── */
    function init() {
        initOrb();
        initCave();
        initDashboard();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
