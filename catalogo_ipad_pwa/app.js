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
  typewriter: ['Máquina de escribir', '"American Typewriter","Courier New",monospace']
};

const PRESETS = [
  { name: 'Morado', accent: '#59427c', textColor: '#24212a', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f6f4f8' },
  { name: 'Noche', accent: '#c9a45c', textColor: '#f1ece2', pageBg: '#17151c', cardBg: '#24212b', imageBg: '#f4f1ea' },
  { name: 'Menta', accent: '#1f7a64', textColor: '#1d2a26', pageBg: '#ffffff', cardBg: '#f6fbf9', imageBg: '#ffffff' },
  { name: 'Coral', accent: '#d2553f', textColor: '#2a201e', pageBg: '#fffaf6', cardBg: '#ffffff', imageBg: '#fbf0ea' },
  { name: 'Océano', accent: '#2457a6', textColor: '#1b2333', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f0f4fa' },
  { name: 'Minimal', accent: '#222222', textColor: '#222222', pageBg: '#ffffff', cardBg: '#ffffff', imageBg: '#f4f4f4' }
];

const DEFAULTS = {
  title: 'Catálogo de tabacos de cachimba', subtitle: 'Listado de sabores', footerText: '', edition: '', logo: '',
  paper: 'A4', orientation: 'portrait', margin: 10, printerMargin: 0,
  header: 'all', pageNumbers: true, cover: false, coverStyle: 'solid',
  cols: 3, rows: 3, gap: 5, sort: 'manual', groupByBrand: 'no',
  layout: 'vertical', cardStyle: 'border', photoSize: 58, imageFit: 'contain', align: 'left', radius: 3,
  showPhotos: true, showBrand: true, showDesc: true, showFormat: true, showRefs: true, showPrice: true, showBadge: true, upperName: false,
  ...PRESETS[0], headingFont: 'system', bodyFont: 'system', fontScale: 100
};
delete DEFAULTS.name;
const NUM_KEYS = new Set(['cols', 'rows', 'gap', 'margin', 'photoSize', 'radius', 'fontScale', 'printerMargin']);

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

// Reduce la foto para que ocupe poco (las de la cámara del iPad pesan varios MB)
async function compressImage(file, maxSide, keepTransparency) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d');
    const png = keepTransparency && /png|gif|webp|svg/.test(file.type);
    if (!png) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85);
  } catch {
    return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function formatPrice(p) {
  const s = String(p || '').trim();
  return /^\d+([.,]\d{1,2})?$/.test(s) ? s.replace('.', ',') + ' €' : s;
}

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
  if (S.logo) $('logoPreview').src = S.logo; else $('logoPreview').removeAttribute('src');
}

