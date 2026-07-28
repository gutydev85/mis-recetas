/* Mi Recetario — app.js v5.1 */
/* Motor reescrito: audio estable, código modular, bugs corregidos */

'use strict';

// ===================== CONFIG =====================
const CONFIG = {
  VERSION: 5.1,
  STORAGE_KEYS: {
    categories: 'mr_categories',
    recipes: 'mr_recipes',
    timer: 'mr_timer_state',
    sound: 'mr_sound_enabled'
  },
  MAX_PHOTO_MB: 5,
  PHOTO_MAX_WIDTH: 800,
  PHOTO_QUALITY: 0.7,
  SAVE_DEBOUNCE_MS: 2000,
  SEARCH_DEBOUNCE_MS: 200,
  TIMER_TICK_MS: 250
};

// ===================== ICONS SVG =====================
const ICONS = {
  folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v2z"/></svg>',
  chef: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><path d="M6 17h12"/></svg>',
  utensils: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  clock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
};

// ===================== UTILS =====================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const byId = id => document.getElementById(id);

function escapeHtml(str) {
  if (str == null) return '';
  const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  return String(str).replace(/[&<>"']/g, c => map[c]);
}

function normalizeText(value) {
  return String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseLines(value) {
  return String(value ?? '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatTime(totalSeconds) {
  const v = Math.max(0, Math.floor(totalSeconds));
  const m = String(Math.floor(v / 60)).padStart(2, '0');
  const s = String(v % 60).padStart(2, '0');
  return m + ':' + s;
}

// ===================== AUDIO ENGINE =====================
const AudioEngine = (() => {
  let ctx = null;
  let enabled = true;
  let resumed = false;

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function resumeOnInteraction() {
    if (resumed) return;
    const c = getCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
    resumed = true;
  }
  ['click', 'touchstart', 'keydown'].forEach(evt => {
    document.addEventListener(evt, resumeOnInteraction, { once: true, passive: true });
  });

  function playTone(freq, duration, type, vol) {
    duration = duration || 0.25;
    type = type || 'sine';
    vol = vol || 0.25;
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start();
      osc.stop(c.currentTime + duration);
    } catch (e) {}
  }

  function playSequence(notes) {
    if (!enabled) return;
    try {
      const c = getCtx();
      if (!c) return;
      let t = 0;
      notes.forEach(([freq, dur, delay]) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, c.currentTime + t);
        gain.gain.setValueAtTime(0.25, c.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t + dur);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime + t);
        osc.stop(c.currentTime + t + dur);
        t += delay;
      });
    } catch (e) {}
  }

  function loadSetting() {
    try { enabled = localStorage.getItem(CONFIG.STORAGE_KEYS.sound) !== 'false'; } catch (e) {}
  }
  function saveSetting() {
    try { localStorage.setItem(CONFIG.STORAGE_KEYS.sound, enabled); } catch (e) {}
  }

  return {
    get enabled() { return enabled; },
    toggle() { enabled = !enabled; saveSetting(); return enabled; },
    success()  { playSequence([[523,0.18,0.18],[659,0.18,0.18],[784,0.25,0]]); },
    error()    { playTone(200, 0.3, 'sawtooth', 0.15); },
    delete()   { playTone(150, 0.2, 'sawtooth', 0.12); },
    check()    { playTone(880, 0.08, 'sine', 0.12); },
    uncheck()  { playTone(440, 0.08, 'sine', 0.08); },
    favOn()    { playTone(880, 0.1, 'sine', 0.15); setTimeout(() => playTone(1100, 0.15, 'sine', 0.15), 100); },
    favOff()   { playTone(660, 0.15, 'sine', 0.12); },
    tap()      { playTone(600, 0.05, 'sine', 0.08); },
    timerDone(){ playSequence([[880,0.3,0.35],[1100,0.3,0.35],[880,0.4,0]]); },
    loadSetting
  };
})();

// ===================== STATE =====================
const State = {
  categories: [],
  recipes: [],
  currentView: 'home',
  currentRecipeId: null,
  listFilter: { type: null, id: null, query: null },
  previousViewBeforeDetail: null,
  editingRecipeId: null,
  editingCategoryId: null,
  currentPhotoBase64: '',
  cameFromDetail: false,
  deferredPrompt: null,
  modalCallback: null,
  mainTimer: { seconds: 0, running: false, endAt: 0, interval: null },
  detailTimerInterval: null,
  get recipe() { return this.recipes.find(r => r.id === this.currentRecipeId) || null; },
  get category() { return this.categories.find(c => c.id === this.editingCategoryId) || null; }
};

// ===================== STORAGE =====================
const Storage = {
  load() {
    try {
      const cats = localStorage.getItem(CONFIG.STORAGE_KEYS.categories);
      const recs = localStorage.getItem(CONFIG.STORAGE_KEYS.recipes);
      if (cats) State.categories = JSON.parse(cats);
      if (recs) State.recipes = JSON.parse(recs);
    } catch (e) {
      console.error('Error cargando datos', e);
      State.categories = [];
      State.recipes = [];
    }
    this.normalizeAll();
  },

  save() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.categories, JSON.stringify(State.categories));
      localStorage.setItem(CONFIG.STORAGE_KEYS.recipes, JSON.stringify(State.recipes));
    } catch (e) {
      console.error(e);
      App.toast.show('Error guardando. Espacio lleno?', '⚠️');
    }
  },

  saveDebounced: debounce(() => Storage.save(), CONFIG.SAVE_DEBOUNCE_MS),

  normalizeRecipe(recipe) {
    if (!recipe) return;
    if (!Array.isArray(recipe.stepDone)) recipe.stepDone = [];
    if (!Array.isArray(recipe.timers)) recipe.timers = [];
    if (typeof recipe.notaFinal !== 'string') recipe.notaFinal = '';
    recipe.timers = recipe.timers.map((t, i) => {
      const durSec = Number.isFinite(t.durationSeconds)
        ? t.durationSeconds
        : ((parseInt(t.minutes || 0, 10) || 0) * 60 + (parseInt(t.seconds || 0, 10) || 0));
      return {
        id: t.id || generateId('t'),
        name: t.name || ('Cronómetro ' + (i + 1)),
        durationSeconds: durSec,
        remainingSeconds: Number.isFinite(t.remainingSeconds) ? t.remainingSeconds : durSec,
        running: !!t.running,
        endAt: t.endAt || 0
      };
    }).filter(t => t.durationSeconds > 0);
  },

  normalizeAll() {
    State.recipes.forEach(r => this.normalizeRecipe(r));
  },

  ensureStepState(recipe) {
    const steps = parseLines(recipe.pasos);
    if (!Array.isArray(recipe.stepDone)) recipe.stepDone = [];
    while (recipe.stepDone.length < steps.length) recipe.stepDone.push(false);
    if (recipe.stepDone.length > steps.length) recipe.stepDone.length = steps.length;
  }
};

