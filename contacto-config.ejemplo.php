<?php
/* ============================================================
   Copia este archivo como contacto-config.php y rellena lo tuyo.

   contacto-config.php está en .gitignore a propósito: lleva la
   contraseña del correo y no debe subirse al repositorio.

   Si no creas el archivo, contacto.php funciona igual usando
   mail(), que no necesita credenciales.
   ============================================================ */

return [
    // A dónde llegan las solicitudes.
    'destino' => 'contactosbytes@gmail.com',

    // Desde qué dirección salen. En modo 'smtp' con Gmail tiene que ser
    // la misma cuenta que autentica, o Gmail la reescribe igualmente.
    'remitente' => 'contactosbytes@gmail.com',

    // 'mail' no necesita nada más, pero depende del MTA del servidor y
    // suele acabar en spam. 'smtp' se autentica y entrega de verdad.
    'modo' => 'smtp',

    'smtp' => [
        'host'      => 'smtp.gmail.com',
        'puerto'    => 587,
        'seguridad' => 'tls',          // 'tls' (587), 'ssl' (465) o 'ninguna'
        'usuario'   => 'contactosbytes@gmail.com',

        // NO es la contraseña normal de Gmail. Hay que activar la
        // verificación en dos pasos y generar una "contraseña de
        // aplicación" de 16 caracteres en la cuenta de Google.
        'contrasena' => 'xxxx xxxx xxxx xxxx',
    ],

    // Solicitudes por IP y hora. 0 lo desactiva.
    'limite_por_hora' => 5,
];
