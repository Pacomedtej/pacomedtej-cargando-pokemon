(function () {
  'use strict';

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
  const $iconSun    = document.getElementById('iconSun');
  const $iconMoon   = document.getElementById('iconMoon');

  // ---- Estado ----
  const state = { q: '', gen: '', weight: '', veredicto: '', types: new Set() };

  // ---- Utils ----
  const strip = (s) => (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const pad2  = (n) => String(n).padStart(2, '0');
  const pad3  = (n) => String(n).padStart(3, '0');

  function weightInRange(kg, range) {
    if (!range)            return true;
    if (range === 'ultra') return kg < 1;
    if (range === 'light') return kg >= 1   && kg < 10;
    if (range === 'mid')   return kg >= 10  && kg < 50;
    if (range === 'heavy') return kg >= 50  && kg < 200;
    if (range === 'super') return kg >= 200;
    return true;
  }

  // ---- Type chips ----
  function renderTypeChips() {
    $typesScr.innerHTML = Object.entries(TYPES).map(([slug, t]) => `
      <button type="button" class="type-chip" data-type="${slug}" style="--type-color:${t.color}">
        <img src="../pacodex/img/types/${slug}.png" alt="" onerror="this.style.display='none'">
        ${t.name}
      </button>
    `).join('');
    $typesScr.querySelectorAll('.type-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.type;
        state.types.has(t) ? state.types.delete(t) : state.types.add(t);
        btn.classList.toggle('is-active');
        render();
      });
    });
  }

  // ---- Filters ----
  function applyFilters() {
    const q = strip(state.q.trim());
    return EPISODES.filter(ep => {
      if (state.gen && String(ep.generation) !== state.gen) return false;
      if (!weightInRange(ep.weight_kg, state.weight)) return false;
      if (state.veredicto === 'cargado' && !ep.cargado) return false;
      if (state.veredicto === 'no' && ep.cargado !== false) return false;
      if (state.types.size > 0 && !ep.types.some(t => state.types.has(t))) return false;
      if (q && !strip(ep.name).includes(q)) return false;
      return true;
    }).sort((a, b) => a.ep - b.ep);
  }

  // ---- HTML helpers ----
  function typePillHTML(slug) {
    const t = TYPES[slug];
    if (!t) return '';
    return `<span class="type-pill" style="--type-color:${t.color}">
      <img src="../pacodex/img/types/${slug}.png" alt="" onerror="this.style.display='none'">
      ${t.name}
    </span>`;
  }

  function cardHTML(ep, idx) {
    const types = ep.types.map(typePillHTML).join('');
    const vCls  = ep.cargado ? 'veredicto-strip--si' : 'veredicto-strip--no';
    const vTxt  = ep.cargado ? '✅ Cargado' : '❌ No cargado';
    return `
      <article class="card" data-ep="${ep.ep}" style="--i:${idx}" tabindex="0" role="button" aria-label="${ep.name}, episodio ${ep.ep}">
        <div class="thumb-wrap">
          <img src="${ep.thumbnail}" alt="${ep.name}" loading="lazy" onerror="this.style.display='none'">
          <span class="ep-badge">Ep. ${pad2(ep.ep)}</span>
          <span class="play-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </div>
        <div class="card-body">
          <div class="card-name">${ep.name}</div>
          <div class="card-weight">⚖️ ${ep.weight_kg} kg</div>
          <div class="card-types">${types}</div>
        </div>
        <div class="veredicto-strip ${vCls}">${vTxt}</div>
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
    $grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => openModal(Number(card.dataset.ep)));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openModal(Number(card.dataset.ep));
      });
    });
  }

  // ---- Modal ----
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
    const ep = EPISODES.find(x => x.ep === epNum);
    if (!ep) return;

    $modalTitle.textContent   = ep.name;
    $modalEp.textContent      = `Ep. ${pad2(ep.ep)} · #${pad3(ep.id)}`;
    $modalThumb.src           = ep.thumbnail;
    $modalThumb.alt           = ep.name;
    $modalThumb.onerror       = () => { $modalThumb.style.display = 'none'; };
    $modalThumb.style.display = '';

    const vCls = ep.cargado ? 'veredicto--si' : 'veredicto--no';
    const vTxt = ep.cargado ? '✅ Cargado' : '❌ No cargado';
    $modalMeta.innerHTML = `
      <span class="modal-weight">⚖️ <strong>${ep.weight_kg} kg</strong></span>
      <span class="veredicto-pill ${vCls}">${vTxt}</span>
    `;

    $modalTypes.innerHTML = ep.types.map(typePillHTML).join('');

    const html = Object.entries(SOCIAL_META)
      .filter(([k]) => ep.links[k] && ep.links[k].trim() !== '')
      .map(([k, m]) => `
        <a class="social-btn ${m.cls}" href="${ep.links[k]}" target="_blank" rel="noopener">
          ${m.icon}<span>${m.label}</span>
        </a>`).join('');

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
    render();
  });

  // ---- Theme ----
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'dark' ? '#1a1a1a' : '#f9c92b');
    $iconSun.style.display  = t === 'dark' ? 'none' : '';
    $iconMoon.style.display = t === 'dark' ? '' : 'none';
    try { localStorage.setItem('cargando-theme', t); } catch (e) {}
  }
  const saved = (() => { try { return localStorage.getItem('cargando-theme'); } catch (e) { return null; } })() || 'light';
  applyTheme(saved);
  $themeBtn.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  // ---- Init ----
  renderTypeChips();
  render();
})();