// ===================== DOM CACHE =====================
const DOM = {};
function cacheDOM() {
  const ids = [
    'app','splash','installBanner','toast','toastIcon','toastText',
    'modalOverlay','modalTitle','modalText',
    'view-home','view-recipe-list','view-recipe-detail','view-recipe-form','view-category-form','view-settings','view-cook-mode',
    'searchBox','searchInput','searchClear','statsBar','categoriesList',
    'listTitle','listFab','recipeListContainer',
    'detailTitle','detailPhotoWrap','detailRecipeName','detailTime','detailCategory',
    'detailIngredients','detailSteps','detailTimersWrap','detailNoteWrap','detailFinalNote',
    'detailFavBtn','mainTimerBox','timerDisplay','timerPlayBtn',
    'recipeFormTitle','recipeName','recipeCategory','recipeIngredients','recipeSteps',
    'recipeTime','recipeFinalNote','photoPreview','photoInput','photoBtnText',
    'recipeTimersEditor','recipeDeleteBtn',
    'catFormTitle','catNameInput','catDeleteBtn',
    'soundToggle','soundDesc',
    'cookTitle','cookBody','cookStepNum','cookStepText','cookDots','cookNavDots',
    'cookPrevBtn','cookNextBtn','cookTtsBtn','cookQuickTimerWrap','cookQuickDisplay',
    'cookTimersPanel','cookTimersList','cookProgressBar',
    'cookIngredientsOverlay','cookIngredientsList'
  ];
  ids.forEach(id => DOM[id] = byId(id));
}

// ===================== NAVIGATION =====================
const Nav = {
  set(view) {
    $$('.view').forEach(v => v.classList.remove('active'));
    const el = byId('view-' + view);
    if (el) el.classList.add('active');
    State.currentView = view;
    if (DOM.app) DOM.app.scrollTop = 0;
    document.title = 'Mi Recetario';
  },

  home() { this.set('home'); App.render.categories(); },

  backFromDetail() {
    App.timer.clearMainInterval();
    App.timer.clearDetailInterval();
    const pv = State.previousViewBeforeDetail;
    if (pv) {
      if (pv.type === 'category' && pv.id != null) App.recipe.showList('category', pv.id);
      else if (pv.type === 'favorites') App.favorites.show();
      else if (pv.type === 'search' && pv.query) App.search.handle(pv.query);
      else this.home();
      State.previousViewBeforeDetail = null;
    } else {
      this.home();
    }
  },

  backFromForm() {
    if (State.cameFromDetail && State.editingRecipeId) {
      State.cameFromDetail = false;
      App.recipe.showDetail(State.editingRecipeId);
      return;
    }
    const f = State.listFilter;
    if (f.type === 'category' && f.id) App.recipe.showList('category', f.id);
    else if (f.type === 'favorites') App.favorites.show();
    else if (f.type === 'search' && f.query) App.search.handle(f.query);
    else this.home();
  }
};

// ===================== TOAST & MODAL =====================
const Toast = {
  _t: null,
  show(msg, icon) {
    icon = icon || '';
    if (!DOM.toast) return;
    DOM.toastIcon.textContent = icon;
    DOM.toastText.textContent = msg;
    DOM.toast.classList.add('show');
    clearTimeout(this._t);
    this._t = setTimeout(() => DOM.toast.classList.remove('show'), 2800);
  }
};

const Modal = {
  show(title, text, onConfirm) {
    if (!DOM.modalOverlay) return;
    DOM.modalTitle.textContent = title;
    DOM.modalText.textContent = text;
    State.modalCallback = onConfirm;
    DOM.modalOverlay.classList.add('active');
  },
  close() {
    if (!DOM.modalOverlay) return;
    DOM.modalOverlay.classList.remove('active');
    State.modalCallback = null;
  },
  confirm() {
    if (State.modalCallback) State.modalCallback();
    this.close();
  }
};

// ===================== RENDERERS =====================
const Render = {
  stats() {
    if (!DOM.statsBar) return;
    const total = State.recipes.length;
    const favs = State.recipes.filter(r => r.favorito).length;
    DOM.statsBar.innerHTML = '<span class="stat"><b>' + total + '</b> receta' + (total !== 1 ? 's' : '') + '</span>' +
      '<span class="stat"><b>' + favs + '</b> favorita' + (favs !== 1 ? 's' : '') + '</span>' +
      '<span class="stat"><b>' + State.categories.length + '</b> categoría' + (State.categories.length !== 1 ? 's' : '') + '</span>';
  },

  categories() {
    this.stats();
    if (!DOM.categoriesList) return;
    const frag = document.createDocumentFragment();

    if (State.categories.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="big-icon">' + ICONS.folderOpen + '</div><h3>No hay categorías</h3><p>Crea la primera con el botón +</p>';
      frag.appendChild(empty);
    } else {
      State.categories.forEach((cat, i) => {
        const count = State.recipes.filter(r => r.categoriaId === cat.id).length;
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.animationDelay = (i * 50) + 'ms';
        card.innerHTML = '<div class="icon-wrap">' + ICONS.folder + '</div>' +
          '<div style="flex:1;min-width:0">' +
            '<div class="name">' + escapeHtml(cat.nombre) + '</div>' +
            '<div class="count">' + count + ' receta' + (count !== 1 ? 's' : '') + '</div>' +
          '</div>' +
          '<div class="cat-actions">' +
            '<button class="header-btn" onclick="event.stopPropagation();App.category.form(\'' + cat.id + '\')" aria-label="Editar">' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>' +
            '</button>' +
          '</div>';
        card.addEventListener('click', () => App.recipe.showList('category', cat.id));
        frag.appendChild(card);
      });
    }

    const uncategorized = State.recipes.filter(r => !State.categories.some(c => c.id === r.categoriaId));
    if (uncategorized.length > 0) {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = '<div class="icon-wrap">' + ICONS.folderOpen + '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<div class="name">Sin categoría</div>' +
          '<div class="count">' + uncategorized.length + ' receta' + (uncategorized.length !== 1 ? 's' : '') + '</div>' +
        '</div>';
      card.addEventListener('click', () => App.recipe.showList('category', null));
      frag.appendChild(card);
    }

    DOM.categoriesList.innerHTML = '';
    DOM.categoriesList.appendChild(frag);
  },

  recipeList(list) {
    if (!DOM.recipeListContainer) return;
    if (list.length === 0) {
      DOM.recipeListContainer.innerHTML = '<div class="empty-state"><div class="big-icon">' + ICONS.utensils + '</div><h3>No hay recetas</h3><p>Agrega la primera con el botón +</p></div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((recipe, i) => {
      const cat = State.categories.find(c => c.id === recipe.categoriaId);
      const catName = cat ? cat.nombre : 'Sin categoría';
      const row = document.createElement('div');
      row.className = 'recipe-row';
      row.style.animationDelay = (i * 60) + 'ms';
      row.innerHTML = (recipe.fotoPath ? '<img class="recipe-thumb" src="' + recipe.fotoPath + '" alt="" loading="lazy">' : '<div class="recipe-thumb-placeholder">' + ICONS.chef + '</div>') +
        '<div class="info">' +
          '<div class="title">' + escapeHtml(recipe.nombre) + '</div>' +
          '<div class="meta">' + ICONS.clock + ' ' + catName + ' · ' + (recipe.tiempoMinutos || 0) + ' min</div>' +
        '</div>' +
        '<div class="row-actions">' +
          '<button class="fav-btn ' + (recipe.favorito ? 'active' : '') + '" data-id="' + recipe.id + '" aria-label="Favorito">' + ICONS.heart + '</button>' +
        '</div>';
      row.addEventListener('click', function(e) {
        if (e.target.closest('.fav-btn')) return;
        App.recipe.showDetail(recipe.id);
      });
      const favBtn = row.querySelector('.fav-btn');
      favBtn.addEventListener('click', function(e) { e.stopPropagation(); App.favorites.toggle(recipe.id); });
      frag.appendChild(row);
    });
    DOM.recipeListContainer.innerHTML = '';
    DOM.recipeListContainer.appendChild(frag);
  }
};

