'use strict';

/* ──────────────────────────────────────────────
   CONSTANTES Y ESTADO GLOBAL
   ────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const colors = [
  '#2f8a67','#d29a4f','#6b78b1','#b67688',
  '#497e98','#a36c53','#86a852','#926eaa',
  '#308d8c','#cf8261','#667ab0','#bead45',
  '#6b9f83','#b179a4','#d4954a','#6b8c9c'
];

// Estado central — fuente única de verdad para ambos microscopios
const S = {
  // Selección múltiple: layers y heads son Sets
  layers: new Set([0]),
  heads:  new Set([0]),
  // Para vista single, la capa/cabeza "activa" (inspectora)
  layer: 0,
  head:  0,
  seq:   0,
  t:     0,
  dims:  [0, 1, 2],
  mode:  'single',
  agent: 'equipo',
  // Controles 2D
  rx: -.45, ry: .65, zoom: 1, playing: null,
  // Bandera para saber si el 3D está listo
  plotlyReady: false
};

let manifest, Z, A, clickTargets = [], hist = [];

/* ──────────────────────────────────────────────
   ACCESORES DE DATOS
   ────────────────────────────────────────────── */
function val(t, n, l, h, j) {
  return Z[((((t * 128 + n) * 4 + l) * 4 + h) * 16 + j)];
}
function att(t, n, l, h, k) {
  return A[((((t * 128 + n) * 4 + l) * 4 + h) * 8 + k)];
}
function metric(l, h, t) {
  return manifest.metrics.find(x => +x.step === manifest.steps[t] && +x.layer === l && +x.head === h);
}
const fmt = x => Number(x).toFixed(4);

/* ──────────────────────────────────────────────
   PERSISTENCIA
   ────────────────────────────────────────────── */
function persist() {
  try {
    localStorage.setItem('janus.selection.v2', JSON.stringify({
      layers: [...S.layers], heads: [...S.heads],
      layer: S.layer, head: S.head,
      seq: S.seq, t: S.t, dims: S.dims, mode: S.mode
    }));
  } catch(e) {}
}

function loadPersisted() {
  try {
    const s = JSON.parse(localStorage.getItem('janus.selection.v2'));
    if (!s) return;
    if (Array.isArray(s.layers)) S.layers = new Set(s.layers.filter(x => x >= 0 && x < 4));
    if (Array.isArray(s.heads))  S.heads  = new Set(s.heads.filter(x => x >= 0 && x < 4));
    if (Number.isInteger(s.layer) && s.layer >= 0 && s.layer < 4) S.layer = s.layer;
    if (Number.isInteger(s.head)  && s.head  >= 0 && s.head  < 4) S.head  = s.head;
    if (Number.isInteger(s.seq)   && s.seq   >= 0 && s.seq   < 128) S.seq  = s.seq;
    if (Number.isInteger(s.t)     && s.t     >= 0 && s.t     < 13)  S.t    = s.t;
    if (Array.isArray(s.dims) && s.dims.length === 3 &&
        s.dims.every(x => Number.isInteger(x) && x >= 0 && x < 16) &&
        new Set(s.dims).size === 3) S.dims = s.dims;
    if (['single','layer','global'].includes(s.mode)) S.mode = s.mode;
    // Asegurar que layer/head activos estén en los sets
    S.layers.add(S.layer);
    S.heads.add(S.head);
    if (S.layers.size === 0) S.layers.add(0);
    if (S.heads.size  === 0) S.heads.add(0);
  } catch(e) {}
}

/* ──────────────────────────────────────────────
   CARGA DE BINARIOS CON VERIFICACIÓN DE INTEGRIDAD
   ────────────────────────────────────────────── */
async function bytes(path, hash) {
  const r = await fetch(path);
  if (!r.ok) throw Error('Falta ' + path);
  const b = await r.arrayBuffer();
  if (crypto.subtle) {
    const x   = await crypto.subtle.digest('SHA-256', b);
    const got = [...new Uint8Array(x)].map(v => v.toString(16).padStart(2,'0')).join('');
    if (got !== hash) throw Error('Integridad incorrecta ' + path);
  }
  return b;
}

/* ──────────────────────────────────────────────
   INICIALIZACIÓN DE CONTROLES
   ────────────────────────────────────────────── */
