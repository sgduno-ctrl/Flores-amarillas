/* =====================================================
   Portada: compone la dedicatoria y crea el enlace
   ===================================================== */
(() => {
  'use strict';
  const F = window.Flores;
  const $ = (id) => document.getElementById(id);

  /* ---------- prado de la portada ---------- */
  const escena = document.querySelector('.escena--inicio');
  const pradoInicio = $('prado-inicio');
  const flores = F.sembrarPrado(pradoInicio, { preferida: 'girasol' });
  requestAnimationFrame(() => {
    escena.classList.add('amanece');
    F.florecer(flores);
  });
  F.iniciarPolen($('polen'), escena);

  /* ---------- prado pequeño de la vista previa ---------- */
  const tarjetaPrado = $('tarjeta-prado');
  function pintarPreview(tipo) {
    tarjetaPrado.replaceChildren();
    const posiciones = [18, 50, 82];
    posiciones.forEach((x, i) => {
      const flor = F.crearFlor({ tipo, x, escala: i === 1 ? 1 : 0.8, inclinacion: (i - 1) * 8, animada: !F.reduce });
      flor.style.position = 'absolute';
      flor.style.bottom = (i === 1 ? -2 : 4) + '%';
      flor.style.transform = 'translateX(-50%)';
      tarjetaPrado.appendChild(flor);
    });
  }

  /* ---------- campos y vista previa en vivo ---------- */
  const para = $('para'), de = $('de'), msg = $('msg');
  const pvPara = $('pv-para'), pvNombre = $('pv-nombre'), pvMensaje = $('pv-mensaje'), pvDe = $('pv-de');
  const contador = $('contador');
  let florActual = 'girasol';

  function florElegida() {
    return (document.querySelector('input[name="flor"]:checked') || {}).value || 'girasol';
  }

  function refrescarPreview() {
    const n = F.limpiar(para.value, 40);
    const m = F.limpiar(msg.value, 220);
    const d = F.limpiar(de.value, 40);
    pvNombre.textContent = n || 'alguien especial';
    pvMensaje.textContent = m || 'Tu mensaje aparecerá aquí…';
    if (d) { pvDe.textContent = 'con cariño, ' + d; pvDe.hidden = false; }
    else { pvDe.hidden = true; }
    contador.textContent = `${msg.value.length} / 220`;
  }

  [para, de, msg].forEach((c) => c.addEventListener('input', refrescarPreview));
  document.querySelectorAll('input[name="flor"]').forEach((r) =>
    r.addEventListener('change', () => { florActual = florElegida(); pintarPreview(florActual); }));

  pintarPreview(florActual);
  refrescarPreview();

  /* ---------- crear el enlace ---------- */
  const form = $('form'), estado = $('estado'), resultado = $('resultado');
  const enlace = $('enlace'), abrirRegalo = $('abrir-regalo'), compartir = $('compartir');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = {
      para: F.limpiar(para.value, 40),
      de: F.limpiar(de.value, 40),
      msg: F.limpiar(msg.value, 220),
      flor: F.TIPOS_FLOR.includes(florElegida()) ? florElegida() : 'girasol',
    };

    if (!datos.para && !datos.msg) {
      estado.textContent = 'Escribe al menos un nombre o un mensaje.';
      resultado.hidden = true;
      return;
    }

    const params = new URLSearchParams();
    if (datos.para) params.set('para', datos.para);
    if (datos.de) params.set('de', datos.de);
    if (datos.msg) params.set('msg', datos.msg);
    params.set('flor', datos.flor);

    // Enlace a dedicatoria.html en la misma carpeta (sirve en GitHub Pages y en local)
    const url = new URL('dedicatoria.html', window.location.href);
    url.search = params.toString();

    enlace.value = url.toString();
    abrirRegalo.href = url.toString();
    resultado.hidden = false;
    estado.textContent = 'Listo. Copia el enlace o ábrelo para verlo.';
    if (resultado.scrollIntoView) resultado.scrollIntoView({ behavior: F.reduce ? 'auto' : 'smooth', block: 'nearest' });
  });

  /* ---------- copiar y compartir ---------- */
  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); return true; }
    catch {
      try { enlace.select(); return document.execCommand('copy'); }
      catch { return false; }
    }
  }

  $('copiar').addEventListener('click', async () => {
    const ok = await copiar(enlace.value);
    estado.textContent = ok ? 'Enlace copiado.' : 'Selecciona el enlace y cópialo a mano.';
  });

  if (navigator.share) {
    compartir.hidden = false;
    compartir.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'Día de las flores amarillas',
          text: 'Te regalo unas flores amarillas 🌼',
          url: enlace.value,
        });
      } catch { /* la persona cerró el diálogo */ }
    });
  }
})();
