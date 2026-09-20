/* =====================================================
   Dedicatoria: abre el regalo y muestra la carta
   ===================================================== */
(() => {
  'use strict';
  const F = window.Flores;
  const $ = (id) => document.getElementById(id);

  const escena = $('escena');
  const sobre = $('sobre');
  const carta = $('carta');
  const vacio = $('vacio');
  const crearTuya = $('crear-tuya');

  /* ---------- leer el regalo del enlace ---------- */
  const q = new URLSearchParams(window.location.search);
  const florPedida = q.get('flor');
  const regalo = {
    para: F.limpiar(q.get('para'), 40),
    de: F.limpiar(q.get('de'), 40),
    msg: F.limpiar(q.get('msg'), 220),
    flor: F.TIPOS_FLOR.includes(florPedida) ? florPedida : 'girasol',
  };

  const hayRegalo = regalo.para || regalo.msg;

  /* ---------- enlace vacío ---------- */
  if (!hayRegalo) {
    sobre.hidden = true;
    vacio.hidden = false;
    escena.classList.add('amanece');
    const flores = F.sembrarPrado($('prado'), {});
    F.florecer(flores);
    F.iniciarPolen($('polen'), escena);
    return;
  }

  /* ---------- rellenar los textos (textContent = a prueba de inyección) ---------- */
  // Portada del regalo
  $('sobre-nombre').textContent = regalo.para || 'ti';
  // Carta
  $('carta-para').textContent = regalo.para ? 'Para' : '';
  $('carta-nombre').textContent = regalo.para || '';
  $('carta-mensaje').textContent = regalo.msg;
  if (regalo.msg) $('carta-mensaje').hidden = false; else $('carta-mensaje').hidden = true;
  if (regalo.de) {
    $('carta-de').textContent = regalo.de;
    $('carta-firma').hidden = false;
  }
  document.title = regalo.para
    ? `Para ${regalo.para} · Flores amarillas`
    : 'Una dedicatoria de flores amarillas';

  // Sembrar el prado ya (oculto hasta abrir)
  const flores = F.sembrarPrado($('prado'), { preferida: regalo.flor });
  const polen = F.iniciarPolen($('polen'), escena);

  /* ---------- abrir el regalo ---------- */
  let abierto = false;
  function abrir() {
    if (abierto) return;
    abierto = true;

    escena.classList.add('amanece');   // sube el sol, se enciende el cielo
    F.florecer(flores);                 // brota el prado en oleada
    sobre.classList.add('se-va');       // se retira la portada del regalo

    // pétalos al abrir
    const caja = escena.getBoundingClientRect();
    if (polen.estallido) {
      polen.estallido(caja.width / 2, caja.height * 0.55);
      setTimeout(() => polen.estallido(caja.width * 0.3, caja.height * 0.5), 200);
      setTimeout(() => polen.estallido(caja.width * 0.7, caja.height * 0.5), 380);
    }

    setTimeout(() => {
      sobre.hidden = true;
      carta.hidden = false;
      requestAnimationFrame(() => carta.classList.add('entra'));
      crearTuya.hidden = false;
      requestAnimationFrame(() => crearTuya.classList.add('visible'));
    }, F.reduce ? 0 : 700);
  }

  $('abrir').addEventListener('click', abrir);

  // Si la persona pidió menos movimiento, mostramos la carta directamente
  if (F.reduce) abrir();
})();