function initSelects() {
  // Selector de secuencia (sigue siendo individual)
  for (let i = 0; i < 128; i++)
    $('sequence').add(new Option(manifest.sequence_ids[i], i));

  // Dimensiones (siguen siendo individuales — representan ejes únicos)
  for (const id of ['dimX','dimY','dimZ'])
    for (let j = 0; j < 16; j++)
      $(id).add(new Option('d' + String(j).padStart(2,'0'), j));

  // Construir checkboxes de capas (0-3)
  const layerGroup = $('layerGroup');
  if (layerGroup) {
    for (let i = 0; i < 4; i++) {
      const label = document.createElement('label');
      label.className = 'cb-label';
      label.innerHTML = `<input type="checkbox" name="layer" value="${i}" ${i === 0 ? 'checked' : ''}> Capa ${i}`;
      layerGroup.appendChild(label);
    }
    // Botones seleccionar todo / ninguno
    $('layerAll')  && ($('layerAll').onclick  = () => setAllLayers(true));
    $('layerNone') && ($('layerNone').onclick = () => setAllLayers(false));
  }

  // Construir checkboxes de cabezas (0-3)
  const headGroup = $('headGroup');
  if (headGroup) {
    for (let i = 0; i < 4; i++) {
      const label = document.createElement('label');
      label.className = 'cb-label';
      label.innerHTML = `<input type="checkbox" name="head" value="${i}" ${i === 0 ? 'checked' : ''}> H${i}`;
      headGroup.appendChild(label);
    }
    $('headAll')  && ($('headAll').onclick  = () => setAllHeads(true));
    $('headNone') && ($('headNone').onclick = () => setAllHeads(false));
  }
}

function setAllLayers(checked) {
  const boxes = document.querySelectorAll('input[name="layer"]');
  boxes.forEach(b => b.checked = checked);
  if (checked) {
    S.layers = new Set([0,1,2,3]);
  } else {
    // Siempre mantener al menos la capa activa
    S.layers = new Set([S.layer]);
    document.querySelector(`input[name="layer"][value="${S.layer}"]`).checked = true;
  }
  sync();
}

function setAllHeads(checked) {
  const boxes = document.querySelectorAll('input[name="head"]');
  boxes.forEach(b => b.checked = checked);
  if (checked) {
    S.heads = new Set([0,1,2,3]);
  } else {
    S.heads = new Set([S.head]);
    document.querySelector(`input[name="head"][value="${S.head}"]`).checked = true;
  }
  sync();
}

/* ──────────────────────────────────────────────
   CABEZAS ACTIVAS PARA RENDERIZADO
   ────────────────────────────────────────────── */
function curheads() {
  if (S.mode === 'global') return Array.from({length:16}, (_,i) => [Math.floor(i/4), i%4]);
  if (S.mode === 'layer')  return [...S.layers].sort().flatMap(l => [...S.heads].sort().map(h => [l, h]));
  // single: producto de layers × heads seleccionadas
  return [...S.layers].sort().flatMap(l => [...S.heads].sort().map(h => [l, h]));
}

/* ──────────────────────────────────────────────
   SINCRONIZACIÓN DE UI
   ────────────────────────────────────────────── */
