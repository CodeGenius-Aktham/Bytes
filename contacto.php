<?php
/* ============================================================
   CONTACTO.PHP — Recibe los formularios de contacto del sitio.

   Sin servicios de terceros ni librerías: valida los datos, deja
   constancia en disco y envía el correo. Dos modos de envío, según
   lo que configures en contacto-config.php:

     'mail' → la función mail() de PHP, que entrega al MTA local.
              Cero configuración, pero si el servidor no firma con
              SPF/DKIM, Gmail suele mandarlo a spam.

     'smtp' → cliente SMTP propio (más abajo, hablado a mano sobre
              sockets). Entrega autenticándose contra el servidor de
              correo que le digas, así que llega a la bandeja.

   Pase lo que pase con el correo, toda solicitud queda guardada en
   almacen/solicitudes.log: si el envío falla, no se pierde.
   ============================================================ */

declare(strict_types=1);

// ------------------------------------------------------------------
// Configuración
// ------------------------------------------------------------------
$config = [
    'destino'      => 'contactosbytes@gmail.com',
    'remitente'    => 'contactosbytes@gmail.com',
    'nombre_sitio' => 'Bytes',
    'modo'         => 'mail',   // 'mail' o 'smtp'
    'smtp' => [
        'host'       => '',
        'puerto'     => 587,
        'seguridad'  => 'tls',  // 'tls', 'ssl' o 'ninguna'
        'usuario'    => '',
        'contrasena' => '',
    ],
    'limite_por_hora' => 5,     // solicitudes por IP
    'ruta_almacen'    => __DIR__ . '/almacen',
];

// Las credenciales reales viven fuera del repositorio.
$rutaConfig = __DIR__ . '/contacto-config.php';
if (is_readable($rutaConfig)) {
    $propio = require $rutaConfig;
    if (is_array($propio)) {
        $config = array_replace_recursive($config, $propio);
    }
}

// Valores permitidos en el desplegable. Se comparan contra lo que llega
// para que nadie inyecte texto arbitrario por ahí.
const URGENCIAS = ['Inmediata (Sprint)', 'Estándar (Pro)', 'Planificación (Enterprise)'];

// ------------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------------

/** ¿La respuesta debe ser JSON? Lo pide contacto.js; un navegador sin JS no. */
function esPeticionAjax(): bool
{
    $acepta = $_SERVER['HTTP_ACCEPT'] ?? '';
    return str_contains($acepta, 'application/json');
}

/** Quita saltos de línea: sin esto, un campo puede inyectar cabeceras extra. */
function unaLinea(string $valor): string
{
    return trim(str_replace(["\r", "\n", "\0"], ' ', $valor));
}

/** Codifica una cabecera con acentos según RFC 2047. */
function cabecera(string $texto): string
{
    return '=?UTF-8?B?' . base64_encode($texto) . '?=';
}

function limpiar(string $campo, int $max): string
{
    $valor = unaLinea((string)($_POST[$campo] ?? ''));
    return mb_substr($valor, 0, $max);
}

/**
 * Tope de solicitudes por IP y hora, guardado en un archivo JSON.
 * Es una defensa simple contra el envío automatizado en bucle; no
 * sustituye a las que pueda poner el servidor por delante.
 */
function superaLimite(string $ip, int $limite, string $rutaAlmacen): bool
{
    if ($limite <= 0) return false;

    $archivo = $rutaAlmacen . '/limite.json';
    $ahora = time();
    $registro = [];

    $fp = @fopen($archivo, 'c+');
    if ($fp === false) return false;   // sin disco escribible, no bloqueamos a nadie

    flock($fp, LOCK_EX);
    $contenido = stream_get_contents($fp);
    if ($contenido !== false && $contenido !== '') {
        $registro = json_decode($contenido, true) ?: [];
    }

    // Sólo interesan los envíos de la última hora.
    foreach ($registro as $clave => $marcas) {
        $registro[$clave] = array_values(array_filter($marcas, fn($t) => $ahora - $t < 3600));
        if (!$registro[$clave]) unset($registro[$clave]);
    }

    $propias = $registro[$ip] ?? [];
    $excedido = count($propias) >= $limite;
    if (!$excedido) {
        $propias[] = $ahora;
        $registro[$ip] = $propias;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($registro));
    flock($fp, LOCK_UN);
    fclose($fp);

    return $excedido;
}