// ===================== SEARCH =====================
const Search = {
  handle(query) {
    const trimmed = query.trim();
    if (DOM.searchBox) DOM.searchBox.classList.toggle('has-text', !!trimmed);
    if (!trimmed) {
      State.listFilter = { type: null, id: null, query: null };
      Nav.home();
      return;
    }
    const needle = normalizeText(trimmed);
    const filtered = State.recipes.filter(r =>
      normalizeText(r.nombre).includes(needle) ||
      normalizeText(r.ingredientes).includes(needle) ||
      normalizeText(r.pasos).includes(needle) ||
      normalizeText(r.notaFinal).includes(needle)
    );
    State.listFilter = { type: 'search', id: null, query: trimmed };
    Nav.set('recipe-list');
    DOM.listTitle.textContent = 'Resultados';
    DOM.listFab.style.display = 'none';
    Render.recipeList(filtered);
  },

  debounced: debounce((q) => Search.handle(q), CONFIG.SEARCH_DEBOUNCE_MS),

  clear() {
    if (DOM.searchInput) { DOM.searchInput.value = ''; DOM.searchInput.focus(); }
    this.handle('');
  }
};

// ===================== FAVORITES =====================
const Favorites = {
  show() {
    State.listFilter = { type: 'favorites', id: null, query: null };
    Nav.set('recipe-list');
    DOM.listTitle.textContent = 'Favoritos';
    DOM.listFab.style.display = 'none';
    Render.recipeList(State.recipes.filter(r => r.favorito));
  },

  toggle(id) {
    const recipe = State.recipes.find(r => r.id === id);
    if (!recipe) return;
    recipe.favorito = !recipe.favorito;
    Storage.save();
    if (recipe.favorito) AudioEngine.favOn(); else AudioEngine.favOff();
    if (State.currentView === 'recipe-list') {
      if (State.listFilter.type === 'favorites') Render.recipeList(State.recipes.filter(r => r.favorito));
      else if (State.listFilter.type === 'category') Render.recipeList(State.recipes.filter(r => r.categoriaId === State.listFilter.id));
      else if (State.listFilter.type === 'search') Search.handle(DOM.searchInput ? DOM.searchInput.value : '');
    }
    if (State.currentView === 'recipe-detail' && State.currentRecipeId === id) {
      if (DOM.detailFavBtn) DOM.detailFavBtn.classList.toggle('active', recipe.favorito);
      const span = DOM.detailFavBtn ? DOM.detailFavBtn.querySelector('span') : null;
      if (span) span.textContent = recipe.favorito ? 'Quitar favorito' : 'Marcar favorito';
    }
  },

  toggleCurrent() {
    if (State.currentRecipeId) this.toggle(State.currentRecipeId);
  }
};

// ===================== CATEGORY =====================
const Category = {
  form(id) {
    id = id || null;
    State.editingCategoryId = id;
    DOM.catFormTitle.textContent = id ? 'Editar categoría' : 'Nueva categoría';
    DOM.catNameInput.value = id ? (State.category ? State.category.nombre : '') : '';
    DOM.catDeleteBtn.style.display = id ? 'block' : 'none';
    Nav.set('category-form');
    setTimeout(() => { if (DOM.catNameInput) DOM.catNameInput.focus(); }, 100);
  },

  save() {
    const name = DOM.catNameInput ? DOM.catNameInput.value.trim() : '';
    if (!name) { Toast.show('Ingresa un nombre', '⚠️'); AudioEngine.error(); if (DOM.catNameInput) DOM.catNameInput.focus(); return; }
    if (State.editingCategoryId) {
      const cat = State.category;
      if (cat) cat.nombre = name;
    } else {
      State.categories.push({ id: generateId('c'), nombre: name });
    }
    Storage.save(); Render.categories(); Nav.home();
    Toast.show(State.editingCategoryId ? 'Categoría actualizada' : 'Categoría creada', '✅');
    AudioEngine.success();
  },

  confirmDelete() {
    const cat = State.category;
    if (!cat) return;
    const hasRecipes = State.recipes.some(r => r.categoriaId === State.editingCategoryId);
    Modal.show('Eliminar categoría',
      hasRecipes ? 'Eliminar "' + escapeHtml(cat.nombre) + '"? Las recetas quedarán sin categoría.' : 'Eliminar "' + escapeHtml(cat.nombre) + '"?',
      function() {
        State.recipes.forEach(function(r) { if (r.categoriaId === State.editingCategoryId) r.categoriaId = ''; });
        State.categories = State.categories.filter(function(c) { return c.id !== State.editingCategoryId; });
        Storage.save(); Render.categories(); Nav.home();
        Toast.show('Categoría eliminada', '🗑️');
      });
  }
};