function sync() {
  // Checkboxes de capas
  document.querySelectorAll('input[name="layer"]').forEach(b => {
    b.checked = S.layers.has(+b.value);
  });
  // Checkboxes de cabezas
  document.querySelectorAll('input[name="head"]').forEach(b => {
    b.checked = S.heads.has(+b.value);
  });

  $('sequence').value = S.seq;
  ['dimX','dimY','dimZ'].forEach((id,i) => $(id).value = S.dims[i]);
  $('time').value = S.t;
  document.querySelectorAll('[data-mode]').forEach(b =>
    b.classList.toggle('selected', b.dataset.mode === S.mode));

  // Título dinámico según selección
  const nLayers = S.layers.size, nHeads = S.heads.size;
  const selDesc = S.mode === 'global'
    ? 'Las 16 cabezas del Transformer'
    : (nLayers * nHeads === 1)
      ? `Capa ${S.layer} · Cabeza ${S.head}`
      : `${nLayers * nHeads} combinaciones seleccionadas`;
  $('viewTitle').textContent = selDesc;

  $('canvasBadge').textContent = S.mode === 'global'
    ? '4 CAPAS · 16 CABEZAS'
    : `${[...S.layers].map(l=>'L'+l).join('+')} · ${[...S.heads].map(h=>'H'+h).join('+')}`;
  $('nodeCount').textContent = `${S.t + 1} / 13 ESTADOS`;
  $('stepText').textContent  = 'Paso ' + manifest.steps[S.t];
  $('stepCount').textContent = String(S.t+1).padStart(2,'0') + ' / 13';
  $('inspectTitle').innerHTML = `Capa ${S.layer} <span>/</span> Cabeza ${S.head}`;
  $('obsName').textContent = `${manifest.sequence_ids[S.seq]} · paso ${manifest.steps[S.t]}`;
  $('obsId').textContent   = `nano-copy-v1 / paso ${manifest.steps[S.t]} / L${S.layer} / H${S.head} / z / ${manifest.sequence_ids[S.seq]} / p7`;

  // Inspector de componentes (muestra la cabeza activa)
  let content = '';
  for (let j = 0; j < 16; j++) {
    const v = val(S.t, S.seq, S.layer, S.head, j);
    content += `<div class="component"><span>d${String(j).padStart(2,'0')}</span><b>${fmt(v)}</b></div>`;
  }
  $('components').innerHTML = content;

  // Inspector de atención
  let bars = '';
  for (let k = 0; k < 8; k++) {
    const v = att(S.t, S.seq, S.layer, S.head, k);
    bars += `<div class="att-col" title="posición ${k}: ${v.toPrecision(6)}"><div class="att-bar"><i style="height:${Math.max(1, v*100)}%"></i></div>${k}</div>`;
  }
  $('attention').innerHTML = bars;

  // Mapa de cabezas — muestra activas vs inactivas
  const activeSet = new Set(curheads().map(([l,h]) => l*4+h));
  $('headMap').innerHTML = Array.from({length:16}, (_,i) => {
    const l = Math.floor(i/4), h = i%4;
    const isActive  = activeSet.has(i);
    const isCurrent = l === S.layer && h === S.head;
    return `<button class="head-tile ${isCurrent ? 'active' : ''} ${isActive && !isCurrent ? 'selected-multi' : ''}"
      data-h="${i}" aria-label="Seleccionar capa ${l} cabeza ${h}">
      <i style="background:${colors[i]}"></i>L${l} H${h}</button>`;
  }).join('');
  document.querySelectorAll('[data-h]').forEach(b => b.onclick = () => {
    const n = +b.dataset.h;
    S.layer = Math.floor(n/4); S.head = n % 4;
    S.layers.add(S.layer); S.heads.add(S.head);
    // Actualizar checkboxes
    document.querySelector(`input[name="layer"][value="${S.layer}"]`).checked = true;
    document.querySelector(`input[name="head"][value="${S.head}"]`).checked   = true;
    sync();
  });

  $('projectionNote').textContent = S.mode === 'single'
    ? '✳  Proyección de tres coordenadas medidas de z. No preserva todas las distancias 16D.'
    : '⚠  Ejes y escala numérica comunes, pero las bases internas de cabezas/capas no son semánticamente equivalentes.';

  persist();
  draw();
  draw3D();
}

/* ──────────────────────────────────────────────
   MICROSCOPIO 2D — CANVAS
   ────────────────────────────────────────────── */