function buildDesignUI() {
  document.querySelectorAll('.fontsel').forEach(sel => {
    sel.innerHTML = Object.entries(FONTS).map(([k, [label, stack]]) => `<option value="${k}" style="font-family:${esc(stack)}">${label}</option>`).join('');
  });
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
  const gap = S.gap, cols = S.cols, rows = S.rows;
  const cardW = (iw - (cols - 1) * gap) / cols;
  // La primera página es la más baja (encabezado grande); con ella se fija el alto de tarjeta
  const cardH = Math.max(15, (avail(0) - (rows - 1) * gap) / rows);
  return { w, h, pm, pad, pw, ph, iw, ih, foot, head, avail, gap, cols, cardW, cardH };
}

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
  const fs = S.fontScale / 100, lh = pt => pt * fs * PT;
  const pad = S.cardStyle === 'none' ? 0 : 2.5;
  const border = { border: 0.6, accent: 1.2 }[S.cardStyle] || 0;
  const inW = g.cardW - 2 * pad, inH = g.cardH - 2 * pad - border;
  const horiz = S.layout === 'horizontal', photo = S.showPhotos;
  let phStyle = '', textW = inW, textH = inH;
  if (photo) {
    if (horiz) { const pw = inW * S.photoSize / 100; phStyle = `flex-basis:${mm(pw)};width:${mm(pw)}`; textW = inW - pw - 3; }
    else { const ph = inH * S.photoSize / 100; phStyle = `height:${mm(ph)}`; textH = inH - ph - 2; }
  }
  const badge = S.showBadge && p.isNew;
  const left = [S.showFormat && p.format, S.showRefs && p.reference && 'Ref. ' + p.reference].filter(Boolean).map(esc).join(' · ');
  const price = S.showPrice && p.price ? esc(formatPrice(p.price)) : '';
  const hasMeta = !!(left || price);
  // Estimación de cuántas líneas de descripción caben para recortarla limpiamente con «…»
  const brandH = S.showBrand && p.brand ? lh(6.5) * 1.45 : 0;
  const badgeH = badge && !photo ? lh(6) * 1.3 + 2.2 : 0;
  const nameLines = Math.min(2, Math.max(1, Math.ceil(String(p.name || '').length * lh(10.5) * (S.upperName ? 0.68 : 0.58) / Math.max(textW, 1))));
  const nameH = nameLines * lh(10.5) * 1.2 + 1.6;
  const metaH = hasMeta ? lh(9) * 1.25 + 1.6 : 0;
  const descLines = Math.floor((textH - brandH - badgeH - nameH - metaH - 0.6) / (lh(7.8) * 1.3));
  const badgeEl = badge ? `<div class="c-badge${photo ? '' : ' in'}">Novedad</div>` : '';
  return `<div class="c-card${horiz ? ' h' : ''}">${photo ? badgeEl : ''}` +
    (photo ? `<div class="c-ph" style="${phStyle}">${p.image ? `<img src="${esc(imgUrl(p.image))}" alt="">` : ''}</div>` : '') +
    `<div class="c-tx">${photo ? '' : badgeEl}` +
    (brandH ? `<div class="c-brand">${esc(p.brand)}</div>` : '') +
    `<div class="c-name">${esc(p.name)}</div>` +
    (S.showDesc && p.description && descLines > 0 ? `<div class="c-desc" style="-webkit-line-clamp:${descLines}">${esc(p.description)}</div>` : '') +
    (hasMeta ? `<div class="c-meta"><span>${left}</span>${price ? `<b class="c-price">${price}</b>` : ''}</div>` : '') +
    `</div></div>`;
}

