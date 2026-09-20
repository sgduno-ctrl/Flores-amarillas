/* =====================================================
   Día de las flores amarillas
   1. Flores dibujadas en SVG (girasol, margarita, tulipán)
   2. Jardín de la portada + plantar al tocar
   3. Polen y pétalos en canvas
   4. Flores de la sección "Tres flores"
   5. Dedicatoria y enlace para compartir
   ===================================================== */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TITULO_BASE = document.title;
  const TIPOS_FLOR = ['girasol', 'margarita', 'tulipan'];

  /* ---------- utilidades ---------- */
  const azar = (min, max) => Math.random() * (max - min) + min;
  const elegir = (lista) => lista[Math.floor(Math.random() * lista.length)];

  function svg(nombre, atributos = {}, hijos = []) {
    const el = document.createElementNS(NS, nombre);
    for (const [clave, valor] of Object.entries(atributos)) el.setAttribute(clave, valor);
    hijos.forEach((hijo) => el.appendChild(hijo));
    return el;
  }

  // Punto de una curva de Bézier cúbica (para colocar las hojas sobre el tallo)
  function bezier(t, a, b, c, d) {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  }

  /* =====================================================
     1. FLORES EN SVG
     Todas se dibujan en un lienzo de 200 x 420.
     ===================================================== */
  function petalo(d, angulo, clase, retraso) {
    const trazo = svg('path', { d, class: clase });
    trazo.style.setProperty('--r', retraso.toFixed(2) + 's');
    return svg('g', { transform: `rotate(${angulo.toFixed(1)})` }, [trazo]);
  }

  function cabezaGirasol() {
    const cabeza = svg('g', { class: 'cabeza' });
    const n = 18;
    const paso = 360 / n;
    const forma = 'M0 -22 C 14 -44, 14 -80, 0 -90 C -14 -80, -14 -44, 0 -22Z';
    const atras = svg('g');
    const frente = svg('g');

    for (let i = 0; i < n; i++) {
      atras.appendChild(petalo(forma, i * paso + paso / 2, 'petalo petalo--atras', i * 0.03));
      frente.appendChild(petalo(forma, i * paso, 'petalo petalo--frente', 0.15 + i * 0.03));
    }

    // Centro con semillas en espiral (ángulo áureo)
    const centro = svg('g', { class: 'centro' });
    centro.appendChild(svg('circle', { r: 31, fill: '#3A210E' }));
    centro.appendChild(svg('circle', { r: 27.5, fill: '#5A3417' }));
    for (let i = 1; i <= 70; i++) {
      const radio = 3.05 * Math.sqrt(i);
      const angulo = i * 2.39996;
      centro.appendChild(svg('circle', {
        cx: (radio * Math.cos(angulo)).toFixed(1),
        cy: (radio * Math.sin(angulo)).toFixed(1),
        r: 1.5,
        fill: i % 3 ? '#8C5A2B' : '#2A1508',
      }));
    }

    cabeza.append(atras, frente, centro);
    return cabeza;
  }

  function cabezaMargarita() {
    const cabeza = svg('g', { class: 'cabeza' });
    const n = 14;
    const paso = 360 / n;
    const forma = 'M0 -12 C 18 -22, 16 -60, 0 -66 C -16 -60, -18 -22, 0 -12Z';
    const atras = svg('g');
    const frente = svg('g');

    for (let i = 0; i < n; i++) {
      atras.appendChild(petalo(forma, i * paso + paso / 2, 'petalo petalo--atras', i * 0.035));
      frente.appendChild(petalo(forma, i * paso, 'petalo petalo--frente', 0.15 + i * 0.035));
    }

    const centro = svg('g', { class: 'centro' });
    centro.appendChild(svg('circle', { r: 16, fill: '#E8850F' }));
    centro.appendChild(svg('circle', { r: 13, fill: '#F7B733' }));
    for (let i = 1; i <= 12; i++) {
      const radio = 3.4 * Math.sqrt(i);
      const angulo = i * 2.39996;
      centro.appendChild(svg('circle', {
        cx: (radio * Math.cos(angulo)).toFixed(1),
        cy: (radio * Math.sin(angulo)).toFixed(1),
        r: 1.3,
        fill: '#C8720A',
      }));
    }

    cabeza.append(atras, frente, centro);
    return cabeza;
  }

  function cabezaTulipan() {
    const cabeza = svg('g', { class: 'cabeza cabeza--tulipan' });
    const izquierda = 'M0 34 C -46 30, -52 -28, -40 -72 C -22 -52, -8 -50, 0 -28Z';
    const derecha = 'M0 34 C 46 30, 52 -28, 40 -72 C 22 -52, 8 -50, 0 -28Z';
    const medio = 'M0 36 C -32 32, -34 -30, 0 -86 C 34 -30, 32 32, 0 36Z';

    cabeza.append(
      svg('path', { d: izquierda, class: 'petalo petalo--atras', style: '--r:0s' }),
      svg('path', { d: derecha, class: 'petalo petalo--atras', style: '--r:.1s' }),
      svg('path', { d: medio, class: 'petalo petalo--frente', style: '--r:.2s' })
    );
    return cabeza;
  }

  // fin: altura (en el lienzo) donde termina el tallo · base: desplazamiento de la cabeza
  const TIPOS = {
    girasol:   { cabeza: cabezaGirasol,   fin: 135, base: 0,  hoja: 1.2 },
    margarita: { cabeza: cabezaMargarita, fin: 125, base: 0,  hoja: 1 },
    tulipan:   { cabeza: cabezaTulipan,   fin: 178, base: 34, hoja: 1 },
  };

  function hoja(punto, lado, giro, tam) {
    const forma = svg('path', { d: 'M0 0 C 20 -24, 58 -28, 80 -6 C 58 8, 20 10, 0 0Z', class: 'hoja' });
    const vena = svg('path', { d: 'M4 -1 C 28 -7, 52 -10, 74 -6', class: 'vena' });
    return svg('g', {
      transform: `translate(${punto.x.toFixed(1)} ${punto.y.toFixed(1)}) scale(${lado * tam} ${tam}) rotate(${giro.toFixed(1)})`,
    }, [forma, vena]);
  }

  function crearFlor({ tipo, escala = 1, retraso = 0, x = null, inclinacion = azar(-22, 22), animada = true }) {
    const def = TIPOS[tipo];
    const giro = inclinacion;

    // Tallo: curva de Bézier desde el suelo hasta la cabeza
    const p0 = { x: 100, y: 420 };
    const p1 = { x: 100, y: 340 };
    const p2 = { x: 100 + giro, y: 260 };
    const p3 = { x: 100 + giro, y: def.fin };

    const tallo = svg('path', {
      class: 'tallo',
      pathLength: 1,
      d: `M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    });

    const lado = Math.random() < 0.5 ? 1 : -1;
    const hojas = [0.3, 0.52].map((t, i) => {
      const grupo = hoja(bezier(t, p0, p1, p2, p3), i % 2 ? -lado : lado, azar(-38, -22), def.hoja);
      grupo.style.setProperty('--k', i);
      return grupo;
    });

    const cabeza = svg('g', {
      transform: `translate(${p3.x} ${p3.y}) rotate(${(giro * 0.5).toFixed(1)}) translate(0 ${-def.base})`,
    }, [def.cabeza()]);

    const lienzo = svg('svg', { viewBox: '0 0 200 420', 'aria-hidden': 'true', focusable: 'false' },
      [tallo, ...hojas, cabeza]);

    const flor = document.createElement('div');
    flor.className = `flor flor--${tipo}` + (animada ? ' brota' : '');
    flor.style.setProperty('--e', escala.toFixed(2));
    flor.style.setProperty('--d', retraso.toFixed(2) + 's');
    flor.style.setProperty('--t', azar(4, 7).toFixed(1) + 's');
    flor.style.setProperty('--m', (-azar(0, 6)).toFixed(1) + 's');
    if (x !== null) flor.style.left = x.toFixed(2) + '%';
    flor.appendChild(lienzo);
    return flor;
  }

  /* =====================================================
     2. EL JARDÍN DE LA PORTADA
     ===================================================== */
  const hero = document.getElementById('inicio');
  const jardin = document.getElementById('jardin');

  function tipoAlAzar(preferida) {
    if (preferida && Math.random() < 0.65) return preferida;
    return elegir(['girasol', 'girasol', 'margarita', 'tulipan']);
  }

  function sembrarJardin(preferida) {
    jardin.replaceChildren();
    const cantidad = Math.max(8, Math.min(20, Math.round(window.innerWidth / 85)));

    for (let i = 0; i < cantidad; i++) {
      const pos = (i + 0.5) / cantidad + azar(-0.015, 0.015); // 0 a 1
      const borde = Math.abs(pos - 0.5) * 2;                  // 0 en el centro, 1 en las orillas

      // Las flores del centro son más bajas para no tapar el título
      jardin.appendChild(crearFlor({
        tipo: tipoAlAzar(preferida),
        escala: azar(0.72, 1) * (0.58 + 0.42 * Math.pow(borde, 0.8)),
        retraso: 0.35 + borde * 1.5 + azar(0, 0.3), // florece del centro hacia afuera
        x: pos * 100,
      }));
    }
  }

  function plantar(xPorcentaje) {
    if (jardin.children.length > 60) jardin.firstElementChild.remove();
    jardin.appendChild(crearFlor({
      tipo: elegir(TIPOS_FLOR),
      escala: azar(0.55, 0.9),
      retraso: 0,
      x: xPorcentaje,
    }));
  }

  /* =====================================================
     3. POLEN Y PÉTALOS (canvas)
     ===================================================== */
  let estallido = () => {}; // se reemplaza si hay canvas y no se pidió menos movimiento

  (function iniciarPolen() {
    const lienzo = document.getElementById('polen');
    if (reducirMovimiento || !lienzo || !lienzo.getContext) return;

    const ctx = lienzo.getContext('2d');
    if (!ctx) return;
    const COLORES = ['#FFC629', '#FFD84D', '#FFE58A', '#F2A900'];
    let ancho = 0;
    let alto = 0;
    let visible = true;
    let corriendo = false;
    let ultimo = 0;
    let polen = [];
    let petalos = [];

    function nuevoPolen(alAzar) {
      return {
        x: azar(0, ancho),
        y: alAzar ? azar(0, alto) : alto + 10,
        r: azar(0.8, 2.2),
        vy: azar(0.12, 0.45),
        vx: azar(-0.06, 0.06),
        fase: azar(0, 6.28),
      };
    }

    function nuevoPetalo() {
      return {
        x: azar(0, ancho),
        y: azar(-alto, 0),
        vx: azar(-0.25, 0.25),
        vy: azar(0.4, 0.9),
        rot: azar(0, 6.28),
        vr: azar(-0.02, 0.02),
        tam: azar(5, 9),
        fase: azar(0, 6.28),
        color: elegir(COLORES),
        vida: null, // null = petalo ambiental, sin fin
      };
    }

    function ajustar() {
      const caja = hero.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = caja.width;
      alto = caja.height;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cantidad = Math.round(Math.min(70, (ancho * alto) / 18000));
      polen = Array.from({ length: cantidad }, () => nuevoPolen(true));
      petalos = petalos.filter((p) => p.vida !== null);
      for (let i = 0; i < 9; i++) petalos.push(nuevoPetalo());
    }

    function dibujarPetalo(p, t) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(t / 600 + p.fase)));
      ctx.globalAlpha = p.vida === null ? 0.85 : Math.max(0, p.vida);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.tam * 0.45, p.tam, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function cuadro(t) {
      if (!visible || document.hidden) { corriendo = false; return; }

      const k = Math.min(48, ultimo ? t - ultimo : 16.7) / 16.7;
      ultimo = t;
      ctx.clearRect(0, 0, ancho, alto);

      // Polen: puntos dorados que suben con un halo suave
      ctx.globalCompositeOperation = 'lighter';
      for (const p of polen) {
        p.y -= p.vy * k;
        p.x += (Math.sin(t / 1200 + p.fase) * 0.25 + p.vx) * k;
        if (p.y < -10) { p.y = alto + 10; p.x = azar(0, ancho); }
        const brillo = 0.35 + 0.35 * Math.sin(t / 700 + p.fase * 3);
        ctx.fillStyle = `rgba(255, 214, 90, ${(brillo * 0.25).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255, 240, 170, ${brillo.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Pétalos: los ambientales caen siempre; los de estallido se apagan
      for (let i = petalos.length - 1; i >= 0; i--) {
        const p = petalos[i];
        p.x += (p.vx + Math.sin(t / 900 + p.fase) * 0.35) * k;
        p.y += p.vy * k;
        p.rot += p.vr * k;

        if (p.vida !== null) {
          p.vy += 0.05 * k;
          p.vida -= 0.011 * k;
          if (p.vida <= 0) { petalos.splice(i, 1); continue; }
        } else if (p.y > alto + 20) {
          p.y = -20;
          p.x = azar(0, ancho);
        }
        dibujarPetalo(p, t);
      }

      requestAnimationFrame(cuadro);
    }

    function arrancar() {
      if (corriendo || !visible || document.hidden) return;
      corriendo = true;
      ultimo = 0;
      requestAnimationFrame(cuadro);
    }

    estallido = (x, y) => {
      for (let i = 0; i < 12; i++) {
        const angulo = azar(0, 6.283);
        const fuerza = azar(1.2, 3.2);
        petalos.push({
          x, y,
          vx: Math.cos(angulo) * fuerza,
          vy: Math.sin(angulo) * fuerza - 1.5,
          rot: azar(0, 6.28),
          vr: azar(-0.15, 0.15),
          tam: azar(5, 9),
          fase: azar(0, 6.28),
          color: elegir(COLORES),
          vida: 1,
        });
      }
      arrancar();
    };

    new ResizeObserver(ajustar).observe(hero);
    new IntersectionObserver((entradas) => {
      visible = entradas[0].isIntersecting;
      arrancar();
    }).observe(hero);
    document.addEventListener('visibilitychange', arrancar);

    ajustar();
    arrancar();
  })();

  /* ---------- interacción: tocar el jardín ---------- */
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, textarea, select, label, .dedicatoria')) return;
    const caja = hero.getBoundingClientRect();
    plantar(((e.clientX - caja.left) / caja.width) * 100);
    estallido(e.clientX - caja.left, e.clientY - caja.top);
  });

  document.getElementById('plantar').addEventListener('click', () => {
    const caja = hero.getBoundingClientRect();
    const x = azar(8, 92);
    plantar(x);
    estallido((x / 100) * caja.width, caja.height * 0.7);
  });

  /* =====================================================
     4. LAS TRES FLORES DE LA SECCIÓN
     Florecen cuando llegan a la pantalla y se repiten al tocarlas.
     ===================================================== */
  document.querySelectorAll('[data-vitrina]').forEach((contenedor) => {
    const flor = crearFlor({
      tipo: contenedor.dataset.vitrina,
      inclinacion: azar(-10, 10),
      animada: false,
    });
    flor.classList.add('oculta');
    contenedor.appendChild(flor);

    const florecer = () => {
      flor.classList.remove('oculta', 'brota');
      void flor.offsetWidth; // reinicia la animación
      flor.classList.add('brota');
    };

    const vigia = new IntersectionObserver((entradas) => {
      if (entradas[0].isIntersecting) { florecer(); vigia.disconnect(); }
    }, { threshold: 0.5 });
    vigia.observe(contenedor);

    contenedor.addEventListener('click', florecer);
  });

  /* =====================================================
     5. DEDICATORIA Y ENLACE PARA COMPARTIR
     El regalo viaja en la dirección: ?para=Ana&de=Luis&msg=...&flor=girasol
     ===================================================== */
  const limpiar = (texto, max) => (texto || '').replace(/\s+/g, ' ').trim().slice(0, max);

  function leerParametros() {
    const q = new URLSearchParams(window.location.search);
    const flor = q.get('flor');
    return {
      para: limpiar(q.get('para'), 40),
      de: limpiar(q.get('de'), 40),
      msg: limpiar(q.get('msg'), 160),
      flor: TIPOS_FLOR.includes(flor) ? flor : '',
    };
  }

  function mostrarDedicatoria({ para, de, msg }) {
    const caja = document.getElementById('dedicatoria');
    if (!para && !de && !msg) {
      caja.hidden = true;
      document.title = TITULO_BASE;
      return;
    }
    // textContent (nunca innerHTML) para que nadie pueda inyectar código en el enlace
    document.getElementById('ded-para').textContent = para ? `Para ${para}` : '';
    document.getElementById('ded-msg').textContent = msg;
    document.getElementById('ded-de').textContent = de ? `De parte de ${de}` : '';
    caja.hidden = false;
    document.title = para ? `Para ${para} · Día de las flores amarillas` : TITULO_BASE;
  }

  const form = document.getElementById('form-regalo');
  const campoMensaje = document.getElementById('msg');
  const contador = document.getElementById('contador');
  const estado = document.getElementById('estado');
  const resultado = document.getElementById('resultado');
  const enlace = document.getElementById('enlace');
  const botonCompartir = document.getElementById('compartir');
  let ultimoRegalo = null;

  campoMensaje.addEventListener('input', () => {
    contador.textContent = `${campoMensaje.value.length} / 160`;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const regalo = {
      para: limpiar(datos.get('para'), 40),
      de: limpiar(datos.get('de'), 40),
      msg: limpiar(datos.get('msg'), 160),
      flor: TIPOS_FLOR.includes(datos.get('flor')) ? datos.get('flor') : 'girasol',
    };

    if (!regalo.para && !regalo.msg) {
      estado.textContent = 'Escribe al menos un nombre o un mensaje para crear el enlace.';
      resultado.hidden = true;
      return;
    }

    const params = new URLSearchParams();
    if (regalo.para) params.set('para', regalo.para);
    if (regalo.de) params.set('de', regalo.de);
    if (regalo.msg) params.set('msg', regalo.msg);
    params.set('flor', regalo.flor);

    const url = new URL(window.location.href);
    url.search = params.toString();
    url.hash = '';

    ultimoRegalo = regalo;
    enlace.value = url.toString();
    resultado.hidden = false;
    estado.textContent = 'Listo. Copia el enlace o mira cómo se ve tu regalo.';
  });

  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      try {
        enlace.select();
        return document.execCommand('copy');
      } catch {
        return false;
      }
    }
  }

  document.getElementById('copiar').addEventListener('click', async () => {
    const ok = await copiar(enlace.value);
    estado.textContent = ok
      ? 'Enlace copiado.'
      : 'No se pudo copiar solo. Selecciona el enlace y cópialo a mano.';
  });

  if (navigator.share) {
    botonCompartir.hidden = false;
    botonCompartir.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: 'Día de las flores amarillas',
          text: 'Te regalo una flor amarilla 🌼',
          url: enlace.value,
        });
      } catch { /* la persona cerró el menú de compartir */ }
    });
  }

  document.getElementById('ver').addEventListener('click', () => {
    if (!ultimoRegalo) return;
    mostrarDedicatoria(ultimoRegalo);
    sembrarJardin(ultimoRegalo.flor);
    window.scrollTo({ top: 0, behavior: reducirMovimiento ? 'auto' : 'smooth' });
  });

  /* ---------- arranque ---------- */
  const inicial = leerParametros();
  mostrarDedicatoria(inicial);
  sembrarJardin(inicial.flor);
})();