function draw() {
  if (!Z) return;
  const canvas = $('scene');
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.floor(box.width  * dpr);
  canvas.height = Math.floor(box.height * dpr);
  const c = canvas.getContext('2d');
  c.scale(dpr, dpr);
  const w = box.width, h = box.height;
  const heads = curheads();

  // Rango global de datos
  const all = [];
  for (const [l,k] of heads)
    for (let t = 0; t < 13; t++)
      for (const d of S.dims)
        all.push(val(t, S.seq, l, k, d));
  const lo = Math.min(...all), hi = Math.max(...all);
  const mid = (lo + hi) / 2, scale = (hi - lo) || 1;

  const proj = (p) => {
    let [x,y,z] = p.map(q => (q - mid) / scale * 1.35);
    const cx = Math.cos(S.rx), sx = Math.sin(S.rx);
    const cy = Math.cos(S.ry), sy = Math.sin(S.ry);
    const X  = x*cy + z*sy, Zz = -x*sy + z*cy;
    const Y  = y*cx - Zz*sx, D = y*sx + Zz*cx;
    return [w*.5 + X*Math.min(w,h)*.58*S.zoom, h*.50 - Y*Math.min(w,h)*.58*S.zoom, D];
  };

  // Grilla de referencia
  const grid = [];
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) {
      const from = [lo,lo,lo], to = [lo,lo,lo];
      from[a] = to[a] = lo + (hi-lo)*b/2;
      const other = (a+1)%3; to[other] = hi;
      grid.push([from, to]);
    }
  c.lineWidth = 1; c.strokeStyle = '#d8e7db';
  for (const [a,b] of grid) {
    const p = proj(a), q = proj(b);
    c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(q[0],q[1]); c.stroke();
  }

  // Ejes
  const origin = [lo, lo, lo];
  for (let a = 0; a < 3; a++) {
    const q = [...origin]; q[a] = hi;
    const p = proj(origin), v = proj(q);
    c.strokeStyle = ['#80a998','#a7bd98','#b4a7bd'][a];
    c.beginPath(); c.moveTo(p[0],p[1]); c.lineTo(v[0],v[1]); c.stroke();
    c.fillStyle = '#84998c'; c.font = '10px system-ui';
    c.fillText('d' + String(S.dims[a]).padStart(2,'0'), v[0]+5, v[1]-4);
  }

  // Trayectorias y puntos
  clickTargets = [];
  for (const [l,k] of heads) {
    const color  = colors[l*4+k];
    const points = [];
    for (let t = 0; t <= S.t; t++) {
      const coords = S.dims.map(d => val(t, S.seq, l, k, d));
      points.push(proj(coords));
    }
    c.strokeStyle  = color;
    c.globalAlpha  = .65;
    c.lineWidth    = (l === S.layer && k === S.head) ? 2.2 : 1.2;
    c.beginPath();
    points.forEach((p,i) => i ? c.lineTo(p[0],p[1]) : c.moveTo(p[0],p[1]));
    c.stroke();
    c.globalAlpha = 1;
    points.forEach((p,t) => {
      const current  = t === S.t;
      const selected = l === S.layer && k === S.head;
      c.beginPath();
      c.arc(p[0], p[1], current ? (selected ? 6 : 4) : 2.5, 0, Math.PI*2);
      c.fillStyle = color; c.fill();
      if (current && selected) {
        c.strokeStyle = 'white'; c.lineWidth = 2; c.stroke();
        c.font = '600 10px system-ui'; c.fillStyle = color;
        c.fillText(`L${l} H${k} · ${manifest.steps[t]}`, p[0]+9, p[1]-8);
      }
      clickTargets.push({x:p[0], y:p[1], l, k, t});
    });
  }
}

/* ──────────────────────────────────────────────
   MICROSCOPIO 3D — PLOTLY (estilo TOPO_VCE)
   Misma matemática que el 2D: puntos = cabeza × checkpoint
   Estilo: líneas + nube de puntos, color Viridis por cabeza
   ────────────────────────────────────────────── */
