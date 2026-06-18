(function () {
  'use strict';

  // ----------- Config: API -----------
  // Auto por hostname: en local apunta al backend de XAMPP/artisan,
  // en producción al admin. Sin cambios manuales al desplegar.
  const API_BASE = (() => {
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '') {
      return 'http://127.0.0.1:8000/api';
    }
    return 'https://admin.pacomedtej.com/api';
  })();
  const SERIE_ID = 3; // "Cargando el Pokémon"

  // ---- Refs ----
  const $grid       = document.getElementById('grid');
  const $counter    = document.getElementById('counter');
  const $search     = document.getElementById('searchInput');
  const $gen        = document.getElementById('genSelect');
  const $weight     = document.getElementById('weightSelect');
  const $veredicto  = document.getElementById('veredictoSelect');
  const $typesScr   = document.getElementById('typesScroller');
  const $clearTypes = document.getElementById('clearTypes');
  const $modalBack  = document.getElementById('modalBack');
  const $modalClose = document.getElementById('modalClose');
  const $modalThumb = document.getElementById('modalThumb');
  const $modalTitle = document.getElementById('modalTitle');
  const $modalEp    = document.getElementById('modalEp');
  const $modalMeta  = document.getElementById('modalMeta');
  const $modalTypes = document.getElementById('modalTypes');
  const $modalSocs  = document.getElementById('modalSocials');
  const $themeBtn   = document.getElementById('themeToggle');
  const $loader     = document.querySelector('.pokeball-wrapper');

  // ---- Estado ----
  const state = { q: '', gen: '', weight: '', veredicto: '', types: new Set() };

  // ----------- Datos (se llenan desde el endpoint o el fallback estático) -----------
  // typeMap: clave (string) -> { name, color }. La clave es el id de tipo (API) o el slug (estático).
  // pokedex: lista normalizada de episodios.
  let typeMap = new Map();
  let pokedex = [];

  // ---- Utils ----
  const strip = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const pad2  = (n) => String(n).padStart(2, '0');
  const pad3  = (n) => String(n).padStart(3, '0');
  const toBool = (v) => v === true || v === 1 || v === '1' || v === 'true';

  function weightInRange(kg, range) {
    if (!range)            return true;
    if (kg == null)        return false;
    if (range === 'ultra') return kg < 1;
    if (range === 'light') return kg >= 1   && kg < 10;
    if (range === 'mid')   return kg >= 10  && kg < 50;
    if (range === 'heavy') return kg >= 50  && kg < 200;
    if (range === 'super') return kg >= 200;
    return true;
  }

  // ---- Type chips (solo color, sin icono PNG) ----
  function renderTypeChips() {
    $typesScr.innerHTML = [...typeMap.entries()].map(([key, t]) => `
      <button type="button" class="type-chip" data-type="${key}" style="--type-color:${t.color}">
        ${t.name}
      </button>
    `).join('');
    $clearTypes.style.display = state.types.size > 0 ? 'inline-block' : 'none';
    $typesScr.querySelectorAll('.type-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.type;
        state.types.has(key) ? state.types.delete(key) : state.types.add(key);
        btn.classList.toggle('is-active');
        $clearTypes.style.display = state.types.size > 0 ? 'inline-block' : 'none';
        render();
      });
    });
  }

  // ---- Filters ----
  function applyFilters() {
    const q = strip(state.q.trim());
    return pokedex.filter(ep => {
      if (state.gen && String(ep.generation) !== state.gen) return false;
      if (!weightInRange(ep.weight_kg, state.weight)) return false;
      // El veredicto solo aplica a episodios publicados (los "Próximamente" no tienen resultado aún)
      if (state.veredicto === 'cargado' && !(ep.published && ep.cargado)) return false;
      if (state.veredicto === 'no' && !(ep.published && ep.cargado === false)) return false;
      if (state.types.size > 0 && !ep.types.some(t => state.types.has(t))) return false;
      if (q && !strip(ep.name).includes(q)) return false;
      return true;
    }).sort((a, b) => a.ep - b.ep);
  }

  // ---- HTML helpers ----
  function typePillHTML(key) {
    const t = typeMap.get(key);
    if (!t) return '';
    return `<span class="type-pill" style="--type-color:${t.color}">${t.name}</span>`;
  }

  function cardHTML(ep, idx) {
    const types = ep.types.map(typePillHTML).join('');

    // Sin thumbnail → patrón rayado; si la imagen falla, onerror aplica el patrón.
    const thumb = ep.thumbnail
      ? `<img src="${ep.thumbnail}" alt="${ep.name}" loading="lazy"
              onerror="this.closest('.thumb-wrap').classList.add('is-empty'); this.remove();">`
      : '';
    const wrapCls = ep.thumbnail ? 'thumb-wrap' : 'thumb-wrap is-empty';

    // Próximamente (no publicado) → badge, sin play, sin veredicto y no clicable.
    const badge = ep.published
      ? `<span class="play-badge" aria-hidden="true">
           <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
         </span>`
      : `<span class="soon-badge">Próximamente</span>`;

    const veredicto = ep.published
      ? `<div class="veredicto-strip ${ep.cargado ? 'veredicto-strip--si' : 'veredicto-strip--no'}">${ep.cargado ? '✅ Cargado' : '❌ No cargado'}</div>`
      : '';

    const interactive = ep.published
      ? `tabindex="0" role="button" aria-label="${ep.name}, episodio ${ep.ep}"`
      : 'aria-label="' + ep.name + ', próximamente"';

    return `
      <article class="card${ep.published ? '' : ' is-upcoming'}" data-ep="${ep.ep}" style="--i:${idx}" ${interactive}>
        <div class="${wrapCls}">
          ${thumb}
          <span class="ep-badge">Ep. ${pad2(ep.ep)}</span>
          ${badge}
        </div>
        <div class="card-body">
          <div class="card-name">${ep.name}</div>
          <div class="card-weight">⚖️ ${ep.weight_kg != null ? ep.weight_kg + ' kg' : '—'}</div>
          <div class="card-types">${types}</div>
        </div>
        ${veredicto}
      </article>
    `;
  }

  function render() {
    const list = applyFilters();
    const n = list.length;
    $counter.innerHTML = `<b>${n}</b> episodio${n === 1 ? '' : 's'}`;
    if (n === 0) {
      $grid.innerHTML = `
        <div class="empty">
          <strong>Sin resultados</strong>
          Ajusta los filtros para ver más episodios.
        </div>`;
      return;
    }
    $grid.innerHTML = list.map((ep, i) => cardHTML(ep, i)).join('');
    // Click → modal (solo episodios publicados; los "Próximamente" no son clicables)
    $grid.querySelectorAll('.card:not(.is-upcoming)').forEach(card => {
      card.addEventListener('click', () => openModal(Number(card.dataset.ep)));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openModal(Number(card.dataset.ep));
      });
    });
  }

  // ---- Modal ----
  // Claves en minúsculas para casar con platform.name del endpoint.
  const SOCIAL_META = {
    youtube:   { label: 'YouTube',   cls: 'social-yt',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.7 3.6 12 3.6 12 3.6s-7.7 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8 0 12 0 12s0 4 .5 5.8c.3 1 1 1.8 2 2.1 1.8.5 9.5.5 9.5.5s7.7 0 9.5-.5c1-.3 1.7-1.1 2-2.1.5-1.8.5-5.8.5-5.8s0-4-.5-5.8zM9.6 15.6V8.4l6.4 3.6-6.4 3.6z"/></svg>' },
    tiktok:    { label: 'TikTok',    cls: 'social-tt',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 6.3a5.7 5.7 0 0 1-3.4-1.1 5.7 5.7 0 0 1-2.2-3.6h-3.4v13.6a2.7 2.7 0 1 1-2.7-2.7c.3 0 .6 0 .9.1V9.2a6.1 6.1 0 1 0 5.2 6V9.4a9 9 0 0 0 5.6 1.9V8a5.6 5.6 0 0 1 0-1.7z"/></svg>' },
    instagram: { label: 'Instagram', cls: 'social-ig',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1" fill="currentColor"/></svg>' },
    facebook:  { label: 'Facebook',  cls: 'social-fb',
      icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-3h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 3h-2.2v7A10 10 0 0 0 22 12z"/></svg>' }
  };

  function openModal(epNum) {
    const ep = pokedex.find(x => x.ep === epNum);
    if (!ep) return;

    $modalTitle.textContent   = ep.name;
    $modalEp.textContent      = `Ep. ${pad2(ep.ep)} · #${pad3(ep.id)}`;
    $modalThumb.src           = ep.thumbnail || '';
    $modalThumb.alt           = ep.name;
    $modalThumb.onerror       = () => { $modalThumb.style.display = 'none'; };
    $modalThumb.style.display = ep.thumbnail ? '' : 'none';

    const vCls = ep.cargado ? 'veredicto--si' : 'veredicto--no';
    const vTxt = ep.cargado ? '✅ Cargado' : '❌ No cargado';
    $modalMeta.innerHTML = `
      <span class="modal-weight">⚖️ <strong>${ep.weight_kg != null ? ep.weight_kg + ' kg' : '—'}</strong></span>
      <span class="veredicto-pill ${vCls}">${vTxt}</span>
    `;

    $modalTypes.innerHTML = ep.types.map(typePillHTML).join('');

    const html = (ep.platforms || [])
      .filter(pl => pl.url && pl.url.trim() !== '')
      .map(pl => {
        const meta = SOCIAL_META[(pl.name || '').toLowerCase()];
        if (!meta) return '';
        return `
          <a class="social-btn ${meta.cls}" href="${pl.url}" target="_blank" rel="noopener">
            ${meta.icon}<span>${meta.label}</span>
          </a>`;
      }).join('');

    $modalSocs.innerHTML = html || `
      <p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:10px 0;margin:0">
        Próximamente en redes.
      </p>`;

    $modalBack.classList.add('is-open');
    $modalBack.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    $modalBack.classList.remove('is-open');
    $modalBack.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $modalClose.addEventListener('click', closeModal);
  $modalBack.addEventListener('click', (e) => { if (e.target === $modalBack) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $modalBack.classList.contains('is-open')) closeModal();
  });

  // ---- Filter events ----
  let qTimer;
  $search.addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; render(); }, 120);
  });
  $gen.addEventListener('change',       (e) => { state.gen       = e.target.value; render(); });
  $weight.addEventListener('change',    (e) => { state.weight    = e.target.value; render(); });
  $veredicto.addEventListener('change', (e) => { state.veredicto = e.target.value; render(); });
  $clearTypes.addEventListener('click', () => {
    state.types.clear();
    $typesScr.querySelectorAll('.type-chip').forEach(c => c.classList.remove('is-active'));
    $clearTypes.style.display = 'none';
    render();
  });

  // ---- Theme ----
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#1a1a1a' : '#f9c92b');
    try { localStorage.setItem('cargando-theme', t); } catch (e) {}
  }
  const saved = (() => { try { return localStorage.getItem('cargando-theme'); } catch (e) { return null; } })() || 'light';
  applyTheme(saved);
  $themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ----------- Carga de datos -----------
  async function fetchData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
    const json = await res.json();
    return json.data || [];
  }

  function hasValidPlatform(platforms) {
    return (platforms || []).some(pl => pl.url && pl.url.trim() !== '');
  }

  function normalizeVideo(v) {
    const p = v.pokemon || {};
    const meta = v.metadata || {};
    return {
      id:           p.num_global,
      name:         p.name,
      generation:   p.generation_id,
      weight_kg:    p.weight_kg != null ? Number(p.weight_kg) : null,
      cargado:      toBool(meta.pokemon_cargado),
      types:        (p.types || []).map(t => String(t.id)),
      thumbnail:    v.thumbnail,
      platforms:    v.platforms || [],
      published:    v.is_published !== false,
      published_at: v.published_at || null
    };
  }

  // El número de episodio (ep) no viene de la API: se calcula por published_at
  // ascendente (más antiguo = Ep. 1). Los no publicados (sin fecha) van al final.
  function assignEpisodes(list) {
    const ordered = list.slice().sort((a, b) => {
      const da = a.published_at ? Date.parse(a.published_at) : Infinity;
      const db = b.published_at ? Date.parse(b.published_at) : Infinity;
      return da - db;
    });
    ordered.forEach((ep, i) => { ep.ep = i + 1; });
    return ordered;
  }

  // Fallback: convierte los datos estáticos (data.js) al formato interno.
  function loadFallback() {
    typeMap = new Map(Object.entries(TYPES).map(([slug, t]) => [slug, { name: t.name, color: t.color }]));
    pokedex = EPISODES.map(e => ({
      ep:         e.ep,
      id:         e.id,
      name:       e.name,
      generation: e.generation,
      weight_kg:  e.weight_kg,
      cargado:    e.cargado,
      types:      e.types,
      thumbnail:  e.thumbnail,
      platforms:  Object.entries(e.links || {})
                    .filter(([, url]) => url && url.trim() !== '')
                    .map(([name, url]) => ({ name, url })),
      published:  true
    }));
  }

  async function init() {
    try {
      // 1) Tipos de pokémon
      const dataTypes = await fetchData(`${API_BASE}/types`);
      // 2) Videos de esta serie
      const dataVideos = await fetchData(`${API_BASE}/videos?serie_id=${SERIE_ID}`);

      const list = dataVideos
        .filter(v => v.pokemon)
        .map(normalizeVideo)
        // Mostrar si está por publicarse (badge) o si tiene al menos una URL válida
        .filter(p => !p.published || hasValidPlatform(p.platforms));

      // Si la API no devuelve datos útiles → fallback estático
      if (!dataTypes.length || list.length === 0) {
        throw new Error('La API no devolvió datos; se usa el fallback estático.');
      }

      typeMap = new Map(dataTypes.map(t => [String(t.id), { name: t.name, color: t.color_hex }]));
      pokedex = assignEpisodes(list);
    } catch (err) {
      console.warn('Datos desde la API no disponibles, usando data.js:', err);
      loadFallback();
    } finally {
      renderTypeChips();
      render();
      if ($loader) $loader.style.display = 'none';
    }
  }

  // ---- Init ----
  init();
})();