// ===================== RECIPE =====================
const Recipe = {
  showList(type, id) {
    State.listFilter = { type: type, id: id, query: null };
    Nav.set('recipe-list');
    const cat = State.categories.find(c => c.id === id);
    DOM.listTitle.textContent = type === 'category' ? (cat ? cat.nombre : 'Sin categoría') : 'Recetas';
    DOM.listFab.style.display = type === 'category' ? 'flex' : 'none';
    const list = type === 'category'
      ? State.recipes.filter(r => r.categoriaId === id)
      : State.recipes.slice();
    Render.recipeList(list);
  },

  showDetail(id) {
    App.timer.clearMainInterval();
    App.timer.clearDetailInterval();
    State.previousViewBeforeDetail = { type: State.listFilter.type, id: State.listFilter.id, query: State.listFilter.query };
    State.currentRecipeId = id;
    const recipe = State.recipes.find(r => r.id === id);
    if (!recipe) return;
    Storage.normalizeRecipe(recipe);
    Storage.ensureStepState(recipe);

    DOM.detailTitle.textContent = recipe.nombre;
    DOM.detailRecipeName.textContent = recipe.nombre;
    DOM.detailPhotoWrap.innerHTML = recipe.fotoPath
      ? '<img class="detail-photo" src="' + recipe.fotoPath + '" alt="' + escapeHtml(recipe.nombre) + '">'
      : '<div class="detail-photo-placeholder">' + ICONS.chef + '</div>';
    DOM.detailIngredients.innerHTML = parseLines(recipe.ingredientes).map(function(line) { return '<li>' + escapeHtml(line) + '</li>'; }).join('');
    this.renderSteps(recipe);
    App.timer.renderDetailTimers(recipe);
    DOM.detailTime.textContent = (recipe.tiempoMinutos || 0) + ' min';
    const cat = State.categories.find(c => c.id === recipe.categoriaId);
    DOM.detailCategory.textContent = cat ? cat.nombre : 'Sin categoría';
    DOM.detailFavBtn.classList.toggle('active', recipe.favorito);
    const favSpan = DOM.detailFavBtn ? DOM.detailFavBtn.querySelector('span') : null;
    if (favSpan) favSpan.textContent = recipe.favorito ? 'Quitar favorito' : 'Marcar favorito';

    if (recipe.notaFinal && recipe.notaFinal.trim()) {
      DOM.detailFinalNote.textContent = recipe.notaFinal.trim();
      DOM.detailNoteWrap.style.display = 'block';
    } else {
      DOM.detailNoteWrap.style.display = 'none';
      DOM.detailFinalNote.textContent = '';
    }

    State.mainTimer.seconds = (recipe.tiempoMinutos || 0) * 60;
    State.mainTimer.running = false;
    State.mainTimer.endAt = 0;
    if (DOM.mainTimerBox) DOM.mainTimerBox.classList.remove('running');
    App.timer.updateMainDisplay();
    App.timer.restoreMain();

    Nav.set('recipe-detail');
  },

  renderSteps(recipe) {
    Storage.ensureStepState(recipe);
    const steps = parseLines(recipe.pasos);
    if (!steps.length) {
      DOM.detailSteps.innerHTML = '<p style="color:var(--text-tert)">No hay pasos añadidos.</p>';
      return;
    }
    DOM.detailSteps.innerHTML = steps.map(function(step, i) {
      return '<div class="step-item ' + (recipe.stepDone[i] ? 'done' : '') + '" data-step="' + i + '">' +
        '<div class="step-check ' + (recipe.stepDone[i] ? 'checked' : '') + '">' + (recipe.stepDone[i] ? ICONS.check : '') + '</div>' +
        '<div class="step-text">' + escapeHtml(step) + '</div>' +
      '</div>';
    }).join('');

    DOM.detailSteps.onclick = function(e) {
      const item = e.target.closest('.step-item');
      if (!item) return;
      const idx = parseInt(item.dataset.step, 10);
      App.recipe.toggleStep(idx);
    };
  },

  toggleStep(index) {
    const recipe = State.recipe;
    if (!recipe) return;
    Storage.ensureStepState(recipe);
    recipe.stepDone[index] = !recipe.stepDone[index];
    Storage.save();
    this.renderSteps(recipe);
    if (recipe.stepDone[index]) AudioEngine.check(); else AudioEngine.uncheck();
  },

  form(id) {
    id = id || null;
    State.editingRecipeId = id;
    State.currentPhotoBase64 = '';
    State.cameFromDetail = false;
    DOM.recipeFormTitle.textContent = id ? 'Editar receta' : 'Nueva receta';

    const catSelect = DOM.recipeCategory;
    catSelect.innerHTML = State.categories.map(function(c) { return '<option value="' + c.id + '">' + escapeHtml(c.nombre) + '</option>'; }).join('') +
      '<option value="">Sin categoría</option>';

    DOM.photoPreview.classList.remove('visible');
    DOM.photoPreview.src = '';
    DOM.photoBtnText.textContent = 'Añadir foto';

    if (id) {
      const recipe = State.recipes.find(r => r.id === id);
      if (recipe) {
        DOM.recipeName.value = recipe.nombre || '';
        DOM.recipeCategory.value = recipe.categoriaId || '';
        DOM.recipeIngredients.value = recipe.ingredientes || '';
        DOM.recipeSteps.value = recipe.pasos || '';
        DOM.recipeTime.value = recipe.tiempoMinutos || '';
        DOM.recipeFinalNote.value = recipe.notaFinal || '';
        DOM.recipeDeleteBtn.style.display = 'block';
        App.timer.buildEditor(recipe.timers || []);
        if (recipe.fotoPath) {
          DOM.photoPreview.src = recipe.fotoPath;
          DOM.photoPreview.classList.add('visible');
          State.currentPhotoBase64 = recipe.fotoPath;
          DOM.photoBtnText.textContent = 'Cambiar foto';
        }
      }
    } else {
      DOM.recipeName.value = '';
      DOM.recipeCategory.value = State.listFilter.id || (State.categories[0] ? State.categories[0].id : '');
      DOM.recipeIngredients.value = '';
      DOM.recipeSteps.value = '';
      DOM.recipeTime.value = '';
      DOM.recipeFinalNote.value = '';
      DOM.recipeDeleteBtn.style.display = 'none';
      App.timer.buildEditor([]);
    }
    Nav.set('recipe-form');
    setTimeout(function() { if (DOM.recipeName) DOM.recipeName.focus(); }, 100);
  },

  save() {
    const nombre = DOM.recipeName.value.trim();
    const categoriaId = DOM.recipeCategory.value;
    const ingredientes = DOM.recipeIngredients.value.trim();
    const pasos = DOM.recipeSteps.value.trim();
    const tiempoVal = DOM.recipeTime.value.trim();
    const tiempo = tiempoVal ? parseInt(tiempoVal, 10) : 0;
    const notaFinal = DOM.recipeFinalNote.value.trim();
    const timers = App.timer.readEditor();

    if (!nombre) { Toast.show('La receta necesita un nombre', '⚠️'); AudioEngine.error(); DOM.recipeName.focus(); return; }
    if (tiempoVal && (isNaN(tiempo) || tiempo < 0)) { Toast.show('El tiempo debe ser un número válido', '⚠️'); AudioEngine.error(); DOM.recipeTime.focus(); return; }

    if (State.editingRecipeId) {
      const recipe = State.recipes.find(r => r.id === State.editingRecipeId);
      if (recipe) {
        recipe.nombre = nombre;
        recipe.categoriaId = categoriaId;
        recipe.ingredientes = ingredientes;
        recipe.pasos = pasos;
        recipe.tiempoMinutos = tiempo;
        recipe.fotoPath = State.currentPhotoBase64 || recipe.fotoPath || '';
        recipe.notaFinal = notaFinal;
        recipe.timers = timers;
        Storage.normalizeRecipe(recipe);
        Storage.ensureStepState(recipe);
      }
    } else {
      const newRecipe = {
        id: generateId('r'),
        categoriaId: categoriaId, nombre: nombre, ingredientes: ingredientes, pasos: pasos,
        tiempoMinutos: tiempo,
        favorito: false,
        fotoPath: State.currentPhotoBase64,
        notaFinal: notaFinal,
        timers: timers,
        stepDone: []
      };
      State.recipes.push(newRecipe);
    }
    Storage.save();
    Toast.show(State.editingRecipeId ? 'Receta actualizada' : 'Receta guardada', '✅');
    AudioEngine.success();
    Nav.backFromForm();
  },

  confirmDelete() {
    const id = State.editingRecipeId || State.currentRecipeId;
    if (!id) return;
    const recipe = State.recipes.find(r => r.id === id);
    if (!recipe) return;
    Modal.show('Eliminar receta', 'Eliminar "' + escapeHtml(recipe.nombre) + '"? Esta acción no se puede deshacer.', function() {
      State.recipes = State.recipes.filter(function(r) { return r.id !== id; });
      Storage.save();
      if (State.currentView === 'recipe-detail') Nav.backFromDetail();
      else Nav.backFromForm();
      Toast.show('Receta eliminada', '🗑️');
      AudioEngine.delete();
    });
  },

  editCurrent() {
    State.cameFromDetail = true;
    this.form(State.currentRecipeId);
  },

  share() {
    const recipe = State.recipe;
    if (!recipe) return;
    const text = '*' + recipe.nombre + '*\n\nIngredientes:\n' + recipe.ingredientes + '\n\nPasos:\n' + recipe.pasos + '\n\nTiempo: ' + (recipe.tiempoMinutos || 0) + ' min' + (recipe.notaFinal ? '\n\nNota:\n' + recipe.notaFinal : '');
    if (navigator.share) {
      navigator.share({ title: recipe.nombre, text: text }).catch(function() {});
    } else {
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    }
  }
};

