/* ============================================================
   CONTACTO.JS — Envío de los formularios de contacto de Bytes.

   El trabajo de verdad lo hace contacto.php, en el servidor. Este
   script sólo evita la recarga de página: manda los campos por fetch
   y escribe la respuesta debajo del botón.

   Sin JavaScript el formulario sigue funcionando: el navegador hace
   el POST normal del action y contacto.php responde con su propia
   página de confirmación.
   ============================================================ */
(function () {
    'use strict';

    const form = document.querySelector('.contact-form');

    // Sin guard, el script moriría aquí en las páginas sin formulario.
    if (!form) return;

    const boton = form.querySelector('.btn-send');
    const estado = form.querySelector('.form-status');
    const etiquetaBoton = boton ? boton.textContent : '';

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
            // El Accept es lo que le dice a contacto.php que responda JSON
            // en vez de su página de confirmación.
            const res = await fetch(form.action, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            });

            const datos = await res.json();

            if (datos.ok) {
                mostrar(datos.mensaje, 'ok');
                form.reset();
            } else {
                // Validación o fallo de envío: el servidor ya explica el motivo.
                mostrar(datos.mensaje, 'error');
            }
        } catch (err) {
            console.error('No se pudo enviar el formulario:', err);
            mostrar('No pudimos enviar tu solicitud. Revisa tu conexión e inténtalo de nuevo.', 'error');
        } finally {
            if (boton) {
                boton.disabled = false;
                boton.textContent = etiquetaBoton;
            }
        }
    });
})();
