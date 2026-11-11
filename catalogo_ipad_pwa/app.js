'use strict';

const DB = 'shisha-catalog-db', STORE = 'products', META = 'meta';
const PT = 0.3528; // mm por punto tipográfico
const PAPER = { A4: [210, 297], A5: [148, 210], Carta: [215.9, 279.4] };
// Alturas (mm) que ocupan encabezado, pie y títulos de grupo, incluida su separación
const HEAD_FULL = 24, HEAD_RUN = 11, FOOT = 7, GROUP_H = 10;

const FONTS = {
  system: ['Sistema', '-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif'],
  avenir: ['Avenir Next', '"Avenir Next",Avenir,"Segoe UI",sans-serif'],
  futura: ['Futura', 'Futura,"Century Gothic","Trebuchet MS",sans-serif'],
  gill: ['Gill Sans', '"Gill Sans","Gill Sans MT",Calibri,sans-serif'],
  rounded: ['Redondeada', 'ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold",sans-serif'],
  georgia: ['Georgia', 'Georgia,"Times New Roman",serif'],
  didot: ['Didot (elegante)', 'Didot,"Bodoni 72","Bodoni MT",Georgia,serif'],
  baskerville: ['Baskerville', 'Baskerville,"Baskerville Old Face",Georgia,serif'],
  typewriter: ['Máquina de escribir', '"American Typewriter","Courier New",monospace'],
  condensed: ['Avenir Next Condensed', '"Avenir Next Condensed","Arial Narrow",sans-serif'],
  optima: ['Optima', 'Optima,Candara,sans-serif'],
  palatino: ['Palatino', 'Palatino,"Palatino Linotype",serif'],
  hoefler: ['Hoefler Text', '"Hoefler Text",Garamond,serif'],
  copperplate: ['Copperplate', 'Copperplate,"Copperplate Gothic Light",serif'],
  chalkboard: ['Chalkboard (tiza)', '"Chalkboard SE","Comic Sans MS",cursive'],
  markerfelt: ['Marker Felt (rotulador)', '"Marker Felt","Comic Sans MS",cursive'],
  noteworthy: ['Noteworthy (a mano)', 'Noteworthy,"Comic Sans MS",cursive'],
  snell: ['Snell Roundhand (caligrafía)', '"Snell Roundhand","Brush Script MT",cursive']
};

// Google Fonts: se descargan la primera vez que se usan y quedan guardadas para usar sin conexión
const GFONTS = {
  poppins: ['Poppins', 'Poppins:wght@400;600;800', 'sans-serif'],
  montserrat: ['Montserrat', 'Montserrat:wght@400;700;900', 'sans-serif'],
  fredoka: ['Fredoka', 'Fredoka:wght@400;600;700', 'sans-serif'],
  spacegrotesk: ['Space Grotesk', 'Space Grotesk:wght@400;700', 'sans-serif'],
  archivoblack: ['Archivo Black', 'Archivo Black', 'sans-serif'],
  bebas: ['Bebas Neue', 'Bebas Neue', 'sans-serif'],
  anton: ['Anton', 'Anton', 'sans-serif'],
  oswald: ['Oswald', 'Oswald:wght@400;700', 'sans-serif'],
  righteous: ['Righteous', 'Righteous', 'sans-serif'],
  playfair: ['Playfair Display', 'Playfair Display:wght@400;700;900', 'serif'],
  dmserif: ['DM Serif Display', 'DM Serif Display', 'serif'],
  abril: ['Abril Fatface', 'Abril Fatface', 'serif'],
  shrikhand: ['Shrikhand', 'Shrikhand', 'serif'],
  lobster: ['Lobster', 'Lobster', 'cursive'],
  pacifico: ['Pacifico', 'Pacifico', 'cursive'],
  dancing: ['Dancing Script', 'Dancing Script:wght@400;700', 'cursive'],
  caveat: ['Caveat', 'Caveat:wght@400;700', 'cursive'],
  marker: ['Permanent Marker', 'Permanent Marker', 'cursive']
};

let customFonts = []; // tipografías subidas por el usuario: { id, name, data }

function fontStack(key) {
  if (FONTS[key]) return FONTS[key][1];
  if (GFONTS[key]) return `"${GFONTS[key][0]}",${GFONTS[key][2]}`;
  if (String(key).startsWith('cf:')) return `"CF-${key.slice(3)}",-apple-system,sans-serif`;
  return FONTS.system[1];
}