// ===================== PHOTO =====================
const Photo = {
  handle(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > CONFIG.MAX_PHOTO_MB * 1024 * 1024) {
      Toast.show('La foto es muy grande. Máx: 5MB', '⚠️');
      input.value = '';
      return;
    }
    DOM.photoBtnText.textContent = 'Comprimiendo...';
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, CONFIG.PHOTO_MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        State.currentPhotoBase64 = canvas.toDataURL('image/jpeg', CONFIG.PHOTO_QUALITY);
        DOM.photoPreview.src = State.currentPhotoBase64;
        DOM.photoPreview.classList.add('visible');
        DOM.photoBtnText.textContent = 'Cambiar foto';
      };
      img.onerror = function() { DOM.photoBtnText.textContent = 'Añadir foto'; Toast.show('Error al cargar la imagen', '❌'); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
};

// ===================== TIMERS =====================
const Timer = {
  buildEditor(timers) {
    const box = DOM.recipeTimersEditor;
    const list = Array.isArray(timers) && timers.length ? timers : [];
    box.innerHTML = list.map(function(t, i) {
      return '<div class="v4-timer-editor">' +
        '<input type="text" class="v4-timer-name" placeholder="Nombre" value="' + escapeHtml(t.name || '') + '">' +
        '<div class="v4-time-row">' +
          '<input type="number" class="v4-timer-min" placeholder="Min" min="0" value="' + Math.floor((t.durationSeconds || 0) / 60) + '">' +
          '<input type="number" class="v4-timer-sec" placeholder="Seg" min="0" max="59" value="' + ((t.durationSeconds || 0) % 60) + '">' +
          '<button class="header-btn" onclick="App.timer.removeEditor(' + i + ')" aria-label="Eliminar">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  readEditor() {
    return $$('.v4-timer-editor', DOM.recipeTimersEditor).map(function(row, i) {
      const nameEl = row.querySelector('.v4-timer-name');
      const minEl = row.querySelector('.v4-timer-min');
      const secEl = row.querySelector('.v4-timer-sec');
      const name = nameEl ? nameEl.value.trim() : ('Cronómetro ' + (i + 1));
      const min = Math.max(0, parseInt(minEl ? minEl.value : '0', 10) || 0);
      const sec = Math.min(59, Math.max(0, parseInt(secEl ? secEl.value : '0', 10) || 0));
      const dur = min * 60 + sec;
      return { id: generateId('t'), name: name, durationSeconds: dur, remainingSeconds: dur, running: false, endAt: 0 };
    }).filter(function(t) { return t.durationSeconds > 0; });
  },

  addEditor() {
    const current = this.readEditor();
    current.push({ id: generateId('t'), name: '', durationSeconds: 60, remainingSeconds: 60, running: false, endAt: 0 });
    this.buildEditor(current);
  },

  removeEditor(index) {
    const current = this.readEditor();
    current.splice(index, 1);
    this.buildEditor(current);
  },

  updateMainDisplay() {
    if (!DOM.timerDisplay) return;
    const s = State.mainTimer.seconds;
    DOM.timerDisplay.textContent = formatTime(s);
    DOM.timerDisplay.classList.remove('warning', 'finished');
    if (DOM.mainTimerBox) DOM.mainTimerBox.classList.remove('running');
    if (s > 0 && s <= 60) DOM.timerDisplay.classList.add('warning');
    if (s <= 0 && !State.mainTimer.running) DOM.timerDisplay.classList.add('finished');
    if (State.mainTimer.running) {
      if (DOM.mainTimerBox) DOM.mainTimerBox.classList.add('running');
      document.title = '(' + formatTime(s) + ') Mi Recetario';
    } else {
      document.title = 'Mi Recetario';
    }
    DOM.timerPlayBtn.textContent = State.mainTimer.running ? '⏸' : '▶';
  },

  toggle() {
    if (State.mainTimer.running) this.pauseMain();
    else this.startMain();
  },

  startMain() {
    if (State.mainTimer.running || State.mainTimer.seconds <= 0) return;
    State.mainTimer.running = true;
    State.mainTimer.endAt = Date.now() + State.mainTimer.seconds * 1000;
    this.saveMainState();
    this.clearMainInterval();
    const self = this;
    State.mainTimer.interval = setInterval(function() {
      const remaining = Math.max(0, Math.ceil((State.mainTimer.endAt - Date.now()) / 1000));
      if (remaining !== State.mainTimer.seconds) {
        State.mainTimer.seconds = remaining;
        self.updateMainDisplay();
      }
      if (remaining <= 0) {
        self.clearMainInterval();
        State.mainTimer.running = false;
        State.mainTimer.endAt = 0;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
        self.finishMain();
      }
    }, CONFIG.TIMER_TICK_MS);
    this.updateMainDisplay();
  },

  pauseMain() {
    if (!State.mainTimer.running) return;
    this.clearMainInterval();
    State.mainTimer.running = false;
    State.mainTimer.endAt = 0;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
    this.updateMainDisplay();
  },

  resetMain() {
    this.clearMainInterval();
    State.mainTimer.running = false;
    State.mainTimer.endAt = 0;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
    const recipe = State.recipe;
    State.mainTimer.seconds = (recipe ? recipe.tiempoMinutos : 0) || 0;
    State.mainTimer.seconds *= 60;
    this.updateMainDisplay();
  },

  addMinutes(min) {
    State.mainTimer.seconds = Math.max(0, State.mainTimer.seconds + min * 60);
    if (State.mainTimer.running) {
      State.mainTimer.endAt = Date.now() + State.mainTimer.seconds * 1000;
      this.saveMainState();
    }
    this.updateMainDisplay();
  },

  clearMainInterval() {
    if (State.mainTimer.interval) { clearInterval(State.mainTimer.interval); State.mainTimer.interval = null; }
  },

  saveMainState() {
    if (State.mainTimer.running && State.currentRecipeId) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.timer, JSON.stringify({ endAt: State.mainTimer.endAt, recipeId: State.currentRecipeId }));
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
    }
  },

  restoreMain() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.timer);
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data.recipeId || !data.endAt || State.currentRecipeId !== data.recipeId) return;
      const remaining = Math.ceil((data.endAt - Date.now()) / 1000);
      if (remaining > 0) {
        State.mainTimer.seconds = remaining;
        State.mainTimer.endAt = data.endAt;
        State.mainTimer.running = true;
        this.updateMainDisplay();
        this.startMain();
      } else {
        State.mainTimer.seconds = 0;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
        this.updateMainDisplay();
      }
    } catch (e) {}
  },

  finishMain() {
    if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);
    Toast.show('¡Tiempo finalizado!', '⏰');
    AudioEngine.timerDone();
  },

  renderDetailTimers(recipe) {
    Storage.normalizeRecipe(recipe);
    const wrap = DOM.detailTimersWrap;
    if (!recipe.timers.length) {
      wrap.innerHTML = '';
      this.clearDetailInterval();
      return;
    }
    const self = this;
    wrap.innerHTML = '<div class="detail-section"><h3><span class="section-dot"></span>Cronómetros de la receta</h3>' +
      recipe.timers.map(function(timer, i) {
        return '<div class="v4-timer-card">' +
          '<h4>' + escapeHtml(timer.name || 'Cronómetro') + '</h4>' +
          '<div class="v4-display ' + self.timerClass(timer) + '" id="detailTimerDisplay_' + i + '">' + formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds) + '</div>' +
          '<div class="v4-timer-actions">' +
            '<button class="primary" onclick="App.timer.startDetail(' + i + ')">▶</button>' +
            '<button onclick="App.timer.pauseDetail(' + i + ')">⏸</button>' +
            '<button onclick="App.timer.resetDetail(' + i + ')">↺</button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    this.clearDetailInterval();
    State.detailTimerInterval = setInterval(function() { self.updateDetailTimers(); }, 1000);
    this.updateDetailTimers();
  },

  timerClass(timer) {
    if (timer.remainingSeconds <= 0 && !timer.running) return 'finished';
    if (timer.running && timer.remainingSeconds > 0 && timer.remainingSeconds <= 60) return 'warning';
    return '';
  },

  updateDetailTimers() {
    const recipe = State.recipe;
    if (!recipe || State.currentView !== 'recipe-detail') return;
    let changed = false;
    const self = this;
    recipe.timers.forEach(function(timer, i) {
      if (timer.running && timer.endAt) {
        const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        if (remaining !== timer.remainingSeconds) { timer.remainingSeconds = remaining; changed = true; }
        if (remaining <= 0) {
          timer.running = false; timer.endAt = 0; changed = true;
          if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
          Toast.show('Cronómetro terminado: ' + (timer.name || 'Listo'), '⏰');
          AudioEngine.timerDone();
        }
      }
      const display = byId('detailTimerDisplay_' + i);
      if (display) {
        display.textContent = formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds);
        display.className = 'v4-display ' + self.timerClass(timer);
      }
    });
    if (changed) Storage.saveDebounced();
  },

  startDetail(index) {
    const recipe = State.recipe;
    if (!recipe) return;
    Storage.normalizeRecipe(recipe);
    const timer = recipe.timers[index];
    if (!timer || timer.remainingSeconds <= 0) return;
    timer.running = true;
    timer.endAt = Date.now() + timer.remainingSeconds * 1000;
    if (State.detailTimerInterval == null) {
      const self = this;
      State.detailTimerInterval = setInterval(function() { self.updateDetailTimers(); }, 1000);
    }
    Storage.saveDebounced();
    this.updateDetailTimers();
  },

  pauseDetail(index) {
    const recipe = State.recipe;
    if (!recipe) return;
    Storage.normalizeRecipe(recipe);
    const timer = recipe.timers[index];
    if (!timer) return;
    if (timer.running && timer.endAt) {
      timer.remainingSeconds = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    }
    timer.running = false;
    timer.endAt = 0;
    Storage.saveDebounced();
    this.updateDetailTimers();
  },

  resetDetail(index) {
    const recipe = State.recipe;
    if (!recipe) return;
    Storage.normalizeRecipe(recipe);
    const timer = recipe.timers[index];
    if (!timer) return;
    timer.running = false;
    timer.endAt = 0;
    timer.remainingSeconds = timer.durationSeconds;
    Storage.saveDebounced();
    this.updateDetailTimers();
  },

  clearDetailInterval() {
    if (State.detailTimerInterval) { clearInterval(State.detailTimerInterval); State.detailTimerInterval = null; }
  }
};

