/* =====================================================
   Motor de flores (compartido por las dos páginas)
   Expone window.Flores con:
     crearFlor, sembrarPrado, iniciarPolen,
     TIPOS_FLOR, limpiar, reduce
   ===================================================== */
window.Flores = (() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TIPOS_FLOR = ['girasol', 'margarita', 'tulipan'];

  const azar = (a, b) => Math.random() * (b - a) + a;
  const elegir = (a) => a[Math.floor(Math.random() * a.length)];
  const limpiar = (t, m) => (t || '').replace(/\s+/g, ' ').trim().slice(0, m);

  function svg(nombre, attrs = {}, hijos = []) {
    const el = document.createElementNS(NS, nombre);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    hijos.forEach((h) => el.appendChild(h));
    return el;
  }

  // Punto de una curva Bézier cúbica (para posar las hojas sobre el tallo)
  function bezier(t, a, b, c, d) {
    const u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
    };
  }

  /* ---------- cabezas de las flores ---------- */
  function petalo(d, angulo, clase, retraso) {
    const trazo = svg('path', { d, class: clase });
    trazo.style.setProperty('--r', retraso.toFixed(2) + 's');
    return svg('g', { transform: `rotate(${angulo.toFixed(1)})` }, [trazo]);
  }

  function cabezaGirasol() {
    const cabeza = svg('g', { class: 'cabeza' });
    const n = 20;
    const paso = 360 / n;
    const forma = 'M0 -20 C 13 -42, 13 -80, 0 -92 C -13 -80, -13 -42, 0 -20Z';
    const atras = svg('g');
    const frente = svg('g');
    for (let i = 0; i < n; i++) {
      atras.appendChild(petalo(forma, i * paso + paso / 2, 'petalo petalo--atras', i * 0.025));
      frente.appendChild(petalo(forma, i * paso, 'petalo petalo--frente', 0.12 + i * 0.025));
    }
    const centro = svg('g', { class: 'centro' });
    centro.appendChild(svg('circle', { r: 32, fill: '#3A210E' }));
    centro.appendChild(svg('circle', { r: 28, fill: '#5A3417' }));
    for (let i = 1; i <= 90; i++) {
      const radio = 2.95 * Math.sqrt(i);
      const a = i * 2.39996;
      centro.appendChild(svg('circle', {
        cx: (radio * Math.cos(a)).toFixed(1),
        cy: (radio * Math.sin(a)).toFixed(1),
        r: 1.5, fill: i % 3 ? '#8C5A2B' : '#2A1508',
      }));
    }
    cabeza.append(atras, frente, centro);
    return cabeza;
  }

  function cabezaMargarita() {
    const cabeza = svg('g', { class: 'cabeza' });
    const n = 15;
    const paso = 360 / n;
    const forma = 'M0 -10 C 16 -20, 15 -58, 0 -66 C -15 -58, -16 -20, 0 -10Z';
    const atras = svg('g');
    const frente = svg('g');
    for (let i = 0; i < n; i++) {
      atras.appendChild(petalo(forma, i * paso + paso / 2, 'petalo petalo--atras', i * 0.03));
      frente.appendChild(petalo(forma, i * paso, 'petalo petalo--frente', 0.12 + i * 0.03));
    }
    const centro = svg('g', { class: 'centro' });
    centro.appendChild(svg('circle', { r: 17, fill: '#E8850F' }));
    centro.appendChild(svg('circle', { r: 13, fill: '#F7B733' }));
    for (let i = 1; i <= 16; i++) {
      const radio = 3.3 * Math.sqrt(i);
      const a = i * 2.39996;
      centro.appendChild(svg('circle', {
        cx: (radio * Math.cos(a)).toFixed(1),
        cy: (radio * Math.sin(a)).toFixed(1),
        r: 1.3, fill: '#C8720A',
      }));
    }
    cabeza.append(atras, frente, centro);
    return cabeza;
  }

  function cabezaTulipan() {
    const cabeza = svg('g', { class: 'cabeza cabeza--tulipan' });
    const izq = 'M0 34 C -46 30, -52 -28, -40 -74 C -22 -52, -8 -50, 0 -28Z';
    const der = 'M0 34 C 46 30, 52 -28, 40 -74 C 22 -52, 8 -50, 0 -28Z';
    const medio = 'M0 36 C -32 32, -34 -30, 0 -88 C 34 -30, 32 32, 0 36Z';
    cabeza.append(
      svg('path', { d: izq, class: 'petalo petalo--atras', style: '--r:0s' }),
      svg('path', { d: der, class: 'petalo petalo--atras', style: '--r:.1s' }),
      svg('path', { d: medio, class: 'petalo petalo--frente', style: '--r:.2s' })
    );
    return cabeza;
  }

  // fin: altura del lienzo donde acaba el tallo · base: cuánto sube la cabeza
  const TIPOS = {
    girasol:   { cabeza: cabezaGirasol,   fin: 138, base: 0,  hoja: 1.25 },
    margarita: { cabeza: cabezaMargarita, fin: 128, base: 0,  hoja: 1.05 },
    tulipan:   { cabeza: cabezaTulipan,   fin: 182, base: 34, hoja: 1.05 },
  };

  function hoja(p, lado, giro, tam, k) {
    const forma = svg('path', { d: 'M0 0 C 20 -24, 58 -28, 80 -6 C 58 8, 20 10, 0 0Z', class: 'hoja' });
    const vena = svg('path', { d: 'M4 -1 C 28 -7, 52 -10, 74 -6', class: 'vena' });
    const g = svg('g', {
      transform: `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${lado * tam} ${tam}) rotate(${giro.toFixed(1)})`,
    }, [forma, vena]);
    g.style.setProperty('--k', k);
    return g;
  }

  /* ---------- una flor completa ---------- */
  function crearFlor(opciones = {}) {
    const {
      tipo = 'girasol',
      escala = 1,
      x = null,
      inclinacion = azar(-20, 20),
      retraso = 0,
      animada = false,
      semilla = false,
    } = opciones;

    const def = TIPOS[tipo] || TIPOS.girasol;
    const giro = inclinacion;

    const p0 = { x: 100, y: 420 };
    const p1 = { x: 100, y: 336 };
    const p2 = { x: 100 + giro, y: 256 };
    const p3 = { x: 100 + giro, y: def.fin };

    const tallo = svg('path', {
      class: 'tallo', pathLength: 1,
      d: `M${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    });

    const lado = Math.random() < 0.5 ? 1 : -1;
    const hojas = [0.32, 0.55].map((t, i) =>
      hoja(bezier(t, p0, p1, p2, p3), i % 2 ? -lado : lado, azar(-38, -22), def.hoja, i));

    const cabeza = svg('g', {
      transform: `translate(${p3.x} ${p3.y}) rotate(${(giro * 0.5).toFixed(1)}) translate(0 ${-def.base})`,
    }, [def.cabeza()]);

    const lienzo = svg('svg', { viewBox: '0 0 200 420', 'aria-hidden': 'true', focusable: 'false' },
      [tallo, ...hojas, cabeza]);

    const flor = document.createElement('div');
    flor.className = `flor flor--${tipo}`
      + (animada ? ' brota' : '')
      + (semilla ? ' semilla' : '');
    flor.style.setProperty('--e', escala.toFixed(2));
    flor.style.setProperty('--d', retraso.toFixed(2) + 's');
    flor.style.setProperty('--t', azar(4.5, 7.5).toFixed(1) + 's');
    flor.style.setProperty('--m', (-azar(0, 6)).toFixed(1) + 's');
    if (x !== null) flor.style.left = x.toFixed(2) + '%';
    flor.appendChild(lienzo);
    return flor;
  }

  /* ---------- un prado con profundidad ----------
     Devuelve las flores. Nacen con la clase "semilla" (ocultas);
     llama a florecer() sobre ellas para que broten en oleada.  */
  function sembrarPrado(cont, { preferida = null } = {}) {
    cont.replaceChildren();
    const ancho = cont.clientWidth || window.innerWidth || 1000;
    const base = Math.max(7, Math.min(15, Math.round(ancho / 120)));

    const filas = [
      { n: Math.round(base * 0.75), lejos: true,  e: [0.5, 0.72], y: [7, 13], z: 1 },
      { n: base,                    lejos: false, e: [0.82, 1.12], y: [-1, 4], z: 3 },
    ];

    const flores = [];
    filas.forEach((f) => {
      for (let i = 0; i < f.n; i++) {
        const pos = (i + azar(0.15, 0.85)) / f.n;
        const flor = crearFlor({
          tipo: preferida && Math.random() < 0.6 ? preferida : elegir(['girasol', 'girasol', 'margarita', 'tulipan']),
          escala: azar(f.e[0], f.e[1]),
          x: pos * 100,
          inclinacion: azar(-15, 15),
          semilla: !reduce,
        });
        flor.style.bottom = azar(f.y[0], f.y[1]).toFixed(1) + 'svh';
        flor.style.zIndex = f.z;
        flor.style.setProperty('--d', (0.15 + pos * 1.3 + azar(0, 0.25)).toFixed(2) + 's');
        if (f.lejos) flor.classList.add('lejos');
        cont.appendChild(flor);
        flores.push(flor);
      }
    });
    return flores;
  }

  function florecer(flores) {
    if (reduce) return;
    flores.forEach((flor) => {
      flor.classList.remove('semilla');
      flor.classList.add('brota');
    });
  }

  /* =====================================================
     POLEN Y PÉTALOS (canvas)
     Devuelve { estallido(x,y), arrancar() }
     ===================================================== */
  function iniciarPolen(lienzo, host) {
    if (reduce || !lienzo || !lienzo.getContext) return { estallido() {}, arrancar() {} };
    const ctx = lienzo.getContext('2d');
    if (!ctx) return { estallido() {}, arrancar() {} };

    const COLORES = ['#FFC220', '#FFD256', '#FFE8A0', '#F5A623'];
    let ancho = 0, alto = 0, visible = true, corriendo = false, ultimo = 0;
    let polen = [], petalos = [];

    const nuevoPolen = () => ({
      x: azar(0, ancho), y: azar(0, alto),
      r: azar(0.8, 2.2), vy: azar(0.1, 0.4), vx: azar(-0.06, 0.06), fase: azar(0, 6.28),
    });
    const nuevoPetalo = () => ({
      x: azar(0, ancho), y: azar(-alto, 0),
      vx: azar(-0.25, 0.25), vy: azar(0.35, 0.85),
      rot: azar(0, 6.28), vr: azar(-0.02, 0.02),
      tam: azar(5, 9), fase: azar(0, 6.28), color: elegir(COLORES), vida: null,
    });

    function ajustar() {
      const caja = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = caja.width; alto = caja.height;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      polen = Array.from({ length: Math.round(Math.min(80, ancho * alto / 16000)) }, nuevoPolen);
      petalos = petalos.filter((p) => p.vida !== null);
      for (let i = 0; i < 10; i++) petalos.push(nuevoPetalo());
    }

    function dibujarPetalo(p, t) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(t / 600 + p.fase)));
      ctx.globalAlpha = p.vida === null ? 0.85 : Math.max(0, p.vida);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.tam * 0.45, p.tam, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }

    function cuadro(t) {
      if (!visible || document.hidden) { corriendo = false; return; }
      const k = Math.min(48, ultimo ? t - ultimo : 16.7) / 16.7;
      ultimo = t;
      ctx.clearRect(0, 0, ancho, alto);

      ctx.globalCompositeOperation = 'lighter';
      for (const p of polen) {
        p.y -= p.vy * k;
        p.x += (Math.sin(t / 1200 + p.fase) * 0.25 + p.vx) * k;
        if (p.y < -10) { p.y = alto + 10; p.x = azar(0, ancho); }
        const brillo = 0.35 + 0.35 * Math.sin(t / 700 + p.fase * 3);
        ctx.fillStyle = `rgba(255, 216, 96, ${(brillo * 0.22).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, 6.283); ctx.fill();
        ctx.fillStyle = `rgba(255, 244, 180, ${brillo.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';

      for (let i = petalos.length - 1; i >= 0; i--) {
        const p = petalos[i];
        p.x += (p.vx + Math.sin(t / 900 + p.fase) * 0.35) * k;
        p.y += p.vy * k;
        p.rot += p.vr * k;
        if (p.vida !== null) {
          p.vy += 0.05 * k; p.vida -= 0.01 * k;
          if (p.vida <= 0) { petalos.splice(i, 1); continue; }
        } else if (p.y > alto + 20) { p.y = -20; p.x = azar(0, ancho); }
        dibujarPetalo(p, t);
      }
      requestAnimationFrame(cuadro);
    }

    function arrancar() {
      if (corriendo || !visible || document.hidden) return;
      corriendo = true; ultimo = 0;
      requestAnimationFrame(cuadro);
    }

    function estallido(x, y) {
      for (let i = 0; i < 16; i++) {
        const a = azar(0, 6.283), fuerza = azar(1.2, 3.4);
        petalos.push({
          x, y, vx: Math.cos(a) * fuerza, vy: Math.sin(a) * fuerza - 1.6,
          rot: azar(0, 6.28), vr: azar(-0.15, 0.15), tam: azar(5, 9),
          fase: azar(0, 6.28), color: elegir(COLORES), vida: 1,
        });
      }
      arrancar();
    }

    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(host);
    else window.addEventListener('resize', ajustar);
    if (window.IntersectionObserver) {
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; arrancar(); }).observe(host);
    }
    document.addEventListener('visibilitychange', arrancar);

    ajustar();
    arrancar();
    return { estallido, arrancar };
  }

  return { crearFlor, sembrarPrado, florecer, iniciarPolen, TIPOS_FLOR, limpiar, reduce };
})();