const PRESETS = [
  { name: 'Morado', accent: '#59427c', textColor: '#24212a', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f6f4f8' },
  { name: 'Noche', accent: '#c9a45c', textColor: '#f1ece2', pageBg: '#17151c', cardBg: '#24212b', imageBg: '#f4f1ea' },
  { name: 'Menta', accent: '#1f7a64', textColor: '#1d2a26', pageBg: '#ffffff', cardBg: '#f6fbf9', imageBg: '#ffffff' },
  { name: 'Coral', accent: '#d2553f', textColor: '#2a201e', pageBg: '#fffaf6', cardBg: '#ffffff', imageBg: '#fbf0ea' },
  { name: 'Océano', accent: '#2457a6', textColor: '#1b2333', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f0f4fa' },
  { name: 'Minimal', accent: '#222222', textColor: '#222222', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f4f4f4' },
  { name: 'Neón', accent: '#ff2e88', textColor: '#f4f2ff', pageBg: '#0d0b1e', cardBg: '#181433', imageBg: '#231e45' },
  { name: 'Tropical', accent: '#f26b1d', textColor: '#2b1d12', pageBg: '#fff8ee', cardBg: '#ffffff', imageBg: '#fff0dc' },
  { name: 'Pastel', accent: '#9b7ede', textColor: '#2f2840', pageBg: '#fdf9ff', cardBg: '#ffffff', imageBg: '#f3edff' }
];

// Plantillas de un toque: solo cambian la maquetación y la decoración, no los textos ni los colores
const TEMPLATES = [
  { name: 'Revista', note: '3 por página', set: { orientation: 'portrait', layout: 'feature', cols: 1, rows: 3, cardStyle: 'tint', photoSize: 42, photoShape: 'circle', photoDeco: true, alternate: true, showNumbers: true, decoration: 'smoke', frame: 'none', headerStyle: 'band', badgeStyle: 'seal', imageFit: 'contain', groupByBrand: 'no' } },
  { name: 'Escaparate', note: '3 por página', set: { orientation: 'landscape', layout: 'vertical', cols: 3, rows: 1, cardStyle: 'tint', photoSize: 58, photoShape: 'arch', photoDeco: true, decoration: 'circles', frame: 'none', headerStyle: 'center', badgeStyle: 'seal', imageFit: 'contain', groupByBrand: 'no' } },
  { name: 'Fichas', note: '3 por página', set: { orientation: 'portrait', layout: 'horizontal', cols: 1, rows: 3, cardStyle: 'border', photoSize: 36, photoShape: 'rounded', photoDeco: false, decoration: 'dots', frame: 'line', headerStyle: 'classic', badgeStyle: 'pill', imageFit: 'contain', groupByBrand: 'no' } },
  { name: 'Lista', note: '6 por página', set: { orientation: 'portrait', layout: 'horizontal', cols: 1, rows: 6, cardStyle: 'flat', photoSize: 22, photoShape: 'rounded', photoDeco: false, decoration: 'none', frame: 'none', headerStyle: 'classic', badgeStyle: 'pill', imageFit: 'contain', groupByBrand: 'yes' } },
  { name: 'Cuadrícula', note: '9 por página', set: { orientation: 'portrait', layout: 'vertical', cols: 3, rows: 3, cardStyle: 'border', photoSize: 58, photoShape: 'rounded', photoDeco: false, decoration: 'none', frame: 'none', headerStyle: 'classic', badgeStyle: 'pill', imageFit: 'contain' } }
];

const DEFAULTS = {
  title: 'Catálogo de tabacos de cachimba', subtitle: 'Listado de sabores', footerText: '', edition: '', logo: '',
  paper: 'A4', orientation: 'portrait', margin: 10, printerMargin: 0,
  header: 'all', pageNumbers: true, cover: false, coverStyle: 'solid',
  cols: 3, rows: 3, gap: 5, sort: 'manual', groupByBrand: 'no',
  layout: 'vertical', cardStyle: 'border', photoSize: 58, imageFit: 'contain', align: 'left', radius: 3,
  photoShape: 'rounded', photoDeco: true, alternate: true, showNumbers: true, badgeStyle: 'pill', badgeText: 'Novedad',
  decoration: 'none', decoOpacity: 70, frame: 'none', headerStyle: 'classic', bgImage: '', bgOpacity: 15, flavorColors: true,
  showPhotos: true, showBrand: true, showDesc: true, showFormat: true, showRefs: true, showPrice: true, showBadge: true, upperName: false,
  titleEffect: 'none', photoBg: 'color', photoShadow: 'none', photoFilter: 'none', photoTilt: 0, photoRing: false,
  pageBgMode: 'solid', pageBg2: '#efe8f7',
  ...PRESETS[0], titleFont: 'system', headingFont: 'system', bodyFont: 'system', fontScale: 100,
  titleScale: 100, nameScale: 100, nameWeight: '800', nameSpacing: 0, nameColor: 'text',
  ...TEMPLATES[0].set, v3: true
};
delete DEFAULTS.name;
const NUM_KEYS = new Set(['cols', 'rows', 'gap', 'margin', 'photoSize', 'radius', 'fontScale', 'printerMargin', 'decoOpacity', 'bgOpacity', 'titleScale', 'nameScale', 'nameSpacing', 'photoTilt']);
// Claves que no forman parte de un «diseño» guardable (son contenido, no estilo)
const TEXT_KEYS = ['title', 'subtitle', 'footerText', 'edition', 'logo', 'v3'];

let products = [], S = { ...DEFAULTS };
const $ = id => document.getElementById(id);

/* ---------- Almacenamiento (IndexedDB) ---------- */

let dbPromise;
function openDB() {
  return dbPromise ||= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      if (!d.objectStoreNames.contains(META)) d.createObjectStore(META, { keyPath: 'key' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function tx(store, mode, fn) {
  const d = await openDB();
  return new Promise((res, rej) => {
    const r = fn(d.transaction(store, mode).objectStore(store));
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const getAll = () => tx(STORE, 'readonly', s => s.getAll());
const put = item => tx(STORE, 'readwrite', s => s.put(item));
const del = id => tx(STORE, 'readwrite', s => s.delete(id));
const getMeta = async () => (await tx(META, 'readonly', s => s.get('settings')))?.value || null;
const saveMeta = () => tx(META, 'readwrite', s => s.put({ key: 'settings', value: S }));
const getMetaKey = async key => (await tx(META, 'readonly', s => s.get(key)))?.value;
const putMetaKey = (key, value) => tx(META, 'readwrite', s => s.put({ key, value }));

/* ---------- Utilidades ---------- */

function uid() { return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(); }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const cmp = (a, b) => String(a || '').localeCompare(String(b || ''), 'es', { sensitivity: 'base', numeric: true });
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const mm = n => n.toFixed(2) + 'mm';

let toastTimer;
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.append(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Las fotos se guardan como data URL; para pintar se convierten una sola vez en blob URL,
// así redibujar la vista previa no copia megas de texto en cada cambio.
const blobUrls = new Map();
function imgUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl || '';
  let u = blobUrls.get(dataUrl);
  if (!u) {
    try {
      const [head, b64] = dataUrl.split(',');
      const bin = atob(b64), arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      u = URL.createObjectURL(new Blob([arr], { type: head.slice(5).split(';')[0] }));
    } catch { u = dataUrl; }
    blobUrls.set(dataUrl, u);
  }
  return u;
}

// Reduce la foto para que ocupe poco (las de la cámara del iPad pesan varios MB).
// Si la imagen tiene zonas transparentes (PNG recortado) se guarda como PNG para conservarlas.
async function compressImage(file, maxSide, keepTransparency) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canAlpha = keepTransparency && /png|gif|webp|svg|avif/.test(file.type);
    const side = canAlpha ? Math.min(maxSide, 1100) : maxSide; // un PNG pesa más: algo más pequeño
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, c.width, c.height);
    if (canAlpha && hasTransparency(ctx, c.width, c.height)) return c.toDataURL('image/png');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.85);
  } catch {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function hasTransparency(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data;
  for (let i = 3; i < d.length; i += 16) if (d[i] < 250) return true;
  return false;
}

function formatPrice(p) {
  const s = String(p || '').trim();
  return /^\d+([.,]\d{1,2})?$/.test(s) ? s.replace('.', ',') + ' €' : s;
}

/* ---------- Colores ---------- */

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslToHex(h, s, l) {
  const f = n => {
    const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}
// Texto legible (blanco o casi negro) sobre un color dado
function inkFor(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  return 0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255) > 165 ? '#1d1b20' : '#ffffff';
}

// Color más vivo y abundante de la foto: se usa como «color del sabor»
async function dominantColor(src) {
  try {
    const img = new Image();
    img.src = imgUrl(src);
    await img.decode();
    const N = 48, c = document.createElement('canvas');
    c.width = c.height = N;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const d = ctx.getImageData(0, 0, N, N).data;
    const bins = Array.from({ length: 24 }, () => ({ w: 0, h: 0, s: 0 }));
    for (let i = 0; i < d.length; i += 4) {
      const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
      if (s < 0.18 || l < 0.15 || l > 0.88) continue;
      const b = bins[Math.floor(h * 24) % 24], w = s;
      b.w += w; b.h += h * w; b.s += s * w;
    }
    const best = bins.reduce((a, b) => b.w > a.w ? b : a);
    if (best.w < N * N * 0.01) return '';
    return hslToHex(best.h / best.w, Math.max(0.45, Math.min(0.85, best.s / best.w)), 0.47);
  } catch {
    return '';
  }
}

function shiftHue(hex, turn) {
  const n = parseInt(String(hex).slice(1), 16);
  const [h, s, l] = rgbToHsl(n >> 16 & 255, n >> 8 & 255, n & 255);
  return hslToHex((h + turn + 1) % 1, Math.max(s, 0.5), Math.min(Math.max(l, 0.4), 0.6));
}

const flavorColor = p => S.flavorColors ? p.color || p.autoColor || S.accent : S.accent;

/* ---------- Ajustes ---------- */

// Convierte ajustes guardados por la versión anterior ('yes'/'no', color, cols como texto)
function normalize(raw) {
  raw = { ...raw };
  if (raw.color && !raw.accent) raw.accent = raw.color;
  const out = {};
  for (const k of Object.keys(DEFAULTS)) {
    let v = raw[k] ?? DEFAULTS[k];
    if (typeof DEFAULTS[k] === 'boolean') v = v === true || v === 'yes';
    else if (NUM_KEYS.has(k)) v = Number.isFinite(Number(v)) ? Number(v) : DEFAULTS[k];
    out[k] = v;
  }
  return out;
}

let saveTimer;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => saveMeta().catch(() => toast('No se pudo guardar el diseño')), 400); }

function fillSettings() {
  document.querySelectorAll('[data-set]').forEach(el => {
    const v = S[el.dataset.set];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v);
  });
  syncDesignUI();
}

function syncDesignUI() {
  document.querySelectorAll('[data-out]').forEach(o => o.textContent = S[o.dataset.out]);
  document.querySelectorAll('.cover-only').forEach(el => el.classList.toggle('hidden', !S.cover));
  document.querySelectorAll('.feature-only').forEach(el => el.classList.toggle('hidden', S.layout !== 'feature'));
  document.querySelectorAll('.pg-only').forEach(el => el.classList.toggle('hidden', S.pageBgMode !== 'gradient'));
  document.querySelectorAll('.grid-only').forEach(el => el.classList.toggle('hidden', S.layout === 'feature'));
  if (S.logo) $('logoPreview').src = S.logo; else $('logoPreview').removeAttribute('src');
  if (S.bgImage) $('bgPreview').src = imgUrl(S.bgImage); else $('bgPreview').removeAttribute('src');
}

function buildFontSelects() {
  const opt = (k, label) => `<option value="${esc(k)}" style="font-family:${esc(fontStack(k))}">${esc(label)}</option>`;
  const html = `<optgroup label="Del iPad (sin conexión)">${Object.entries(FONTS).map(([k, [l]]) => opt(k, l)).join('')}</optgroup>` +
    `<optgroup label="Google Fonts (internet la 1.ª vez)">${Object.entries(GFONTS).map(([k, [l]]) => opt(k, l)).join('')}</optgroup>` +
    (customFonts.length ? `<optgroup label="Mis tipografías">${customFonts.map(f => opt('cf:' + f.id, f.name)).join('')}</optgroup>` : '');
  document.querySelectorAll('.fontsel').forEach(sel => { sel.innerHTML = html; sel.value = S[sel.dataset.set]; });
  $('myFonts').innerHTML = customFonts.map(f => `<span class="chip"><span style="font-family:${esc(fontStack('cf:' + f.id))}">${esc(f.name)}</span><button data-delfont="${esc(f.id)}" aria-label="Eliminar">×</button></span>`).join('') || '<span class="hint">Aún no has subido ninguna.</span>';
}

// Carga solo las Google Fonts que se están usando
function loadGoogleFonts() {
  const used = [...new Set([S.titleFont, S.headingFont, S.bodyFont])].filter(k => GFONTS[k]);
  let link = $('gfonts');
  if (!used.length) { link?.remove(); return; }
  const href = 'https://fonts.googleapis.com/css2?' + used.map(k => 'family=' + GFONTS[k][1].replace(/ /g, '+')).join('&') + '&display=swap';
  if (!link) { link = document.createElement('link'); link.id = 'gfonts'; link.rel = 'stylesheet'; document.head.append(link); }
  if (link.getAttribute('href') !== href) link.href = href;
}

async function registerFont(f) {
  const face = new FontFace('CF-' + f.id, `url(${f.data})`);
  await face.load();
  document.fonts.add(face);
}

let myDesigns = []; // diseños guardados: { name, set }
function renderMyDesigns() {
  $('myDesigns').innerHTML = myDesigns.map((d, i) => `<span class="chip"><button data-design="${i}">${esc(d.name)}</button><button data-deldesign="${i}" aria-label="Eliminar">×</button></span>`).join('') || '<span class="hint">Guarda aquí tus combinaciones favoritas.</span>';
}
const styleOf = settings => Object.fromEntries(Object.entries(settings).filter(([k]) => !TEXT_KEYS.includes(k)));

function buildDesignUI() {
  $('templates').innerHTML = TEMPLATES.map((t, i) => `<button class="template" data-template="${i}"><b>${t.name}</b><small>${t.note}</small></button>`).join('');
  $('templates').onclick = e => {
    const b = e.target.closest('[data-template]');
    if (!b) return;
    Object.assign(S, TEMPLATES[b.dataset.template].set);
    fillSettings(); renderCatalog(); scheduleSave();
  };
  buildFontSelects();
  renderMyDesigns();
  $('presets').innerHTML = PRESETS.map((p, i) => `<button class="preset" data-preset="${i}"><i style="background:${p.accent};border-color:${p.pageBg}"></i>${p.name}</button>`).join('');
  $('presets').onclick = e => {
    const b = e.target.closest('[data-preset]');
    if (!b) return;
    const { name, ...colors } = PRESETS[b.dataset.preset];
    Object.assign(S, colors);
    fillSettings(); renderCatalog(); scheduleSave();
  };
  document.querySelectorAll('[data-set]').forEach(el => {
    const update = () => {
      const k = el.dataset.set;
      S[k] = el.type === 'checkbox' ? el.checked : NUM_KEYS.has(k) ? Number(el.value) : el.value;
      syncDesignUI(); scheduleRender(); scheduleSave();
    };
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  });
}

/* ---------- Maquetación del catálogo ----------
   Todo se calcula en milímetros: cada página tiene el tamaño exacto del papel y
   se reparten filas completas de tarjetas, de modo que ninguna se corta al imprimir. */

function geometry() {
  let [w, h] = PAPER[S.paper] || PAPER.A4;
  if (S.orientation === 'landscape') [w, h] = [h, w];
  const pm = S.printerMargin, pad = Math.max(S.margin - pm, 0);
  const pw = w - 2 * pm, ph = h - 2 * pm - 0.5; // 0,5 mm de holgura evita páginas en blanco por redondeo
  const iw = pw - 2 * pad, ih = ph - 2 * pad;
  const foot = S.pageNumbers || S.footerText ? FOOT : 0;
  const head = i => S.header === 'none' ? 0 : i === 0 ? HEAD_FULL : S.header === 'all' ? HEAD_RUN : 0;
  const avail = i => ih - head(i) - foot;
  const gap = S.gap, cols = S.layout === 'feature' ? 1 : S.cols, rows = S.rows;
  const cardW = (iw - (cols - 1) * gap) / cols;
  // La primera página es la más baja (encabezado grande); con ella se fija el alto de tarjeta
  const cardH = Math.max(15, (avail(0) - (rows - 1) * gap) / rows);
  // En tarjetas grandes el texto crece para no quedar perdido
  const textW = S.layout === 'horizontal' && S.showPhotos ? cardW * (1 - S.photoSize / 100) : cardW;
  const k = S.layout === 'feature' ? 1 : Math.min(1.6, Math.max(1, Math.min(textW / 45, cardH / (S.layout === 'horizontal' ? 50 : 80))));
  return { w, h, pm, pad, pw, ph, iw, ih, foot, head, avail, gap, cols, cardW, cardH, k };
}

const badgeText = p => S.showBadge ? p.tag || (p.isNew ? S.badgeText || 'Novedad' : '') : '';
const badgeHTML = (text, extra = '') => `<div class="c-badge ${S.badgeStyle}${extra}">${esc(text)}</div>`;
const tilt = p => S.photoTilt ? `;--tilt:${(numbering.get(p.id) || 0) % 2 ? S.photoTilt : -S.photoTilt}deg` : '';
const flavorVars = p => { const f = flavorColor(p); return `--f:${f};--f-ink:${inkFor(f)}`; };

function catalogProducts() {
  const list = products.filter(p => !p.hidden);
  if (S.sort === 'brand') list.sort((a, b) => cmp(a.brand, b.brand) || cmp(a.name, b.name));
  else if (S.sort === 'name') list.sort((a, b) => cmp(a.name, b.name));
  else list.sort(byOrder);
  if (S.groupByBrand !== 'no') list.sort((a, b) => cmp(a.brand, b.brand)); // estable: conserva el orden dentro de cada marca
  return list;
}

function paginate(list, g) {
  const items = [];
  const pushRows = arr => { for (let i = 0; i < arr.length; i += g.cols) items.push({ row: arr.slice(i, i + g.cols) }); };
  if (S.groupByBrand === 'no') pushRows(list);
  else {
    let i = 0;
    while (i < list.length) {
      let j = i;
      while (j < list.length && cmp(list[j].brand, list[i].brand) === 0) j++;
      items.push({ group: list[i].brand || 'Sin marca' });
      pushRows(list.slice(i, j));
      i = j;
    }
  }
  const pages = [];
  let cur, y;
  const open = () => { cur = []; pages.push(cur); y = 0; };
  open();
  for (const it of items) {
    const isGroup = 'group' in it, hgt = isGroup ? GROUP_H : g.cardH;
    if (isGroup && S.groupByBrand === 'page' && cur.length) open();
    let need = (cur.length ? g.gap : 0) + hgt;
    if (isGroup) need += g.gap + g.cardH; // el título de marca nunca queda solo al pie de página
    if (cur.length && y + need > g.avail(pages.length - 1) + 0.01) open();
    y += (cur.length ? g.gap : 0) + hgt;
    cur.push(it);
  }
  return pages;
}

function cardHTML(p, g) {
  if (S.layout === 'feature') return featureHTML(p, g);
  const fs = S.fontScale / 100 * g.k, lh = pt => pt * fs * PT;
  const pad = S.cardStyle === 'none' ? 0 : 2.5;
  const border = { border: 0.6, accent: 1.2, outline: 1.6, glass: 0.6 }[S.cardStyle] || 0;
  const inW = g.cardW - 2 * pad, inH = g.cardH - 2 * pad - border;
  const horiz = S.layout === 'horizontal', photo = S.showPhotos;
  let phStyle = '', textW = inW, textH = inH;
  if (photo) {
    if (horiz) { const pw = inW * S.photoSize / 100; phStyle = `flex-basis:${mm(pw)};width:${mm(pw)}`; textW = inW - pw - 3; }
    else { const ph = inH * S.photoSize / 100; phStyle = `height:${mm(ph)}`; textH = inH - ph - 2; }
    if (S.photoShape === 'circle') { // el círculo necesita una caja cuadrada
      const side = horiz ? Math.min(inW * S.photoSize / 100, inH) : Math.min(inH * S.photoSize / 100, inW);
      phStyle += `;width:${mm(side)};height:${mm(side)};flex-basis:${mm(side)};align-self:center`;
    }
  }
  const badge = badgeText(p), ns = S.nameScale / 100;
  const left = [S.showFormat && p.format, S.showRefs && p.reference && 'Ref. ' + p.reference].filter(Boolean).map(esc).join(' · ');
  const price = S.showPrice && p.price ? esc(formatPrice(p.price)) : '';
  const hasMeta = !!(left || price);
  // Estimación de cuántas líneas de descripción caben para recortarla limpiamente con «…»
  const brandH = S.showBrand && p.brand ? lh(6.5) * 1.45 : 0;
  const badgeH = badge && !photo ? lh(6) * 1.3 + 2.2 : 0;
  const nameLines = Math.min(2, Math.max(1, Math.ceil(String(p.name || '').length * lh(10.5 * ns) * (S.upperName ? 0.68 : 0.58) / Math.max(textW, 1))));
  const nameH = nameLines * lh(10.5 * ns) * 1.2 + 1.6;
  const metaH = hasMeta ? lh(9) * 1.25 + 1.6 : 0;
  const descLines = Math.floor((textH - brandH - badgeH - nameH - metaH - 0.6) / (lh(7.8) * 1.3));
  const badgeEl = badge ? badgeHTML(badge, photo ? '' : ' in') : '';
  return `<div class="c-card${horiz ? ' h' : ''}" data-pid="${esc(p.id)}" style="${flavorVars(p)}${tilt(p)}">${photo ? badgeEl : ''}` +
    (photo ? `<div class="c-ph sh-${S.photoShape}" style="${phStyle}">${p.image ? `<img src="${esc(imgUrl(p.image))}" alt="">` : ''}</div>` : '') +
    `<div class="c-tx">${photo ? '' : badgeEl}` +
    (brandH ? `<div class="c-brand">${esc(p.brand)}</div>` : '') +
    `<div class="c-name">${esc(p.name)}</div>` +
    (S.showDesc && p.description && descLines > 0 ? `<div class="c-desc" style="-webkit-line-clamp:${descLines}">${esc(p.description)}</div>` : '') +
    (hasMeta ? `<div class="c-meta"><span>${left}</span>${price ? `<b class="c-price">${price}</b>` : ''}</div>` : '') +
    `</div></div>`;
}

// Diseño «Revista»: un sabor por fila, foto grande con formas de color y texto amplio
function featureHTML(p, g) {
  const fs = S.fontScale / 100, lh = pt => pt * fs * PT;
  const pad = S.cardStyle === 'none' ? 0 : 4;
  const border = { border: 0.6, accent: 1.2, outline: 1.6, glass: 0.6 }[S.cardStyle] || 0;
  const inW = g.cardW - 2 * pad, inH = g.cardH - 2 * pad - border;
  const n = numbering.get(p.id) || 0, flip = S.alternate && n % 2 === 0;
  const photo = S.showPhotos, phW = photo ? Math.min(inW * S.photoSize / 100, inW * 0.7) : 0;
  const textW = inW - phW - (photo ? 7 : 0);
  const badge = badgeText(p), ns = S.nameScale / 100;
  const left = [S.showFormat && p.format, S.showRefs && p.reference && 'Ref. ' + p.reference].filter(Boolean).map(esc).join(' · ');
  const price = S.showPrice && p.price ? esc(formatPrice(p.price)) : '';
  const hasMeta = !!(left || price);
  const brandH = S.showBrand && p.brand ? lh(7.5) * 1.5 : 0;
  const badgeH = badge && !photo ? lh(6) * 1.3 + 2.2 : 0;
  const nameLines = Math.min(2, Math.max(1, Math.ceil(String(p.name || '').length * lh(22 * ns) * (S.upperName ? 0.68 : 0.58) / Math.max(textW, 1))));
  const nameH = nameLines * lh(22 * ns) * 1.08 + 3;
  const metaH = hasMeta ? lh(11) * 1.3 + 5 : 0;
  const descLines = Math.min(8, Math.floor((inH - brandH - badgeH - nameH - metaH - 1) / (lh(10.5) * 1.4)));
  let ph = '';
  if (photo) {
    const round = S.photoShape !== 'rounded', side = round ? Math.min(phW, inH) : 0;
    const shapeStyle = round ? `width:${mm(side)};height:${mm(side)}` : 'width:100%;height:100%';
    ph = `<div class="f-ph" style="flex-basis:${mm(phW)};width:${mm(phW)}">` +
      (S.photoDeco ? '<i class="f-dot"></i><i class="f-ring"></i>' : '') +
      `<div class="f-shape sh-${S.photoShape}" style="${shapeStyle}">${p.image ? `<img src="${esc(imgUrl(p.image))}" alt="">` : ''}</div>` +
      (badge ? badgeHTML(badge) : '') + '</div>';
  }
  return `<div class="c-card f-card${flip ? ' flip' : ''}" data-pid="${esc(p.id)}" style="${flavorVars(p)}${tilt(p)}">${ph}<div class="f-tx">` +
    (S.showNumbers && n ? `<div class="f-num">${String(n).padStart(2, '0')}</div>` : '') +
    (badge && !photo ? badgeHTML(badge, ' in') : '') +
    (brandH ? `<div class="f-brand">${esc(p.brand)}</div>` : '') +
    `<div class="f-name">${esc(p.name)}</div>` +
    (S.showDesc && p.description && descLines > 0 ? `<div class="f-desc" style="-webkit-line-clamp:${descLines}">${esc(p.description)}</div>` : '') +
    (hasMeta ? `<div class="f-meta">${price ? `<b class="f-price">${price}</b>` : ''}<span>${left}</span></div>` : '') +
    `</div></div>`;
}

// Capa decorativa de la página (SVG en mm), imagen de fondo y marco
function decoHTML(g, i) {
  let h = '';
  if (S.bgImage) h += `<img class="p-bgimg" src="${esc(imgUrl(S.bgImage))}" alt="" style="opacity:${S.bgOpacity / 100}">`;
  const svg = decoSVG(g.pw, g.ph, i);
  if (svg) h += `<svg class="p-deco" viewBox="0 0 ${g.pw} ${g.ph}" preserveAspectRatio="none" style="opacity:${S.decoOpacity / 100}"><g${i % 2 ? ` transform="translate(${g.pw} 0) scale(-1 1)"` : ''}>${svg}</g></svg>`;
  if (S.frame !== 'none') h += `<div class="p-frame fr-${S.frame}" style="inset:${mm(Math.max(2.5, g.pad * 0.45))}">${S.frame === 'corners' ? '<i></i><i></i><i></i><i></i>' : ''}</div>`;
  return h;
}

function decoSVG(w, h, i) {
  const id = 'd' + i;
  switch (S.decoration) {
    case 'smoke': { // volutas de humo que suben desde la esquina
      let s = '';
      for (let k = 0; k < 6; k++) {
        const y = h * 0.8 + k * 5;
        s += `<path d="M-10 ${y} C ${w * 0.22} ${y - 34 - k * 4}, ${w * 0.42} ${y + 26}, ${w * 0.66} ${y - 12 - k * 3} S ${w * 0.95} ${y - 40}, ${w + 12} ${y - 22 + k * 6}" fill="none" stroke="currentColor" stroke-width="${0.4 + k * 0.18}" stroke-linecap="round" opacity="${0.42 - k * 0.05}"/>`;
      }
      for (let k = 0; k < 4; k++) {
        const x = w * 0.5 + k * 9;
        s += `<path d="M${x} -6 C ${x + 18} ${h * 0.06}, ${x - 6} ${h * 0.12}, ${x + 30} ${h * 0.17} S ${w + 10} ${h * 0.12}, ${w + 14} ${h * 0.2 + k * 4}" fill="none" stroke="currentColor" stroke-width="${0.35 + k * 0.15}" opacity="${0.3 - k * 0.05}"/>`;
      }
      return s;
    }
    case 'circles':
      return `<circle cx="${w * 0.96}" cy="${h * 0.03}" r="${w * 0.27}" fill="currentColor" opacity=".13"/>` +
        `<circle cx="${w * 0.8}" cy="${h * 0.1}" r="${w * 0.06}" fill="currentColor" opacity=".18"/>` +
        `<circle cx="${w * 0.05}" cy="${h * 0.98}" r="${w * 0.22}" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".25"/>` +
        `<circle cx="${w * 0.05}" cy="${h * 0.98}" r="${w * 0.15}" fill="currentColor" opacity=".1"/>` +
        `<circle cx="${w * 0.93}" cy="${h * 0.9}" r="4" fill="currentColor" opacity=".25"/><circle cx="${w * 0.88}" cy="${h * 0.95}" r="2.2" fill="currentColor" opacity=".2"/>`;
    case 'dots':
      return `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="currentColor"/></pattern></defs>` +
        `<rect x="${w - 46}" y="0" width="46" height="30" fill="url(#${id})" opacity=".25"/><rect x="0" y="${h - 36}" width="48" height="36" fill="url(#${id})" opacity=".3"/>`;
    case 'stripes': {
      let s = '';
      for (let k = 0; k < 9; k++) s += `<line x1="${w - 80 + k * 9}" y1="-2" x2="${w + 2}" y2="${80 - k * 9}" stroke="currentColor" stroke-width="2.2" opacity=".16"/>`;
      for (let k = 0; k < 6; k++) s += `<line x1="-2" y1="${h - 54 + k * 9}" x2="${54 - k * 9}" y2="${h + 2}" stroke="currentColor" stroke-width="2.2" opacity=".16"/>`;
      return s;
    }
    case 'waves':
      return `<path d="M0 ${h * 0.86} C ${w * 0.25} ${h * 0.8}, ${w * 0.5} ${h * 0.93}, ${w} ${h * 0.84} V ${h} H 0 Z" fill="currentColor" opacity=".1"/>` +
        `<path d="M0 ${h * 0.92} C ${w * 0.3} ${h * 0.87}, ${w * 0.65} ${h * 0.98}, ${w} ${h * 0.9} V ${h} H 0 Z" fill="currentColor" opacity=".14"/>` +
        `<path d="M${w * 0.55} 0 C ${w * 0.7} ${h * 0.05}, ${w * 0.85} ${h * 0.01}, ${w} ${h * 0.07} V 0 Z" fill="currentColor" opacity=".1"/>`;
    case 'sparkles': {
      const star = (x, y, r, o) => `<path d="M${x} ${y - r}L${x + r * 0.22} ${y - r * 0.22}L${x + r} ${y}L${x + r * 0.22} ${y + r * 0.22}L${x} ${y + r}L${x - r * 0.22} ${y + r * 0.22}L${x - r} ${y}L${x - r * 0.22} ${y - r * 0.22}Z" fill="currentColor" opacity="${o}"/>`;
      return [[0.955, 0.028, 5, 0.5], [0.985, 0.09, 2.5, 0.4], [0.885, 0.014, 2.2, 0.35], [0.016, 0.45, 3, 0.3], [0.985, 0.6, 2.2, 0.3], [0.04, 0.968, 5, 0.45], [0.1, 0.988, 2.4, 0.35], [0.955, 0.972, 3.5, 0.4], [0.5, 0.993, 1.8, 0.3]]
        .map(([x, y, r, o]) => star(w * x, h * y, r, o)).join('');
    }
    case 'hex':
      return `<defs><pattern id="${id}" width="12" height="20.78" patternUnits="userSpaceOnUse"><path d="M6 0L12 3.46V10.39L6 13.85L0 10.39V3.46Z M0 17.32L6 20.78 M12 17.32L6 20.78 M6 13.85V20.78" fill="none" stroke="currentColor" stroke-width=".35"/></pattern>` +
        `<radialGradient id="${id}g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${id}m"><circle cx="${w}" cy="0" r="75" fill="url(#${id}g)"/><circle cx="0" cy="${h}" r="65" fill="url(#${id}g)"/></mask></defs>` +
        `<rect width="${w}" height="${h}" fill="url(#${id})" mask="url(#${id}m)" opacity=".55"/>`;
    case 'gradient':
      return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".2"/><stop offset=".45" stop-color="currentColor" stop-opacity="0"/><stop offset=".8" stop-color="currentColor" stop-opacity="0"/><stop offset="1" stop-color="currentColor" stop-opacity=".12"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
    default:
      return '';
  }
}

function pageHTML(items, i, total, g) {
  const head = g.head(i), full = head === HEAD_FULL;
  let html = `<div class="page" style="width:${mm(g.pw)};height:${mm(g.ph)};padding:${mm(g.pad)}">` + decoHTML(g, i + 1);
  if (head) {
    const hh = full ? 19 : 8, mb = full ? 5 : 3, pb = full ? 2.5 : 1.5;
    // La banda de color llega hasta el borde del papel sin cambiar el espacio que ocupa
    const style = S.headerStyle === 'band'
      ? `height:${mm(hh + g.pad)};margin:${mm(-g.pad)} ${mm(-g.pad)} ${mb}mm;padding:${mm(g.pad)} ${mm(g.pad)} ${pb}mm`
      : `height:${hh}mm;margin-bottom:${mb}mm;padding-bottom:${pb}mm`;
    html += `<div class="p-head ${full ? 'full' : 'run'} hs-${S.headerStyle}" style="${style}">` +
      (S.logo ? `<img src="${esc(imgUrl(S.logo))}" alt="">` : '') +
      `<div class="t"><div class="t1">${esc(S.title)}</div>${S.subtitle ? `<div class="t2">${esc(S.subtitle)}</div>` : ''}</div></div>`;
  }
  html += `<div class="p-body" style="gap:${mm(g.gap)}">`;
  if (!items.length) html += `<div class="p-empty">No hay productos visibles. Añádelos en la pestaña «Productos».</div>`;
  for (const it of items) {
    if ('group' in it) html += `<div class="p-group" style="height:${GROUP_H}mm">${esc(it.group)}</div>`;
    else html += `<div class="p-row" style="height:${mm(g.cardH)};grid-template-columns:repeat(${g.cols},minmax(0,1fr));gap:${mm(g.gap)}">${it.row.map(p => cardHTML(p, g)).join('')}</div>`;
  }
  html += '</div>';
  if (g.foot) html += `<div class="p-foot" style="height:${FOOT - 2}mm;margin-top:2mm"><span>${esc(S.footerText)}</span><span>${S.pageNumbers ? `Página ${i + 1} de ${total}` : ''}</span></div>`;
  return html + '</div>';
}

function coverHTML(g, list) {
  let mosaic = '';
  if (S.coverStyle === 'photos') {
    const imgs = list.filter(p => p.image).slice(0, 6);
    if (imgs.length) {
      const c = imgs.length === 3 || imgs.length >= 5 ? 3 : Math.min(imgs.length, 2), r = Math.ceil(imgs.length / c);
      const cell = Math.min((g.iw - (c - 1) * 3) / c, (g.ih * 0.42 - (r - 1) * 3) / r);
      mosaic = `<div class="cv-mosaic" style="width:${mm(c * cell + (c - 1) * 3)};grid-template-columns:repeat(${c},1fr)">${imgs.map(p => `<img src="${esc(imgUrl(p.image))}" alt="">`).join('')}</div>`;
    }
  }
  return `<div class="page cover ${S.coverStyle === 'solid' ? 'solid' : 'light'}" style="width:${mm(g.pw)};height:${mm(g.ph)};padding:${mm(g.pad)}">` + decoHTML(g, 0) +
    (S.logo ? `<img class="cv-logo" src="${esc(imgUrl(S.logo))}" alt="">` : '') + mosaic +
    `<div class="cv-title">${esc(S.title)}</div>` +
    (S.subtitle ? `<div class="cv-sub">${esc(S.subtitle)}</div>` : '') +
    (S.edition ? `<div class="cv-line"></div><div class="cv-ed">${esc(S.edition)}</div>` : '') +
    (S.footerText ? `<div class="cv-foot" style="bottom:${mm(g.pad + 2)}">${esc(S.footerText)}</div>` : '') +
    `</div>`;
}

let renderTimer, numbering = new Map();
function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderCatalog, 80); }

function renderCatalog() {
  clearTimeout(renderTimer);
  const g = geometry(), list = catalogProducts(), pages = paginate(list, g);
  numbering = new Map(list.map((p, i) => [p.id, i + 1]));
  const root = $('pages');
  root.className = `pages st-${S.cardStyle} fit-${S.imageFit} pb-${S.photoBg} nc-${S.nameColor} te-${S.titleEffect} pg-${S.pageBgMode}` +
    `${S.photoRing ? ' ring' : ''}${S.upperName ? ' up' : ''}${S.align === 'center' ? ' al-center' : ''}`;
  const vars = {
    '--c-accent': S.accent, '--c-accent-ink': inkFor(S.accent), '--c-text': S.textColor, '--c-page': S.pageBg, '--c-card': S.cardBg, '--c-imgbg': S.imageBg,
    '--c-head': fontStack(S.headingFont), '--c-body': fontStack(S.bodyFont), '--c-title': fontStack(S.titleFont),
    '--c-ts': S.titleScale / 100, '--c-ns': S.nameScale / 100, '--c-nw': S.nameWeight, '--c-nls': S.nameSpacing / 100 + 'em',
    '--c-page2': S.pageBg2, '--c-grad2': shiftHue(S.accent, 0.12),
    '--c-fs': S.fontScale / 100, '--c-k': g.k, '--c-radius': S.radius + 'mm', '--c-fit': S.imageFit, '--c-align': S.align
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.innerHTML = (S.cover ? coverHTML(g, list) : '') + pages.map((items, i) => pageHTML(items, i, pages.length, g)).join('');
  $('pageRule').textContent = `@page{size:${g.w}mm ${g.h}mm;margin:${g.pm}mm}` + effectsCSS();
  loadGoogleFonts();
  document.documentElement.style.setProperty('--accent', S.accent);
  const hidden = products.length - list.length, total = pages.length + (S.cover ? 1 : 0);
  $('stats').textContent = `${list.length} producto${list.length === 1 ? '' : 's'} · ${total} página${total === 1 ? '' : 's'}` + (hidden ? ` · ${hidden} oculto${hidden === 1 ? '' : 's'}` : '');
  updateZoom();
}

// Filtros y sombras de las fotos: se escriben como regla para que var(--f) tome el color de cada sabor
function effectsCSS() {
  const filters = { none: '', vivid: 'saturate(1.4) contrast(1.06)', bw: 'grayscale(1) contrast(1.1)', sepia: 'sepia(.65) saturate(1.1)', vintage: 'sepia(.35) contrast(.9) brightness(1.06) saturate(.8)', warm: 'sepia(.22) saturate(1.25) hue-rotate(-8deg)', cool: 'saturate(1.1) hue-rotate(14deg) brightness(1.03)' };
  const shadows = { none: '', soft: 'drop-shadow(0 .8mm 1.2mm rgba(0,0,0,.28))', strong: 'drop-shadow(0 1.8mm 2.2mm rgba(0,0,0,.45))', glow: 'drop-shadow(0 0 2.4mm var(--f))', long: 'drop-shadow(1.6mm 1.6mm 0 color-mix(in srgb,var(--f) 55%,transparent))' };
  const f = [filters[S.photoFilter], shadows[S.photoShadow]].filter(Boolean).join(' ') || 'none';
  return `#pages .c-ph img,#pages .f-shape img,#pages .cv-mosaic img{filter:${f};transform:rotate(var(--tilt,0deg))}`;
}

// Escala la vista previa para que la página entera quepa en pantalla
function updateZoom() {
  const root = $('pages'), first = root.querySelector('.page');
  if (!first || !root.clientWidth) return;
  const pageW = parseFloat(first.style.width) * 96 / 25.4;
  root.style.setProperty('--zoom', Math.min(1, (root.clientWidth - 4) / pageW).toFixed(4));
}

/* ---------- Lista y formulario de productos ---------- */

function renderList() {
  const q = $('search').value.trim().toLowerCase();
  const list = q ? products.filter(p => [p.brand, p.name, p.reference, p.description].join(' ').toLowerCase().includes(q)) : products;
  $('productList').innerHTML = list.length ? list.map(p => {
    const i = products.indexOf(p);
    return `<div class="productrow${p.hidden ? ' off' : ''}" data-id="${esc(p.id)}">` +
      (p.image ? `<img src="${esc(imgUrl(p.image))}" alt="">` : '<div class="noimg"></div>') +
      `<div class="info"><strong><i class="swatch" style="background:${esc(p.color || p.autoColor || S.accent)}"></i>${esc(p.brand)} · ${esc(p.name)}</strong>` +
      `<small>${esc([p.reference || 'Sin referencia', p.format, formatPrice(p.price)].filter(Boolean).join(' · '))}</small>` +
      `${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}${p.isNew ? '<span class="tag">Novedad</span>' : ''}${p.hidden ? '<span class="tag">Oculto</span>' : ''}</div>` +
      `<div class="btns"><button class="ghost small" data-act="up" ${q || i === 0 ? 'disabled' : ''} aria-label="Subir">↑</button>` +
      `<button class="ghost small" data-act="down" ${q || i === products.length - 1 ? 'disabled' : ''} aria-label="Bajar">↓</button>` +
      `<button class="ghost small" data-act="vis">${p.hidden ? 'Mostrar' : 'Ocultar'}</button>` +
      `<button class="secondary small" data-act="edit">Editar</button>` +
      `<button class="danger small" data-act="del" aria-label="Eliminar">×</button></div></div>`;
  }).join('') : `<p class="hint">${q ? 'Ningún producto coincide con la búsqueda.' : 'Todavía no hay productos.'}</p>`;
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort(cmp);
  $('brandList').innerHTML = brands.map(b => `<option value="${esc(b)}">`).join('');
}

function render() { renderCatalog(); renderList(); }

async function refresh() { products = (await getAll()).sort(byOrder); render(); }

// Garantiza un orden manual único y consecutivo
async function fixOrder() {
  products.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  for (let i = 0; i < products.length; i++) {
    if (products[i].order !== i) { products[i].order = i; await put(products[i]); }
  }
}

let pendingImage; // undefined: sin cambios · '': quitar foto · promesa/data URL: foto nueva
function showPhotoPreview(src) {
  if (src) $('photoPreview').src = imgUrl(src); else $('photoPreview').removeAttribute('src');
  $('photoRemove').classList.toggle('hidden', !src);
}

function clearForm() {
  ['editId', 'brand', 'name', 'desc', 'pack', 'ref', 'price', 'tag'].forEach(id => $(id).value = '');
  $('isNew').checked = $('isHidden').checked = $('useColor').checked = false;
  $('pcolor').value = S.accent;
  $('pcolor').disabled = true;
  $('photo').value = '';
  pendingImage = undefined;
  showPhotoPreview('');
  $('formTitle').textContent = 'Añadir producto';
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  clearForm();
  $('editId').value = id;
  $('brand').value = p.brand || '';
  $('name').value = p.name || '';
  $('desc').value = p.description || '';
  $('pack').value = p.format || '';
  $('ref').value = p.reference || '';
  $('price').value = p.price || '';
  $('tag').value = p.tag || '';
  $('isNew').checked = !!p.isNew;
  $('isHidden').checked = !!p.hidden;
  $('useColor').checked = !!p.color;
  $('pcolor').value = p.color || p.autoColor || S.accent;
  $('pcolor').disabled = !p.color;
  showPhotoPreview(p.image);
  $('formTitle').textContent = 'Editar producto';
  showTab('productos');
  window.scrollTo(0, 0);
}

async function moveProduct(id, dir) {
  const i = products.findIndex(p => p.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= products.length) return;
  const a = products[i], b = products[j];
  [a.order, b.order] = [b.order, a.order];
  await put(a); await put(b);
  products.sort(byOrder);
  render();
}

/* ---------- Navegación ---------- */

function showTab(name) {
  document.querySelectorAll('main section').forEach(s => s.classList.toggle('hidden', s.id !== name));
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'catalogo') updateZoom();
}

async function printCatalog() {
  showTab('catalogo');
  renderCatalog();
  await document.fonts.ready.catch(() => {});
  setTimeout(() => window.print(), 150);
}

/* ---------- Eventos ---------- */

document.querySelectorAll('.tab').forEach(b => b.onclick = () => showTab(b.dataset.tab));
window.addEventListener('resize', updateZoom);

$('toggleDesign').onclick = () => {
  const closed = $('designPanel').classList.toggle('closed');
  $('toggleDesign').textContent = closed ? 'Personalizar diseño' : 'Ocultar diseño';
};

$('logoBtn').onclick = () => $('logoFile').click();
$('logoFile').onchange = async () => {
  const f = $('logoFile').files[0];
  if (!f) return;
  S.logo = await compressImage(f, 800, true);
  $('logoFile').value = '';
  syncDesignUI(); renderCatalog(); scheduleSave();
};
$('logoRemove').onclick = () => { S.logo = ''; syncDesignUI(); renderCatalog(); scheduleSave(); };

$('bgBtn').onclick = () => $('bgFile').click();
$('bgFile').onchange = async () => {
  const f = $('bgFile').files[0];
  if (!f) return;
  S.bgImage = await compressImage(f, 1600, true);
  $('bgFile').value = '';
  syncDesignUI(); renderCatalog(); scheduleSave();
};
$('bgRemove').onclick = () => { S.bgImage = ''; syncDesignUI(); renderCatalog(); scheduleSave(); };

// Tocar un sabor en la vista previa abre su ficha; tocar el título abre los textos
$('pages').addEventListener('click', e => {
  const card = e.target.closest('[data-pid]');
  if (card) return editProduct(card.dataset.pid);
  if (e.target.closest('.p-head, .cv-title')) {
    $('designPanel').classList.remove('closed');
    $('toggleDesign').textContent = 'Ocultar diseño';
    $('textsSection').open = true;
    $('titleInput').focus();
  }
});

$('saveDesign').onclick = async () => {
  const name = prompt('Nombre para este diseño:', `Mi diseño ${myDesigns.length + 1}`);
  if (!name) return;
  myDesigns.push({ name: name.trim(), set: styleOf(S) });
  await putMetaKey('designs', myDesigns);
  renderMyDesigns();
  toast('Diseño guardado');
};
$('myDesigns').onclick = async e => {
  const apply = e.target.closest('[data-design]'), remove = e.target.closest('[data-deldesign]');
  if (apply) {
    S = normalize({ ...S, ...myDesigns[apply.dataset.design].set });
    fillSettings(); renderCatalog(); scheduleSave();
    toast('Diseño aplicado');
  } else if (remove && confirm(`¿Eliminar el diseño «${myDesigns[remove.dataset.deldesign].name}»?`)) {
    myDesigns.splice(remove.dataset.deldesign, 1);
    await putMetaKey('designs', myDesigns);
    renderMyDesigns();
  }
};

$('fontBtn').onclick = () => $('fontFile').click();
$('fontFile').onchange = async () => {
  const file = $('fontFile').files[0];
  $('fontFile').value = '';
  if (!file) return;
  const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const f = { id: Date.now().toString(36), name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), data };
  try { await registerFont(f); } catch { alert('Ese archivo no es una tipografía válida (usa .ttf, .otf, .woff o .woff2).'); return; }
  customFonts.push(f);
  await putMetaKey('fonts', customFonts);
  buildFontSelects();
  toast(`Tipografía «${f.name}» añadida`);
};
$('myFonts').onclick = async e => {
  const b = e.target.closest('[data-delfont]');
  if (!b) return;
  const f = customFonts.find(x => x.id === b.dataset.delfont);
  if (!confirm(`¿Eliminar la tipografía «${f.name}»?`)) return;
  customFonts = customFonts.filter(x => x !== f);
  await putMetaKey('fonts', customFonts);
  for (const k of ['titleFont', 'headingFont', 'bodyFont']) if (S[k] === 'cf:' + f.id) S[k] = 'system';
  buildFontSelects(); renderCatalog(); scheduleSave();
};

$('resetDesign').onclick = () => {
  if (!confirm('¿Volver al diseño predeterminado? Se conservan el título, los textos y el logotipo.')) return;
  S = { ...DEFAULTS, title: S.title, subtitle: S.subtitle, footerText: S.footerText, edition: S.edition, logo: S.logo };
  fillSettings(); renderCatalog(); scheduleSave();
};

$('photo').onchange = () => {
  const f = $('photo').files[0];
  if (!f) return;
  pendingImage = compressImage(f, 1400, true);
  pendingImage.then(showPhotoPreview);
};
$('photoRemove').onclick = () => { pendingImage = ''; $('photo').value = ''; showPhotoPreview(''); };
$('useColor').onchange = () => { $('pcolor').disabled = !$('useColor').checked; };

$('clearForm').onclick = clearForm;
$('saveProduct').onclick = async () => {
  const brand = $('brand').value.trim(), name = $('name').value.trim();
  if (!brand || !name) { alert('Introduce la marca y el nombre.'); return; }
  const id = $('editId').value || uid(), old = products.find(p => p.id === id);
  const image = pendingImage === undefined ? old?.image || '' : await pendingImage;
  const autoColor = image && image === old?.image && old.autoColor !== undefined ? old.autoColor : image ? await dominantColor(image) : '';
  const order = old ? old.order : products.reduce((m, p) => Math.max(m, p.order ?? 0), -1) + 1;
  await put({
    ...old, id, order, brand, name, image, autoColor, color: $('useColor').checked ? $('pcolor').value : '',
    description: $('desc').value.trim(), format: $('pack').value.trim(), reference: $('ref').value.trim(),
    price: $('price').value.trim(), tag: $('tag').value.trim(), isNew: $('isNew').checked, hidden: $('isHidden').checked
  });
  clearForm();
  await refresh();
  toast(old ? 'Producto actualizado' : 'Producto añadido');
};

$('search').addEventListener('input', renderList);
$('productList').onclick = async e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = btn.closest('[data-id]').dataset.id, p = products.find(x => x.id === id);
  switch (btn.dataset.act) {
    case 'up': return moveProduct(id, -1);
    case 'down': return moveProduct(id, 1);
    case 'edit': return editProduct(id);
    case 'vis': p.hidden = !p.hidden; await put(p); return render();
    case 'del':
      if (confirm(`¿Eliminar «${p.brand} · ${p.name}»?`)) { await del(id); await refresh(); }
  }
};