function pageHTML(items, i, total, g) {
  const head = g.head(i), full = head === HEAD_FULL;
  let html = `<div class="page" style="width:${mm(g.pw)};height:${mm(g.ph)};padding:${mm(g.pad)}">`;
  if (head) {
    html += `<div class="p-head ${full ? 'full' : 'run'}" style="height:${full ? 19 : 8}mm;margin-bottom:${full ? 5 : 3}mm;padding-bottom:${full ? 2.5 : 1.5}mm">` +
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
  return `<div class="page cover ${S.coverStyle === 'solid' ? 'solid' : 'light'}" style="width:${mm(g.pw)};height:${mm(g.ph)};padding:${mm(g.pad)}">` +
    (S.logo ? `<img class="cv-logo" src="${esc(imgUrl(S.logo))}" alt="">` : '') + mosaic +
    `<div class="cv-title">${esc(S.title)}</div>` +
    (S.subtitle ? `<div class="cv-sub">${esc(S.subtitle)}</div>` : '') +
    (S.edition ? `<div class="cv-line"></div><div class="cv-ed">${esc(S.edition)}</div>` : '') +
    (S.footerText ? `<div class="cv-foot" style="bottom:${mm(g.pad + 2)}">${esc(S.footerText)}</div>` : '') +
    `</div>`;
}

let renderTimer;
function scheduleRender() { clearTimeout(renderTimer); renderTimer = setTimeout(renderCatalog, 80); }

function renderCatalog() {
  clearTimeout(renderTimer);
  const g = geometry(), list = catalogProducts(), pages = paginate(list, g);
  const root = $('pages');
  root.className = `pages st-${S.cardStyle}${S.upperName ? ' up' : ''}${S.align === 'center' ? ' al-center' : ''}`;
  const vars = {
    '--c-accent': S.accent, '--c-text': S.textColor, '--c-page': S.pageBg, '--c-card': S.cardBg, '--c-imgbg': S.imageBg,
    '--c-head': (FONTS[S.headingFont] || FONTS.system)[1], '--c-body': (FONTS[S.bodyFont] || FONTS.system)[1],
    '--c-fs': S.fontScale / 100, '--c-radius': S.radius + 'mm', '--c-fit': S.imageFit, '--c-align': S.align
  };
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.innerHTML = (S.cover ? coverHTML(g, list) : '') + pages.map((items, i) => pageHTML(items, i, pages.length, g)).join('');
  $('pageRule').textContent = `@page{size:${g.w}mm ${g.h}mm;margin:${g.pm}mm}`;
  document.documentElement.style.setProperty('--accent', S.accent);
  const hidden = products.length - list.length, total = pages.length + (S.cover ? 1 : 0);
  $('stats').textContent = `${list.length} producto${list.length === 1 ? '' : 's'} · ${total} página${total === 1 ? '' : 's'}` + (hidden ? ` · ${hidden} oculto${hidden === 1 ? '' : 's'}` : '');
  updateZoom();
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
      `<div class="info"><strong>${esc(p.brand)} · ${esc(p.name)}</strong>` +
      `<small>${esc([p.reference || 'Sin referencia', p.format, formatPrice(p.price)].filter(Boolean).join(' · '))}</small>` +
      `${p.isNew ? '<span class="tag">Novedad</span>' : ''}${p.hidden ? '<span class="tag">Oculto</span>' : ''}</div>` +
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
  ['editId', 'brand', 'name', 'desc', 'pack', 'ref', 'price'].forEach(id => $(id).value = '');
  $('isNew').checked = $('isHidden').checked = false;
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
  $('isNew').checked = !!p.isNew;
  $('isHidden').checked = !!p.hidden;
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

function printCatalog() {
  showTab('catalogo');
  renderCatalog();
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

$('resetDesign').onclick = () => {
  if (!confirm('¿Volver al diseño predeterminado? Se conservan el título, los textos y el logotipo.')) return;
  S = { ...DEFAULTS, title: S.title, subtitle: S.subtitle, footerText: S.footerText, edition: S.edition, logo: S.logo };
  fillSettings(); renderCatalog(); scheduleSave();
};

$('photo').onchange = () => {
  const f = $('photo').files[0];
  if (!f) return;
  pendingImage = compressImage(f, 1400, false);
  pendingImage.then(showPhotoPreview);
};
$('photoRemove').onclick = () => { pendingImage = ''; $('photo').value = ''; showPhotoPreview(''); };

$('clearForm').onclick = clearForm;
$('saveProduct').onclick = async () => {
  const brand = $('brand').value.trim(), name = $('name').value.trim();
  if (!brand || !name) { alert('Introduce la marca y el nombre.'); return; }
  const id = $('editId').value || uid(), old = products.find(p => p.id === id);
  const image = pendingImage === undefined ? old?.image || '' : await pendingImage;
  const order = old ? old.order : products.reduce((m, p) => Math.max(m, p.order ?? 0), -1) + 1;
  await put({
    ...old, id, order, brand, name, image,
    description: $('desc').value.trim(), format: $('pack').value.trim(), reference: $('ref').value.trim(),
    price: $('price').value.trim(), isNew: $('isNew').checked, hidden: $('isHidden').checked
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
  const blob = new Blob([JSON.stringify({ version: 2, products, settings: S }, null, 2)], { type: 'application/json' });
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
    if (data.settings) { S = normalize({ ...S, ...normalize(data.settings) }); await saveMeta(); fillSettings(); }
    await refresh();
    toast('Copia restaurada correctamente');
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
  S = normalize(await getMeta() || {});
  buildDesignUI();
  fillSettings();
  $('designPanel').classList.add('closed');
  render();
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
init().catch(e => alert('No se pudo iniciar el catálogo: ' + e.message));