// ===================== COOK MODE =====================
const CookMode = (() => {
  let wakeLock = null;
  let currentStep = 0;
  let steps = [];
  let quickTimerInterval = null;
  let quickTimerSeconds = 0;
  let quickTimerRunning = false;
  let cookTimerInterval = null;

  async function requestWakeLock() {
    try { if ('wakeLock' in navigator) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', function() { wakeLock = null; }); } }
    catch (e) {}
  }
  function releaseWakeLock() {
    if (wakeLock) { wakeLock.release().catch(function() {}); wakeLock = null; }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    u.rate = 0.92;
    u.pitch = 1.05;
    window.speechSynthesis.speak(u);
    if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.add('speaking');
    u.onend = function() { if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.remove('speaking'); };
    u.onerror = function() { if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.remove('speaking'); };
  }

  function extractMinutes(text) {
    const m = text.match(/(\d+)\s*(min|minuto|minutos)/i);
    if (m) return parseInt(m[1], 10);
    const h = text.match(/(\d+)\s*(hora|horas)/i);
    if (h) return parseInt(h[1], 10) * 60;
    return null;
  }

  function updateProgress() {
    const pct = steps.length ? ((currentStep + 1) / steps.length) * 100 : 0;
    if (DOM.cookProgressBar) DOM.cookProgressBar.style.width = pct + '%';
    const dotsHtml = steps.map(function(_, i) { return '<span class="' + (i === currentStep ? 'active' : '') + '"></span>'; }).join('');
    if (DOM.cookDots) DOM.cookDots.innerHTML = dotsHtml;
    if (DOM.cookNavDots) DOM.cookNavDots.innerHTML = dotsHtml;
    if (DOM.cookPrevBtn) DOM.cookPrevBtn.disabled = currentStep === 0;
    if (DOM.cookNextBtn) {
      DOM.cookNextBtn.innerHTML = currentStep >= steps.length - 1
        ? 'Terminar <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
        : 'Siguiente <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';
    }
  }

  function renderStep() {
    if (!DOM.cookStepText) return;
    if (currentStep >= steps.length) {
      DOM.cookStepText.innerHTML = '<div class="cook-done"><div class="big-icon">🍲</div><h2>¡Listo!</h2><p>Todos los pasos completados. Buen provecho.</p></div>';
      AudioEngine.success();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
      return;
    }
    const stepText = steps[currentStep];
    const minutes = extractMinutes(stepText);
    let quickHtml = '';
    if (minutes && minutes > 0) {
      quickHtml = '<button class="cook-quick-timer" onclick="App.cookMode.startQuickTimer(' + minutes + ')">⏱ ' + minutes + ' min</button>';
    }
    DOM.cookStepNum.textContent = 'Paso ' + (currentStep + 1) + ' de ' + steps.length;
    DOM.cookStepText.innerHTML = '<div style="font-size:22px;font-weight:500;line-height:1.6;color:var(--text);max-width:480px;margin:0 auto;">' + escapeHtml(stepText) + '</div>' + quickHtml;
    DOM.cookStepText.classList.remove('prev');
    updateProgress();
  }

  function renderCookTimers() {
    const recipe = State.recipe;
    if (!DOM.cookTimersList || !recipe) return;
    Storage.normalizeRecipe(recipe);
    if (!recipe.timers.length) {
      DOM.cookTimersList.innerHTML = '<p style="color:var(--text-tert);font-size:13px;text-align:center;margin:8px 0">No hay cronómetros en esta receta</p>';
      return;
    }
    DOM.cookTimersList.innerHTML = recipe.timers.map(function(timer, i) {
      const cls = timer.remainingSeconds <= 0 && !timer.running ? 'finished' : (timer.remainingSeconds <= 60 && timer.running ? 'warning' : '');
      return '<div class="cook-timer-row">' +
        '<span class="ct-name">' + escapeHtml(timer.name || 'Timer') + '</span>' +
        '<span class="ct-time ' + cls + '" id="cookTimerDisplay_' + i + '">' + formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds) + '</span>' +
        '<div class="ct-actions">' +
          '<button class="primary" onclick="App.cookMode.startRecipeTimer(' + i + ')">▶</button>' +
          '<button onclick="App.cookMode.pauseRecipeTimer(' + i + ')">⏸</button>' +
          '<button onclick="App.cookMode.resetRecipeTimer(' + i + ')">↺</button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function updateCookTimers() {
    const recipe = State.recipe;
    if (!recipe) return;
    let changed = false;
    recipe.timers.forEach(function(timer, i) {
      if (timer.running && timer.endAt) {
        const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        if (remaining !== timer.remainingSeconds) { timer.remainingSeconds = remaining; changed = true; }
        if (remaining <= 0) {
          timer.running = false; timer.endAt = 0; changed = true;
          if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
          AudioEngine.timerDone();
          Toast.show('Cronómetro terminado: ' + (timer.name || 'Listo'), '⏰');
        }
      }
      const display = byId('cookTimerDisplay_' + i);
      if (display) {
        display.textContent = formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds);
        display.className = 'ct-time ' + Timer.timerClass(timer);
      }
    });
    if (changed) Storage.saveDebounced();
  }

  function startQuickTimer(minutes) {
    if (quickTimerRunning) return;
    quickTimerSeconds = minutes * 60;
    quickTimerRunning = true;
    if (DOM.cookQuickDisplay) DOM.cookQuickDisplay.style.display = 'block';
    updateQuickDisplay();
    quickTimerInterval = setInterval(function() {
      quickTimerSeconds--;
      updateQuickDisplay();
      if (quickTimerSeconds <= 0) {
        clearInterval(quickTimerInterval); quickTimerRunning = false;
        if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);
        AudioEngine.timerDone();
        Toast.show('¡Tiempo del paso terminado!', '⏰');
      }
    }, 1000);
  }

  function updateQuickDisplay() {
    if (DOM.cookQuickDisplay) DOM.cookQuickDisplay.textContent = formatTime(quickTimerSeconds);
  }

  function showIngredients() {
    const recipe = State.recipe;
    if (!recipe) return;
    const lines = parseLines(recipe.ingredientes);
    DOM.cookIngredientsList.innerHTML = lines.length ? lines.map(function(l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('') : '<li>Sin ingredientes</li>';
    DOM.cookIngredientsOverlay.classList.add('active');
  }

  function closeIngredients() {
    if (DOM.cookIngredientsOverlay) DOM.cookIngredientsOverlay.classList.remove('active');
  }

  function setupSwipe() {
    const body = DOM.cookBody;
    if (!body) return;
    let startX = 0;
    body.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    body.addEventListener('touchend', function(e) {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) next(); else prev();
      }
    }, { passive: true });
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      AudioEngine.tap();
      if (navigator.vibrate) navigator.vibrate(20);
      renderStep();
    } else if (currentStep === steps.length - 1) {
      currentStep++;
      renderStep();
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      AudioEngine.tap();
      if (navigator.vibrate) navigator.vibrate(20);
      renderStep();
    }
  }

  function toggleTimersPanel() {
    if (DOM.cookTimersPanel) DOM.cookTimersPanel.classList.toggle('collapsed');
  }

  return {
    enter() {
      const recipe = State.recipe;
      if (!recipe) return;
      steps = parseLines(recipe.pasos);
      currentStep = 0;
      quickTimerSeconds = 0;
      quickTimerRunning = false;
      if (quickTimerInterval) clearInterval(quickTimerInterval);
      if (cookTimerInterval) clearInterval(cookTimerInterval);
      DOM.cookTitle.textContent = recipe.nombre;
      Nav.set('cook-mode');
      requestWakeLock();
      renderStep();
      renderCookTimers();
      setupSwipe();
      cookTimerInterval = setInterval(updateCookTimers, 1000);
      updateCookTimers();
      Storage.ensureStepState(recipe);
    },
    exit() {
      releaseWakeLock();
      if (quickTimerInterval) clearInterval(quickTimerInterval);
      if (cookTimerInterval) clearInterval(cookTimerInterval);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      Nav.backFromDetail();
    },
    next: next,
    prev: prev,
    speak: speak,
    showIngredients: showIngredients,
    closeIngredients: closeIngredients,
    toggleTimersPanel: toggleTimersPanel,
    startQuickTimer: startQuickTimer,
    startRecipeTimer: function(i) { Timer.startDetail(i); updateCookTimers(); },
    pauseRecipeTimer: function(i) { Timer.pauseDetail(i); updateCookTimers(); },
    resetRecipeTimer: function(i) { Timer.resetDetail(i); updateCookTimers(); }
  };
})();