/** Deja constancia de la solicitud aunque el correo no llegue a salir. */
function registrar(array $datos, string $rutaAlmacen, bool $enviado, string $detalle): void
{
    $linea = json_encode([
        'fecha'   => date('c'),
        'ip'      => $_SERVER['REMOTE_ADDR'] ?? '',
        'enviado' => $enviado,
        'detalle' => $detalle,
        'datos'   => $datos,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    @file_put_contents($rutaAlmacen . '/solicitudes.log', $linea . PHP_EOL, FILE_APPEND | LOCK_EX);
}

// ------------------------------------------------------------------
// Cliente SMTP mínimo, hablado a mano sobre sockets.
// Implementa lo justo del protocolo: saludo, STARTTLS, AUTH LOGIN,
// sobre y cuerpo. Lanza RuntimeException con el motivo si algo falla.
// ------------------------------------------------------------------

/** Lee una respuesta del servidor, incluidas las de varias líneas («250-...»). */
function leerRespuesta($conexion): array
{
    $lineas = [];
    while (($linea = fgets($conexion, 515)) !== false) {
        $lineas[] = rtrim($linea, "\r\n");
        // En una respuesta multilínea el 4.º carácter es '-'; en la última, un espacio.
        if (strlen($linea) < 4 || $linea[3] !== '-') break;
    }
    $ultima = end($lineas) ?: '';
    return [(int)substr($ultima, 0, 3), implode(' | ', $lineas)];
}

function ordenSmtp($conexion, string $orden, int $esperado, string $etapa): void
{
    if ($orden !== '') {
        fwrite($conexion, $orden . "\r\n");
    }
    [$codigo, $texto] = leerRespuesta($conexion);
    if ($codigo !== $esperado) {
        throw new RuntimeException("SMTP $etapa: se esperaba $esperado y llegó $codigo ($texto)");
    }
}

function enviarPorSmtp(array $smtp, string $sobreDe, string $sobrePara, string $mensaje): void
{
    if ($smtp['host'] === '' || $smtp['usuario'] === '') {
        throw new RuntimeException('SMTP sin configurar: falta host o usuario');
    }

    $prefijo = $smtp['seguridad'] === 'ssl' ? 'ssl://' : 'tcp://';
    $conexion = @stream_socket_client(
        $prefijo . $smtp['host'] . ':' . $smtp['puerto'],
        $errNo, $errStr, 15, STREAM_CLIENT_CONNECT
    );
    if ($conexion === false) {
        throw new RuntimeException("No se pudo conectar a {$smtp['host']}:{$smtp['puerto']} ($errStr)");
    }
    stream_set_timeout($conexion, 15);

    try {
        ordenSmtp($conexion, '', 220, 'saludo');
        ordenSmtp($conexion, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), 250, 'EHLO');

        if ($smtp['seguridad'] === 'tls') {
            ordenSmtp($conexion, 'STARTTLS', 220, 'STARTTLS');
            if (!stream_socket_enable_crypto($conexion, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('No se pudo negociar TLS');
            }
            // Tras cifrar hay que volver a presentarse.
            ordenSmtp($conexion, 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost'), 250, 'EHLO cifrado');
        }

        ordenSmtp($conexion, 'AUTH LOGIN', 334, 'AUTH');
        ordenSmtp($conexion, base64_encode($smtp['usuario']), 334, 'usuario');
        ordenSmtp($conexion, base64_encode($smtp['contrasena']), 235, 'contraseña');

        ordenSmtp($conexion, "MAIL FROM:<$sobreDe>", 250, 'MAIL FROM');
        ordenSmtp($conexion, "RCPT TO:<$sobrePara>", 250, 'RCPT TO');
        ordenSmtp($conexion, 'DATA', 354, 'DATA');

        // Una línea que empiece por un punto cerraría el mensaje: hay que doblarlo.
        $cuerpo = preg_replace('/^\./m', '..', str_replace("\n", "\r\n", $mensaje));
        fwrite($conexion, $cuerpo . "\r\n.\r\n");
        [$codigo, $texto] = leerRespuesta($conexion);
        if ($codigo !== 250) {
            throw new RuntimeException("SMTP cuerpo: se esperaba 250 y llegó $codigo ($texto)");
        }

        fwrite($conexion, "QUIT\r\n");
    } finally {
        fclose($conexion);
    }
}

// ------------------------------------------------------------------
// Respuesta al navegador
// ------------------------------------------------------------------
function responder(bool $ok, string $mensaje, int $estado = 200): never
{
    if (esPeticionAjax()) {
        http_response_code($estado);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'mensaje' => $mensaje], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Sin JavaScript no hay dónde pintar el aviso, así que lo hacemos aquí.
    http_response_code($estado);
    header('Content-Type: text/html; charset=utf-8');
    $texto  = htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8');
    $titulo = $ok ? 'Solicitud enviada' : 'No pudimos enviarla';
    $color  = $ok ? '#19510A' : '#c0392b';
    echo <<<HTML
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>$titulo | Bytes</title>
        <style>
            body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
                   background:#101820; color:#f5f5f7; text-align:center; padding:24px;
                   font-family:"SF Pro Display","Helvetica Neue",Helvetica,Arial,sans-serif; }
            h1 { font-size:clamp(1.5rem,4vw,2.2rem); margin:0 0 16px; color:$color; }
            p  { color:#a1a1a1; line-height:1.6; margin:0 0 32px; }
            a  { color:#f5f5f7; text-decoration:none; border:1px solid rgba(215,215,214,.25);
                 padding:14px 28px; border-radius:14px; display:inline-block; }
            a:hover { border-color:#19510A; color:#19510A; }
        </style>
    </head>
    <body>
        <div>
            <h1>$titulo</h1>
            <p>$texto</p>
            <a href="index.html">Volver al inicio</a>
        </div>
    </body>
    </html>
    HTML;
    exit;
}

// ------------------------------------------------------------------
// Flujo principal
// ------------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(false, 'Este endpoint sólo acepta envíos del formulario.', 405);
}

if (!is_dir($config['ruta_almacen'])) {
    @mkdir($config['ruta_almacen'], 0775, true);
}

// Trampa antispam: sólo la rellenan los bots, que no ven el campo.
if (trim((string)($_POST['_honey'] ?? '')) !== '') {
    responder(true, 'Gracias, recibimos tu solicitud.');   // al bot le decimos que sí
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

$nombre   = limpiar('Nombre', 100);
$email    = limpiar('email', 150);
$telefono = limpiar('Telefono', 40);
$urgencia = limpiar('Urgencia', 60);
$origen   = limpiar('_origen', 60) ?: 'Sitio web';
$detalles = mb_substr(trim((string)($_POST['Detalles'] ?? '')), 0, 5000);

$errores = [];
if (mb_strlen($nombre) < 2)                            $errores[] = 'el nombre';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))        $errores[] = 'un correo válido';
if (mb_strlen($detalles) < 10)                         $errores[] = 'los detalles del proyecto';
if ($urgencia !== '' && !in_array($urgencia, URGENCIAS, true)) $urgencia = URGENCIAS[0];

if ($errores) {
    // «Necesitamos» vale igual en singular y en plural, así que la frase
    // se arma bien tanto con un error como con varios.
    $lista = count($errores) === 1
        ? $errores[0]
        : implode(', ', array_slice($errores, 0, -1)) . ' y ' . end($errores);
    responder(false, "Necesitamos $lista.", 422);
}

// El cupo se consume sólo con solicitudes bien formadas: si alguien se
// equivoca al escribir su correo, no se queda sin intentos por eso.
if (superaLimite($ip, (int)$config['limite_por_hora'], $config['ruta_almacen'])) {
    responder(false, 'Recibimos varias solicitudes tuyas hace poco. Inténtalo de nuevo en un rato.', 429);
}

$datos = [
    'Nombre'   => $nombre,
    'Correo'   => $email,
    'Teléfono' => $telefono !== '' ? $telefono : '(no indicado)',
    'Urgencia' => $urgencia !== '' ? $urgencia : '(no indicada)',
    'Origen'   => $origen,
    'Detalles' => $detalles,
];

// --- Armado del correo ---
$asunto = cabecera("Nueva solicitud de proyecto — $origen");

$cuerpo = "Nueva solicitud desde el sitio de {$config['nombre_sitio']}.\n\n";
foreach ($datos as $etiqueta => $valor) {
    // str_pad cuenta bytes, y «Teléfono» tiene uno de más que caracteres:
    // alineamos midiendo en caracteres para que la columna quede recta.
    $columna = $etiqueta . ':';
    $relleno = str_repeat(' ', max(1, 11 - mb_strlen($columna)));
    $cuerpo .= $columna . $relleno . $valor . "\n";
}
$cuerpo .= "\n-- \nRecibido el " . date('d/m/Y H:i') . " desde la IP $ip.\n";

$deVisible = cabecera($config['nombre_sitio']) . ' <' . $config['remitente'] . '>';
$cabeceras = [
    'From'                      => $deVisible,
    'Reply-To'                  => cabecera($nombre) . " <$email>",
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
];

// --- Envío ---
$enviado = false;
$detalle = '';

try {
    if ($config['modo'] === 'smtp') {
        $texto = "Subject: $asunto\r\nTo: {$config['destino']}\r\n";
        foreach ($cabeceras as $clave => $valor) {
            $texto .= "$clave: $valor\r\n";
        }
        $texto .= "\r\n" . $cuerpo;

        enviarPorSmtp($config['smtp'], $config['remitente'], $config['destino'], $texto);
        $enviado = true;
        $detalle = 'enviado por SMTP';
    } else {
        $lineas = [];
        foreach ($cabeceras as $clave => $valor) {
            $lineas[] = "$clave: $valor";
        }
        $enviado = mail($config['destino'], $asunto, $cuerpo, implode("\r\n", $lineas));
        $detalle = $enviado ? 'enviado con mail()' : 'mail() devolvió false';
    }
} catch (Throwable $e) {
    $detalle = $e->getMessage();
}

registrar($datos, $config['ruta_almacen'], $enviado, $detalle);

if ($enviado) {
    responder(true, '¡Listo! Recibimos tu solicitud y te respondemos en menos de 24 horas.');
}

// El correo falló, pero la solicitud quedó guardada en el log: no se pierde.
error_log("contacto.php no pudo enviar el correo: $detalle");
responder(false, 'No pudimos enviar tu solicitud ahora mismo. Escríbenos a ' . $config['destino'] . '.', 500);
