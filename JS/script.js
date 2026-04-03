// --- ANIMACIÓN DE ENTRADA DE PRODUCTOS (INTERSECTION OBSERVER) ---
const products = document.querySelectorAll('.product-card');

const observerOptions = {
    root: null, // usa el viewport
    threshold: 0.3 // dispara cuando el 30% del elemento es visible
};

const productObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Opcional: dejar de observar una vez visible
            // observer.unobserve(entry.target); 
        } else {
            // Opcional: quitar la clase si quieres que la animación se repita al subir
            // entry.target.classList.remove('is-visible');
        }
    });
}, observerOptions);

products.forEach(product => {
    productObserver.observe(product);
});


// --- EFECTO DE DESVANECIMIENTO DE LA PRIMERA SECCIÓN AL HACER SCROLL ---
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const heroSection = document.querySelector('.brand-landing');
    
    // A medida que haces scroll down, la opacidad baja de 1 a 0
    // 500 es la distancia en px donde se vuelve completamente invisible
    let opacity = 1 - (scrollPosition / 500); 
    
    if (opacity >= 0 && heroSection) {
        heroSection.style.opacity = opacity;
        // También podemos moverla un poco hacia arriba para dar efecto de profundidad
        heroSection.style.transform = `translateY(${-scrollPosition * 0.2}px)`;
    }
});

const menuToggle = document.getElementById('mobile-menu');
const navList = document.getElementById('nav-list');

menuToggle.addEventListener('click', () => {
    navList.classList.toggle('active');
    
    // Animación simple de las barritas
    const bars = document.querySelectorAll('.bar');
    bars[0].style.transform = navList.classList.contains('active') ? 'rotate(45deg) translateY(5px)' : 'none';
    bars[1].style.transform = navList.classList.contains('active') ? 'rotate(-45deg) translateY(-5px)' : 'none';
});