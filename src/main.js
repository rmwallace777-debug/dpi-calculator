/**
 * DPI Calculator — Main Entry
 * Handles URL param ingestion, dynamic metadata,
 * routing, and reactive form computation.
 */

// ---- Utils ----
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function parseQuery() {
  return Object.fromEntries(
    new URLSearchParams(window.location.search)
  );
}

// ---- DOM References ----
const elTitle = $('#page-title');
const elLead = $('#page-lead');
const elMeta = $('#result-meta');
const elValue = $('#dpi-value');
const elCopy = $('#copy-btn');
const elReset = $('#reset-btn');
const elCanonical = $('#canonical');
const elSchema = $('#jsonld-schema');

const inpW = $('#pixel-width');
const inpH = $('#pixel-height');
const inpD = $('#diagonal');

// ---- Routing / Metadata ----
const routes = {
  default: {
    h1: 'Free DPI Calculator — Calculate Dot Per Inch (PPI) Instantly',
    lead: 'A simple, browser-based DPI & PPI calculator. Enter pixel dimensions and physical size to instantly get dot-per-inch density for monitors, prints, and images.',
    title: 'Free DPI Calculator — Calculate Dot Per Inch (PPI) Instantly',
    desc: 'Calculate dots per inch (DPI) instantly. Enter resolution & physical size to get PPI for screens, prints, photographs, and design mockups. 100% free, no sign-up.',
    keywords: ['DPI calculator', 'PPI calculator', 'dots per inch', 'screen resolution', 'print DPI', 'pixel density calculator']
  },
  monitor: {
    h1: 'Free Monitor DPI Calculator — Calculate Screen Pixel Density (PPI)',
    lead: 'Find the precise pixel density of your monitor, laptop, or tablet. Compare sharpness across displays with our exact screen DPI tool.',
    title: 'Monitor DPI Calculator — Find Screen PPI for Laptops, Monitors & Tablets',
    desc: 'Calculate monitor DPI/PPI from resolution and screen size. Compare sharpness across laptops, monitors, tablets, and phones.',
    keywords: ['monitor DPI', 'screen PPI', 'laptop pixel density', 'display sharpness', ' monitor resolution calculator']
  },
  print: {
    h1: 'Print DPI Calculator — Calculate PPI for Photos, Posters & Scans',
    lead: 'Check whether your photo, scan, or artwork will print crisp at a physical size. Get the exact pixel density before you send files to the printer.',
    title: 'Print DPI Calculator — Calculate PPI for Photos, Posters & Scans',
    desc: 'Calculate print DPI / PPI from pixel dimensions and physical print size. Ideal for photos, posters, booklets, and scanning.',
    keywords: ['print DPI', 'photo PPI calculator', 'printing pixel density', 'scan DPI', 'poster PPI']
  },
  image: {
    h1: 'Image PPI Calculator — Check Existing File Pixel Density',
    lead: 'Determine the pixels-per-inch density of any image file against a target print size. Avoid blurry prints with accurate PPI checks.',
    title: 'Image PPI Calculator — Check File Pixel Density for Print & Screen',
    desc: 'Check the pixel density (PPI/DPI) of an image file against print size. Avoid blurry prints and screen scale issues.',
    keywords: ['image PPI', 'picture pixels per inch', 'file DPI check', 'image pixel density']
  }
};

function classifyQuery(query) {
  const q = JSON.stringify(query).toLowerCase();
  if (/monitor|laptop|screen|phone|tablet|display/.test(q)) return 'monitor';
  if (/print|photo|scan|poster|canvas|printer/.test(q)) return 'print';
  if (/image|file|\.jpg|\.png/.test(q)) return 'image';
  return 'default';
}

function applyRoute(route) {
  const r = routes[route];
  if (!r) return;

  // Title & meta description
  document.title = r.title;
  const metaDesc = document.querySelector('meta[name="description"]') || (() => {
    const m = document.createElement('meta');
    m.name = 'description';
    document.head.appendChild(m);
    return m;
  })();
  metaDesc.setAttribute('content', r.desc);
  metaDesc.setAttribute('name', 'description');

  // Canonical self-reference
  if (elCanonical) {
    elCanonical.setAttribute('href', window.location.origin + window.location.pathname + window.location.search);
  }

  // JSON-LD update
  if (elSchema) {
    const ld = JSON.parse(elSchema.textContent);
    ld.name = r.title;
    ld.description = r.desc;
    ld.url = window.location.origin + window.location.pathname + window.location.search;
    elSchema.textContent = JSON.stringify(ld);
  }

  // Headings
  if (elTitle) elTitle.textContent = r.h1;
  if (elLead) elLead.textContent = r.lead;
}

// ---- Calculation ----
let parsed = {};

function prefill(query) {
  if (query.width && query.height) {
    inpW.value = query.width;
    inpH.value = query.height;
  }
  if (query.diagonal) inpD.value = query.diagonal;

  // Special case: canvas=WxH (interpret as inches)
  if (query.canvas && /^\d+[x××]\d+$/i.test(query.canvas)) {
    const [cW, cH] = query.canvas.toLowerCase().replace('×', 'x').split('x');
    inpW.value = Math.round(parseInt(cW, 10) * 300); // typical print at 300 PPI
    inpH.value = Math.round(parseInt(cH, 10) * 300);
    inpD.value = Math.sqrt((cW * cW) + (cH * cH)).toFixed(1);
  }
}

function compute() {
  const w = parseFloat(inpW.value);
  const h = parseFloat(inpH.value);
  const d = parseFloat(inpD.value);

  if (!w || !h || !d || w <= 0 || h <= 0 || d <= 0) {
    elValue.textContent = '—';
    elMeta.textContent = 'Enter values to calculate';
    return null;
  }

  const diagonalPx = Math.sqrt(w * w + h * h);
  const ppi = diagonalPx / d;
  if (!Number.isFinite(ppi)) {
    elValue.textContent = 'Error';
    elMeta.textContent = 'Check input values.';
    return null;
  }

  const ppiRounded = Math.round(ppi * 100) / 100;
  const ci = 30 / ppiRounded;

  elValue.textContent = ppiRounded.toLocaleString(undefined, { maximumFractionDigits: 2 });
  elMeta.textContent = `Diagonal: ${Math.round(diagonalPx)} px (hypotenuse)`;

  // Tooltip copy
  elCopy.dataset.text = `${ppiRounded.toLocaleString(undefined, { maximumFractionDigits: 2 })} DPI (PPI)`;
  return { w, h, d, ppi: ppiRounded, ci };
}

function initHandlers() {
  const recalc = () => compute();
  $$('.input').forEach(i => i.addEventListener('input', recalc));

  elReset.addEventListener('click', () => {
    inpW.value = ''; inpH.value = ''; inpD.value = '';
    compute();
    inpW.focus();
  });

  elCopy.addEventListener('click', async () => {
    const text = elCopy.dataset.text || elValue.textContent;
    try {
      await navigator.clipboard.writeText(text);
      const prev = elCopy.textContent;
      elCopy.textContent = 'Copied!';
      setTimeout(() => (elCopy.textContent = prev), 1400);
    } catch {
      elCopy.textContent = 'Select + copy';
    }
  });
}

// ---- Boot ----
parsed = parseQuery();
const route = classifyQuery(parsed);
applyRoute(route);
prefill(parsed);
initHandlers();
compute();