// ===================== DATA IMPORT/EXPORT =====================
const DataIO = {
  export() {
    const data = { version: CONFIG.VERSION, exportDate: new Date().toISOString(), categories: State.categories, recipes: State.recipes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mi-recetario-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    Toast.show('Backup descargado', '💾');
  },

  import(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.categories) || !Array.isArray(data.recipes)) throw new Error('Formato inválido');
        data.categories.forEach(function(c) {
          if (typeof c.id !== 'string') c.id = generateId('c');
          if (typeof c.nombre !== 'string') c.nombre = 'Sin nombre';
        });
        data.recipes.forEach(function(r) {
          if (typeof r.id !== 'string') r.id = generateId('r');
          if (typeof r.nombre !== 'string') r.nombre = 'Sin nombre';
        });
        Modal.show('Importar datos', 'Esto reemplazará TODOS tus datos actuales. ¿Continuar?', function() {
          State.categories = data.categories;
          State.recipes = data.recipes;
          Storage.normalizeAll();
          Storage.save();
          Render.categories();
          Nav.home();
          Toast.show('Datos importados correctamente', '✅');
        });
      } catch (err) { Toast.show('Archivo inválido', '❌'); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  confirmClear() {
    Modal.show('Borrar todo', 'Esto eliminará TODAS las recetas y categorías. No se puede deshacer.', function() {
      State.categories = [];
      State.recipes = [];
      Storage.save();
      Render.categories();
      Nav.home();
      Toast.show('Todos los datos eliminados', '🗑️');
    });
  }
};