function draw3D() {
  if (!Z || typeof Plotly === 'undefined') return;
  const container = $('scene3d');
  if (!container) return;

  const heads = curheads();
  const nHeads = heads.length;
  const traces = [];

  heads.forEach(([l, k], idx) => {
    const xs = [], ys = [], zs = [], labels = [];
    // Normalizar índice a [0,1] para colorscale Viridis
    const colorVal = nHeads > 1 ? idx / (nHeads - 1) : 0.5;

    for (let t = 0; t <= S.t; t++) {
      xs.push(val(t, S.seq, l, k, S.dims[0]));
      ys.push(val(t, S.seq, l, k, S.dims[1]));
      zs.push(val(t, S.seq, l, k, S.dims[2]));
      labels.push(
        `<b>L${l} H${k}</b><br>` +
        `paso ${manifest.steps[t]}<br>` +
        `d${String(S.dims[0]).padStart(2,'0')}: ${fmt(xs[t])}<br>` +
        `d${String(S.dims[1]).padStart(2,'0')}: ${fmt(ys[t])}<br>` +
        `d${String(S.dims[2]).padStart(2,'0')}: ${fmt(zs[t])}`
      );
    }

    const isMain = l === S.layer && k === S.head;

    traces.push({
      type: 'scatter3d',
      mode: 'lines+markers',
      x: xs, y: ys, z: zs,
      name: `L${l} H${k}`,
      text: labels,
      hovertemplate: '%{text}<extra></extra>',
      line: {
        color: Array(xs.length).fill(colorVal),
        colorscale: 'Viridis',
        width: isMain ? 4 : 2,
        cmin: 0, cmax: 1
      },
      marker: {
        size: xs.map((_, t) => t === S.t ? (isMain ? 9 : 6) : 4),
        color: Array(xs.length).fill(colorVal),
        colorscale: 'Viridis',
        cmin: 0, cmax: 1,
        showscale: idx === 0,
        colorbar: idx === 0 ? {
          title: { text: 'Cabeza', font: { size: 10 } },
          thickness: 12,
          len: 0.6,
          tickvals: nHeads > 1 ? heads.map((_, i) => i / (nHeads - 1)) : [0.5],
          ticktext: nHeads > 1 ? heads.map(([l,k]) => `L${l}H${k}`) : [`L${heads[0][0]}H${heads[0][1]}`],
          tickfont: { size: 8 }
        } : undefined,
        opacity: 1,
        line: isMain ? { color: 'white', width: 1 } : { width: 0 }
      },
      showlegend: false
    });
  });

  const layout = {
    scene: {
      xaxis: { title: { text: 'd' + String(S.dims[0]).padStart(2,'0') } },
      yaxis: { title: { text: 'd' + String(S.dims[1]).padStart(2,'0') } },
      zaxis: { title: { text: 'd' + String(S.dims[2]).padStart(2,'0') } }
    },
    margin: { l: 0, r: 0, b: 0, t: 30 },
    height: 460
  };

  const config = {
    responsive: true,
    displaylogo: false,
    toImageButtonOptions: { format: 'png', filename: 'janus_3d' }
  };

  if (!S.plotlyReady) {
    Plotly.newPlot(container, traces, layout, config);
    S.plotlyReady = true;
  } else {
    Plotly.react(container, traces, layout, config);
  }
}

/* ──────────────────────────────────────────────
   VERIFICADOR DETERMINISTA
   ────────────────────────────────────────────── */
function verify() {
  const type   = $('claimMetric').value;
  const j      = Number($('claimIndex').value);
  const claim  = Number($('claimValue').value);
  const valid  = Number.isInteger(j) && j >= 0 &&
    (type === 'component' ? j < 16 : type === 'attention' ? j < 8 : true);
  if (!valid || $('claimValue').value.trim() === '' || !Number.isFinite(claim)) {
    $('verifyResult').textContent = 'Ingresá un índice y un número válidos.'; return;
  }
  const actual = type === 'component' ? val(S.t, S.seq, S.layer, S.head, j)
    : type === 'attention' ? att(S.t, S.seq, S.layer, S.head, j)
    : +metric(S.layer, S.head, S.t).ablation_delta_loss;
  const ok = Math.abs(actual - claim) <= .000001;
  const r  = $('verifyResult');
  r.className = 'result ' + (ok ? 'good' : 'bad');
  r.textContent = `${ok ? 'COINCIDE' : 'NO COINCIDE'} · valor registrado ${actual.toPrecision(8)} · diferencia ${Math.abs(actual-claim).toPrecision(4)} · ${type==='delta_loss'?'media de 128 entradas; no es el valor de una secuencia':'entrada '+manifest.sequence_ids[S.seq]} · paso ${manifest.steps[S.t]} · L${S.layer} H${S.head}. No verifica afirmaciones generales.`;
}

/* ──────────────────────────────────────────────
   CHAT CON AGENTES
   ────────────────────────────────────────────── */
function addMessage(role, text) {
  const node  = document.createElement('div');
  node.className = 'message ' + (role === 'VOS' ? 'user' : 'bot');
  const title = document.createElement('b'), p = document.createElement('p');
  title.textContent = role; p.textContent = text;
  node.append(title, p);
  $('messages').appendChild(node);
  $('messages').scrollTop = $('messages').scrollHeight;
}

