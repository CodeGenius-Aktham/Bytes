# Almacén

`contacto.php` escribe aquí:

- `solicitudes.log` — una línea JSON por solicitud recibida, se haya podido
  enviar el correo o no. Es la red de seguridad: si el envío falla, los datos
  siguen estando acá.
- `limite.json` — marcas de tiempo por IP, para el tope de solicitudes por hora.

Los dos están en `.gitignore`.

**Esta carpeta no puede quedar expuesta en el navegador.** El `.htaccess` la
bloquea en Apache. Si tu servidor es nginx, el `.htaccess` se ignora y hay que
añadir la regla a mano:

```nginx
location ^~ /almacen/ { deny all; }
```