// ===================== SETTINGS =====================
const Settings = {
  show() {
    Nav.set('settings');
    this.updateSoundToggle();
  },
  updateSoundToggle() {
    if (DOM.soundToggle) DOM.soundToggle.classList.toggle('active', AudioEngine.enabled);
    if (DOM.soundDesc) DOM.soundDesc.textContent = AudioEngine.enabled ? 'Activados' : 'Silenciados';
  },
  toggleSound() {
    const on = AudioEngine.toggle();
    this.updateSoundToggle();
    Toast.show(on ? 'Sonidos activados' : 'Sonidos silenciados', on ? '🔊' : '🔇');
  }
};

// ===================== PWA =====================
const PWA = {
  setup() {
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      State.deferredPrompt = e;
      if (DOM.installBanner) DOM.installBanner.classList.add('visible');
    });
    window.addEventListener('appinstalled', function() {
      if (DOM.installBanner) DOM.installBanner.classList.remove('visible');
      State.deferredPrompt = null;
    });
  },
  install() {
    if (!State.deferredPrompt) return;
    try {
      State.deferredPrompt.prompt();
      State.deferredPrompt.userChoice.then(function(choice) {
        if (choice.outcome === 'accepted' && DOM.installBanner) DOM.installBanner.classList.remove('visible');
        State.deferredPrompt = null;
      });
    } catch (e) { console.error('Install error', e); }
  }
};

// ===================== SPLASH =====================
function hideSplash() {
  const splash = DOM.splash;
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(function() { splash.remove(); }, 700);
  }
}

// ===================== INIT =====================
function init() {
  cacheDOM();
  AudioEngine.loadSetting();
  Storage.load();
  PWA.setup();
  Render.categories();

  if (DOM.searchInput) {
    DOM.searchInput.addEventListener('input', function(e) { Search.debounced(e.target.value); });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (DOM.modalOverlay && DOM.modalOverlay.classList.contains('active')) Modal.close();
      else if (State.currentView === 'cook-mode') CookMode.exit();
      else if (State.currentView !== 'home') Nav.home();
    }
  });

  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && State.mainTimer.running) {
      const remaining = Math.max(0, Math.ceil((State.mainTimer.endAt - Date.now()) / 1000));
      State.mainTimer.seconds = remaining;
      Timer.updateMainDisplay();
      if (remaining <= 0) {
        Timer.clearMainInterval();
        State.mainTimer.running = false;
        State.mainTimer.endAt = 0;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.timer);
        if (DOM.mainTimerBox) DOM.mainTimerBox.classList.remove('running');
        Timer.finishMain();
      }
    }
  });

  setTimeout(hideSplash, 1800);
}

// ===================== APP EXPORT =====================
window.App = {
  nav: Nav,
  render: Render,
  search: Search,
  favorites: Favorites,
  category: Category,
  recipe: Recipe,
  photo: Photo,
  timer: Timer,
  cookMode: CookMode,
  data: DataIO,
  settings: Settings,
  toast: Toast,
  modal: Modal,
  audio: { toggle: function() { Settings.toggleSound(); } },
  install: function() { PWA.install(); }
};

document.addEventListener('DOMContentLoaded', init);