async function chat(e) {
  e.preventDefault();
  const input   = $('chatInput'), message = input.value.trim();
  if (!message) return;
  addMessage('VOS', message); input.value = '';
  const btn = e.target.querySelector('button'); btn.disabled = true;
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message, role: S.agent,
        selection: {
          layers: [...S.layers], heads: [...S.heads],
          layer: S.layer, head: S.head,
          step: manifest.steps[S.t],
          sequence: S.seq, component: S.dims[0]
        },
        history: hist.slice(-4)
      })
    });
    const obj = await response.json();
    if (!response.ok) throw Error(obj.error || 'IA no disponible');
    for (const r of obj.agents)
      addMessage(r.role.toUpperCase() + ' · IA NO VERIFICADA', r.text);
    for (const warning of (obj.warnings || []))
      addMessage('ADVERTENCIA', warning);
    addMessage('VERIFICADOR · CÓDIGO', obj.evidence.summary);
    hist.push(
      { role: 'user',      content: message },
      { role: 'assistant', content: obj.agents.map(a => a.text).join('\n') }
    );
    hist = hist.slice(-8);
  } catch(err) {
    addMessage('SISTEMA', `No se pudo consultar el modelo local: ${err.message}. El microscopio y el verificador siguen disponibles.`);
  } finally {
    btn.disabled = false;
  }
}

/* ──────────────────────────────────────────────
   CONTROLES E INTERACCIÓN
   ────────────────────────────────────────────── */
