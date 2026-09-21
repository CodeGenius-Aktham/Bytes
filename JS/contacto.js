/* ============================================================
   CONTACTO.JS — Envío de los formularios de contacto de Bytes.

   El sitio es estático, así que no hay backend propio: el envío se
   delega en FormSubmit, que reenvía los campos al correo indicado
   en el action del <form>.

   El formulario ya funciona sin JavaScript (POST normal al endpoint,
   con la página de gracias de FormSubmit). Este script mejora esa
   base: envía por fetch al endpoint /ajax/, informa del resultado en
   la misma página y evita el salto a un sitio externo.
   ============================================================ */
(function () {
    'use strict';

    const form = document.querySelector('.contact-form');

    // Sin guard, el script moriría aquí en las páginas sin formulario.
    if (!form) return;

    const boton = form.querySelector('.btn-send');
    const estado = form.querySelector('.form-status');
    const etiquetaBoton = boton ? boton.textContent : '';

    // El action apunta al endpoint normal (el que sirve de reserva sin JS);
    // para fetch usamos el de AJAX, que responde JSON en vez de redirigir.
    const endpointAjax = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');

    const mostrar = (mensaje, tipo) => {
        if (!estado) return;
        estado.textContent = mensaje;
        estado.className = 'form-status is-' + tipo;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (boton) {
            boton.disabled = true;
            boton.textContent = 'Enviando...';
        }
        mostrar('Enviando tu solicitud...', 'cargando');

        try {
            const res = await fetch(endpointAjax, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            });

            if (!res.ok) throw new Error('HTTP ' + res.status);

            mostrar('¡Listo! Recibimos tu solicitud y te respondemos en menos de 24 horas.', 'ok');
            form.reset();
        } catch (err) {
            console.error('No se pudo enviar el formulario:', err);
            mostrar('No pudimos enviar tu solicitud. Escríbenos a contactosbytes@gmail.com', 'error');
        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = etiquetaBoton;
            }
        }
    });
})();
