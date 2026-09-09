/**
 * Configuración del respaldo en Google Sheets.
 *
 * Complete estos valores con los datos de su implementación (ver respaldo/README.md)
 * y vuelva a publicar el sitio. Mientras "activo" sea false, la aplicación
 * funciona exactamente igual que antes y no intenta ningún envío.
 *
 * Advertencia: este archivo se publica junto con el sitio, así que la dirección y
 * el token quedan a la vista de cualquiera que lea el código. El token evita
 * envíos accidentales de rastreadores automáticos, no a una persona decidida.
 * La protección real es que el script solo agrega y actualiza informes por su
 * identificador, nunca borra, y que la hoja de cálculo se mantiene privada.
 */
window.PNLQ_RESPALDO = {
  // Ponga en true una vez que la hoja y el Apps Script estén publicados.
  activo: false,

  // Dirección de la aplicación web del Apps Script (termina en /exec).
  url: '',

  // Debe coincidir con la constante TOKEN del archivo Codigo.gs.
  token: '',

  // Cada cuántos minutos se intenta enviar lo que quedó pendiente.
  autoMinutos: 3
};