$('print').onclick = $('quickPdf').onclick = printCatalog;
$('quickAdd').onclick = () => { clearForm(); showTab('productos'); $('brand').focus(); };

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify({ version: 3, products, settings: S, designs: myDesigns, fonts: customFonts }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url;
  a.download = `copia-catalogo-cachimba-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
$('importBtn').onclick = () => $('importFile').click();
$('importFile').onchange = async e => {
  try {
    const data = JSON.parse(await e.target.files[0].text());
    if (!Array.isArray(data.products)) throw Error();
    let next = products.reduce((m, p) => Math.max(m, p.order ?? 0), -1) + 1;
    for (const p of data.products) {
      if (!p.id) p.id = uid();
      const existing = products.find(x => x.id === p.id);
      if (p.order == null || !existing) p.order = existing ? existing.order : next++;
      await put(p);
    }
    if (Array.isArray(data.designs)) { myDesigns.push(...data.designs.filter(d => !myDesigns.some(m => m.name === d.name))); await putMetaKey('designs', myDesigns); renderMyDesigns(); }
    if (Array.isArray(data.fonts)) {
      for (const f of data.fonts) if (!customFonts.some(x => x.id === f.id)) { try { await registerFont(f); customFonts.push(f); } catch {} }
      await putMetaKey('fonts', customFonts);
      buildFontSelects();
    }
    if (data.settings) { S = normalize({ ...S, ...normalize(data.settings) }); await saveMeta(); fillSettings(); }
    await refresh();
    toast('Copia restaurada correctamente');
    fillAutoColors();
  } catch {
    alert('No se ha podido leer esa copia.');
  } finally {
    e.target.value = '';
  }
};

/* ---------- Arranque ---------- */

async function init() {
  navigator.storage?.persist?.().catch(() => {});
  products = await getAll();
  if (!products.length) {
    products = SEED.map((p, i) => ({ ...p, id: uid(), order: i }));
    for (const p of products) await put(p);
  }
  await fixOrder();
  const saved = await getMeta();
  S = normalize(saved || {});
  // Quien venía de la versión anterior pasa una vez al diseño nuevo (3 sabores por página)
  if (saved && !saved.v3) { Object.assign(S, TEMPLATES[0].set, { v3: true }); scheduleSave(); }
  myDesigns = await getMetaKey('designs') || [];
  customFonts = await getMetaKey('fonts') || [];
  await Promise.all(customFonts.map(f => registerFont(f).catch(() => {})));
  buildDesignUI();
  fillSettings();
  $('designPanel').classList.add('closed');
  render();
  fillAutoColors();
}

// Calcula el color de cada sabor a partir de su foto (solo una vez por foto)
async function fillAutoColors() {
  let changed = false;
  for (const p of products) {
    if (p.image && p.autoColor === undefined) { p.autoColor = await dominantColor(p.image); await put(p); changed = true; }
  }
  if (changed) render();
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
init().catch(e => alert('No se pudo iniciar el catálogo: ' + e.message));