function controls() {
  // Checkboxes de capas — selección múltiple
  document.addEventListener('change', e => {
    if (e.target.name === 'layer') {
      const v = +e.target.value;
      if (e.target.checked) {
        S.layers.add(v);
        // Si es la única o si no hay activo, hacer activo
        if (S.layers.size === 1) { S.layer = v; }
      } else {
        S.layers.delete(v);
        if (S.layers.size === 0) { S.layers.add(v); e.target.checked = true; }
        if (S.layer === v) S.layer = [...S.layers][0];
      }
      sync();
    }
    if (e.target.name === 'head') {
      const v = +e.target.value;
      if (e.target.checked) {
        S.heads.add(v);
        if (S.heads.size === 1) { S.head = v; }
      } else {
        S.heads.delete(v);
        if (S.heads.size === 0) { S.heads.add(v); e.target.checked = true; }
        if (S.head === v) S.head = [...S.heads][0];
      }
      sync();
    }
  });

  $('sequence').onchange = e => { S.seq = +e.target.value; sync(); };
  ['dimX','dimY','dimZ'].forEach((id, i) => $(id).onchange = e => {
    const n = +e.target.value;
    if (S.dims.some((x, idx) => idx !== i && x === n)) {
      alert('Elegí tres dimensiones distintas.'); sync(); return;
    }
    S.dims[i] = n; S.plotlyReady = false; sync();
  });

  $('time').oninput = e => { S.t = +e.target.value; sync(); };
  document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
    S.mode = b.dataset.mode; sync();
  });

  $('prev').onclick = () => { S.t = Math.max(0, S.t-1); sync(); };
  $('next').onclick = () => { S.t = Math.min(12, S.t+1); sync(); };
  $('play').onclick = () => {
    if (S.playing) {
      clearInterval(S.playing); S.playing = null; $('play').textContent = '▶'; return;
    }
    if (S.t === 12) S.t = 0; sync(); $('play').textContent = 'Ⅱ';
    S.playing = setInterval(() => {
      if (S.t >= 12) {
        clearInterval(S.playing); S.playing = null; $('play').textContent = '▶'; return;
      }
      S.t++; sync();
    }, 1200);
  };

  $('verify').onclick = verify;
  $('claimMetric').onchange = e => {
    $('claimIndex').disabled = e.target.value === 'delta_loss';
    $('claimIndex').max = e.target.value === 'attention' ? 7 : 15;
  };
  $('chatForm').onsubmit = chat;

  document.querySelectorAll('[data-agent]').forEach(b => b.onclick = () => {
    S.agent = b.dataset.agent;
    document.querySelectorAll('[data-agent]').forEach(x => x.classList.toggle('active', x === b));
  });

  $('clearMemory').onclick = () => {
    try { localStorage.removeItem('janus.selection.v2'); } catch(e) {}
    hist = [];
    $('messages').innerHTML = '';
    addMessage('SISTEMA', 'Sesión local borrada. Las mediciones científicas no se modificaron.');
    S.plotlyReady = false;
  };

  $('resetView').onclick = () => { S.rx = -.45; S.ry = .65; S.zoom = 1; draw(); };
  $('zoomIn').onclick  = () => { S.zoom = Math.min(3, S.zoom*1.2);   draw(); };
  $('zoomOut').onclick = () => { S.zoom = Math.max(.4, S.zoom/1.2);  draw(); };

  // Interacción 2D: arrastrar, zoom, clic
  const cv = $('scene'), drag = { active: false, x: 0, y: 0, moved: false };
  cv.onpointerdown = e => { drag.active = true; drag.x = e.clientX; drag.y = e.clientY; drag.moved = false; cv.setPointerCapture(e.pointerId); };
  cv.onpointermove = e => {
    if (!drag.active) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 1) drag.moved = true;
    S.ry += dx*.01; S.rx += dy*.01;
    drag.x = e.clientX; drag.y = e.clientY; draw();
  };
  cv.onpointerup = e => {
    if (drag.active && !drag.moved) {
      const b = cv.getBoundingClientRect(), x = e.clientX-b.left, y = e.clientY-b.top;
      const p = clickTargets.map(q => ({...q, d: Math.hypot(q.x-x, q.y-y)})).sort((a,b) => a.d-b.d)[0];
      if (p && p.d < 14) {
        S.layer = p.l; S.head = p.k; S.t = p.t;
        S.layers.add(S.layer); S.heads.add(S.head);
        document.querySelector(`input[name="layer"][value="${S.layer}"]`).checked = true;
        document.querySelector(`input[name="head"][value="${S.head}"]`).checked   = true;
        sync();
      }
    }
    drag.active = false;
  };
  cv.onwheel = e => {
    e.preventDefault();
    S.zoom = Math.max(.4, Math.min(3, S.zoom * Math.exp(-e.deltaY*.001)));
    draw();
  };

  // Tab 2D/3D
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.onclick = () => {
      const v = btn.dataset.view;
      document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('selected', b === btn));
      const p2 = $('panel2d'), p3 = $('panel3d');
      if (v === '2d') { p2.style.display = ''; p3.style.display = 'none'; draw(); }
      if (v === '3d') { p2.style.display = 'none'; p3.style.display = ''; S.plotlyReady = false; draw3D(); }
      if (v === 'split') {
        p2.style.display = ''; p3.style.display = '';
        draw(); S.plotlyReady = false; draw3D();
      }
    };
  });

  window.addEventListener('resize', () => { draw(); S.plotlyReady = false; draw3D(); });
}

/* ──────────────────────────────────────────────
   ARRANQUE
   ────────────────────────────────────────────── */
(async () => {
  try {
    const r = await fetch('data/manifest.json');
    if (!r.ok) throw Error('No se pudo cargar el manifiesto');
    manifest = await r.json();

    const [z, a] = await Promise.all([
      bytes('data/z.bin',         manifest.files.z),
      bytes('data/attention.bin', manifest.files.attention)
    ]);
    Z = new Float32Array(z);
    A = new Float32Array(a);

    if (Z.length !== 13*128*4*4*16 || A.length !== 13*128*4*4*8)
      throw Error('Dimensiones inválidas');

    loadPersisted();
    initSelects();
    controls();
    sync();

    // Estado del backend de agentes
    try {
      const s = await fetch('/api/status');
      if (s.ok) {
        const v = await s.json();
        $('agentStatus').textContent = v.enabled
          ? 'IA LOCAL · ACTIVADA (CALIDAD NO VALIDADA)'
          : 'IA LOCAL · NO ACTIVADA';
      }
    } catch(e) {}

  } catch(e) {
    document.body.innerHTML = 'Error al cargar los datos científicos: ' + String(e.message).replace(/[<>]/g,'');
    console.error(e);
  }
})();
