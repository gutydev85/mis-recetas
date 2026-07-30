/* Mi Recetario — app.js v5.4 */
/* Mejoras: modo cocinar salida robusta, TTS con cola, auto-lectura, teclado, animaciones */

'use strict';

const Icons = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  sound: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  pointer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  pot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  stopwatch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M16 2v2"/><path d="M8 2v2"/></svg>'
};



const CONFIG = {
  VERSION: 5.4,
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

let _navLock = false;

const ICONS = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  chef: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
};

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const byId = id => document.getElementById(id);


/* ---------- UTILIDADES: ESCALADO DE INGREDIENTES ---------- */
function parseQuantity(str) {
  str = str.trim().replace(/,/g, '.');
  var m = str.match(/^(\d+)\/(\d+)$/);
  if (m) return parseInt(m[1]) / parseInt(m[2]);
  m = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
  var n = parseFloat(str);
  return isNaN(n) ? null : n;
}

function formatQty(n) {
  if (n === null || n === undefined) return '';
  if (Number.isInteger(n)) return String(n);
  var tol = 0.015;
  var fracs = [[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,6],[5,6],[1,8],[3,8],[5,8],[7,8]];
  for (var i = 0; i < fracs.length; i++) {
    if (Math.abs(n - fracs[i][0]/fracs[i][1]) < tol) return fracs[i][0] + '/' + fracs[i][1];
  }
  var rounded = Math.round(n * 100) / 100;
  return String(rounded).replace('.', ',');
}

function scaleIngredientsText(text, factor) {
  if (!text || !factor || factor === 1) return text;
  var skipRegex = /al gusto|opcional|un poco|qs|cantidad necesaria|suficiente|para decorar/i;

  return parseLines(text).map(function(line) {
    if (!line.trim() || !/\d/.test(line) || skipRegex.test(line)) return line;

    var result = line;

    result = result.replace(/(\d+)\s+(\d+)\/(\d+)(?=\s|$)/g, function(match, w, n, d) {
      return formatQty((parseInt(w) + parseInt(n)/parseInt(d)) * factor);
    });

    if (/\d+\/\d+/.test(result)) {
      result = result.replace(/(^|\s)(\d+)\/(\d+)(?=\s|$)/g, function(match, sp, n, d) {
        return sp + formatQty((parseInt(n)/parseInt(d)) * factor);
      });
    }

    var numPattern = /(^|\s)(\d+(?:[.,]\d+)?)(?=\s*(?:g|kg|ml|l|oz|lb|tazas?|cucharadas?|cucharaditas?|cda\.?|cdta\.?|piezas?|unidades?|puñados?|ramas?|dientes?|pizcas?|latas?|sobres?|botellas?|paquetes?|rebanadas?|trozos?|porciones?|litros?|gramos?|kilos?|libras?|onzas?|hojas?|potes?|frascos?|vasos?|copas?|platos?|fuentes?|bandejas?|moldes?|raciones?|personas?|comensales?)?\b)/gi;
    result = result.replace(numPattern, function(match, sp, num) {
      return sp + formatQty(parseFloat(num.replace(',', '.')) * factor);
    });

    return result;
  }).join('\n');
}

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

function getSteps(recipe) {
  if (!recipe) return [];
  const texts = parseLines(recipe.pasos);
  const photos = Array.isArray(recipe.stepPhotos) ? recipe.stepPhotos : [];
  return texts.map((text, i) => ({ text, photo: photos[i] || '' }));
}

function stepsToString(steps) {
  return steps.map(s => s.text).join('\n');
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function isDesktop() {
  return window.innerWidth >= 900;
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
    success() { playSequence([[523,0.18,0.18],[659,0.18,0.18],[784,0.25,0]]); },
    error() { playTone(200, 0.3, 'sawtooth', 0.15); },
    delete() { playTone(150, 0.2, 'sawtooth', 0.12); },
    check() { playTone(880, 0.08, 'sine', 0.12); },
    uncheck() { playTone(440, 0.08, 'sine', 0.08); },
    favOn() { playTone(880, 0.1, 'sine', 0.15); setTimeout(() => playTone(1100, 0.15, 'sine', 0.15), 100); },
    favOff() { playTone(660, 0.15, 'sine', 0.12); },
    tap() { playTone(600, 0.05, 'sine', 0.08); },
    timerDone(){ playSequence([[880,0.3,0.35],[1100,0.3,0.35],[880,0.4,0]]); },
    loadSetting
  };
})();

const State = {
    portionsMap: {},
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
  _editingStepIndex: null,
  get recipe() { return this.recipes.find(r => r.id === this.currentRecipeId) || null; },
  get category() { return this.categories.find(c => c.id === this.editingCategoryId) || null; }
};

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
      App.toast.show('Error guardando. Espacio lleno?', Icons.warning);
    }
  },

  saveDebounced: debounce(() => Storage.save(), CONFIG.SAVE_DEBOUNCE_MS),

  normalizeRecipe(recipe) {
    if (!recipe) return;
    if (!Array.isArray(recipe.stepDone)) recipe.stepDone = [];
    if (!Array.isArray(recipe.timers)) recipe.timers = [];
    if (!Array.isArray(recipe.stepPhotos)) recipe.stepPhotos = [];
    if (typeof recipe.porciones !== 'number' || recipe.porciones < 1) recipe.porciones = 4;
    if (typeof recipe.ajustePorciones !== 'boolean') recipe.ajustePorciones = true;
    if (typeof recipe.notaFinal !== 'string') recipe.notaFinal = '';
    const stepCount = parseLines(recipe.pasos).length;
    while (recipe.stepPhotos.length < stepCount) recipe.stepPhotos.push('');
    if (recipe.stepPhotos.length > stepCount) recipe.stepPhotos.length = stepCount;
    recipe.timers = recipe.timers.map((t, i) => {
      const durSec = Number.isFinite(t.durationSeconds)
        ? t.durationSeconds
        : ((parseInt(t.minutes || 0, 10) || 0) * 60 + (parseInt(t.seconds || 0, 10) || 0));
      return {
        id: t.id || generateId('t'),
        name: t.name || ('Cronometro ' + (i + 1)),
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
    if (!Array.isArray(recipe.stepPhotos)) recipe.stepPhotos = [];
    if (typeof recipe.porciones !== 'number' || recipe.porciones < 1) recipe.porciones = 4;
    if (typeof recipe.ajustePorciones !== 'boolean') recipe.ajustePorciones = true;
    while (recipe.stepPhotos.length < steps.length) recipe.stepPhotos.push('');
    if (recipe.stepPhotos.length > steps.length) recipe.stepPhotos.length = steps.length;
  }
};

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
    'recipePorciones','recipeAjustePorciones','portionControl','portionDisplay',
    'recipeTime','recipeFinalNote','photoPreview','photoInput','photoBtnText',
    'recipeTimersEditor','recipeDeleteBtn','stepsEditor','stepPhotoInput',
    'catFormTitle','catNameInput','catDeleteBtn',
    'soundToggle','soundDesc',
    'cookTitle','cookBody','cookStepNum','cookStepText','cookDots','cookNavDots',
    'cookPrevBtn','cookNextBtn','cookTtsBtn','cookQuickTimerWrap','cookQuickDisplay',
    'cookTimersPanel','cookTimersList','cookProgressBar',
    'cookIngredientsOverlay','cookIngredientsList'
  ];
  ids.forEach(id => DOM[id] = byId(id));
}

const Nav = {
  set(view) {
    if (!_navLock && State.currentView !== view && view !== 'home') {
      history.pushState({ from: State.currentView }, '', '');
    }

    if (isDesktop()) {
      const panelViews = ['recipe-detail', 'recipe-form', 'category-form', 'settings', 'cook-mode'];
      panelViews.forEach(v => {
        const el = byId('view-' + v);
        if (el) el.classList.remove('active');
      });
      const el = byId('view-' + view);
      if (el) el.classList.add('active');
      const home = byId('view-home');
      if (home) home.classList.add('active');
      if (view !== 'home') {
        const placeholder = byId('desktop-placeholder');
        if (placeholder) placeholder.classList.remove('visible');
      }
      State.currentView = view;
      if (DOM.app) DOM.app.scrollTop = 0;
      document.title = 'Mi Recetario';
      return;
    }

    $$('.view').forEach(v => v.classList.remove('active'));
    const el = byId('view-' + view);
    if (el) el.classList.add('active');
    State.currentView = view;
    if (DOM.app) DOM.app.scrollTop = 0;
    document.title = 'Mi Recetario';
  },

  home() {
    if (isDesktop()) {
      $$('.view').forEach(v => {
        if (v.id !== 'view-home') v.classList.remove('active');
      });
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      const sidebarRecipes = byId('sidebar-recipes-wrap');
      if (sidebarRecipes) sidebarRecipes.classList.add('hidden');
      const homeView = byId('view-home');
      if (homeView) homeView.classList.add('active');
      State.currentView = 'home';
      State.listFilter = { type: null, id: null, query: null };
      App.render.categories();
      return;
    }
    this.set('home'); App.render.categories();
  },

  backFromDetail() {
    _navLock = true;
    App.timer.clearMainInterval();
    App.timer.clearDetailInterval();
    const pv = State.previousViewBeforeDetail;
    if (isDesktop()) {
      const detailView = byId('view-recipe-detail');
      if (detailView) detailView.classList.remove('active');
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      State.currentView = 'home';
      State.previousViewBeforeDetail = null;
      _navLock = false;
      return;
    }
    if (pv) {
      if (pv.type === 'category') App.recipe.showList('category', pv.id);
      else if (pv.type === 'favorites') App.favorites.show();
      else if (pv.type === 'search' && pv.query) App.search.handle(pv.query);
      else this.home();
      State.previousViewBeforeDetail = null;
    } else {
      this.home();
    }
    _navLock = false;
  },

  backFromForm() {
    _navLock = true;
    if (State.cameFromDetail && State.editingRecipeId) {
      State.cameFromDetail = false;
      App.recipe.showDetail(State.editingRecipeId);
      _navLock = false;
      return;
    }
    if (isDesktop()) {
      $$('.view').forEach(v => {
        if (v.id !== 'view-home') v.classList.remove('active');
      });
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      State.currentView = 'home';
      _navLock = false;
      return;
    }
    const f = State.listFilter;
    if (f.type === 'category') App.recipe.showList('category', f.id);
    else if (f.type === 'favorites') App.favorites.show();
    else if (f.type === 'search' && f.query) App.search.handle(DOM.searchInput ? DOM.searchInput.value : '');
    else this.home();
    _navLock = false;
  }
};

const Toast = {
  _t: null,
  show(msg, icon) {
    icon = icon || '';
    if (!DOM.toast) return;
    DOM.toastIcon.innerHTML = icon;
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

const Render = {
  stats() {
    if (!DOM.statsBar) return;
    const total = State.recipes.length;
    const favs = State.recipes.filter(r => r.favorito).length;
    DOM.statsBar.innerHTML = '<b>' + total + '</b> receta' + (total !== 1 ? 's' : '') + '' +
      '<b>' + favs + '</b> favorita' + (favs !== 1 ? 's' : '') + '' +
      '<b>' + State.categories.length + '</b> categoria' + (State.categories.length !== 1 ? 's' : '') + '';
  },

  categories() {
    this.stats();
    if (!DOM.categoriesList) return;
    const frag = document.createDocumentFragment();

    if (State.categories.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<div class="big-icon">' + ICONS.folderOpen + '</div><h3>No hay categorias</h3><p>Crea la primera con el boton +</p>';
      frag.appendChild(empty);
    } else {
      State.categories.forEach((cat, i) => {
        const count = State.recipes.filter(r => r.categoriaId === cat.id).length;
        const card = document.createElement('div');
        card.className = 'category-card';
        card.style.animationDelay = (i * 50) + 'ms';
        card.innerHTML = '<div class="icon-wrap">' + ICONS.folder + '</div>' +
          '<div><div class="name">' + escapeHtml(cat.nombre) + '</div>' +
          '<div class="count">' + count + ' receta' + (count !== 1 ? 's' : '') + '</div></div>' +
          '<div class="cat-actions"><button class="header-btn" onclick="App.category.form(\'' + cat.id + '\');event.stopPropagation();"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div>';
        card.addEventListener('click', () => App.recipe.showList('category', cat.id));
        frag.appendChild(card);
      });
    }

    const uncategorized = State.recipes.filter(r => !State.categories.some(c => c.id === r.categoriaId));
    if (uncategorized.length > 0) {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = '<div class="icon-wrap">' + ICONS.folderOpen + '</div>' +
        '<div><div class="name">Sin categoria</div>' +
        '<div class="count">' + uncategorized.length + ' receta' + (uncategorized.length !== 1 ? 's' : '') + '</div></div>';
      card.addEventListener('click', () => App.recipe.showList('category', null));
      frag.appendChild(card);
    }

    DOM.categoriesList.innerHTML = '';
    DOM.categoriesList.appendChild(frag);
  },

  recipeList(list) {
    if (!DOM.recipeListContainer) return;
    if (list.length === 0) {
      DOM.recipeListContainer.innerHTML = '<div class="empty-state"><div class="big-icon">' + ICONS.utensils + '</div><h3>No hay recetas</h3><p>Agrega la primera con el boton +</p></div>';
      return;
    }
    const frag = document.createDocumentFragment();
    list.forEach((recipe, i) => {
      const cat = State.categories.find(c => c.id === recipe.categoriaId);
      const catName = cat ? cat.nombre : 'Sin categoria';
      const row = document.createElement('div');
      row.className = 'recipe-row';
      row.style.animationDelay = (i * 60) + 'ms';row.innerHTML = (recipe.fotoPath ? '<img src="' + recipe.fotoPath + '" class="recipe-thumb" alt="">' : '<div class="recipe-thumb-placeholder">' + ICONS.chef + '</div>') +
        '<div class="info">' +
        '<div class="title">' + escapeHtml(recipe.nombre) + '</div>' +
        '<div class="meta">' + ICONS.clock + ' ' + catName + ' &middot; ' + (recipe.tiempoMinutos || 0) + ' min</div>' +
        '</div>' +
        '<div class="row-actions">' +
        '<button class="fav-btn ' + (recipe.favorito ? 'active' : '') + '" data-id="' + recipe.id + '">' + ICONS.heart + '</button>' +
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

    if (isDesktop()) {
      const sidebarWrap = byId('sidebar-recipes-wrap');
      const sidebarList = byId('sidebar-recipes-list');
      const sidebarTitle = byId('sidebar-recipes-title');
      if (sidebarWrap) sidebarWrap.classList.remove('hidden');
      if (sidebarTitle) sidebarTitle.textContent = 'Resultados';
      if (sidebarList) {
        sidebarList.innerHTML = '';
        if (filtered.length === 0) {
          sidebarList.innerHTML = '<div class="empty-state" style="padding:30px 10px;"><div class="big-icon">&#128269;</div><h3>Sin resultados</h3></div>';
        } else {
          const frag = document.createDocumentFragment();
          filtered.forEach((recipe, i) => {
            const c = State.categories.find(c => c.id === recipe.categoriaId);
            const row = document.createElement('div');
            row.className = 'recipe-row';
            row.style.animationDelay = (i * 60) + 'ms';
            row.innerHTML = (recipe.fotoPath ? '<img class="recipe-thumb" src="' + recipe.fotoPath + '" alt="">' : '<div class="recipe-thumb-placeholder">&#127859;</div>') +
              '<div class="info"><div class="title">' + escapeHtml(recipe.nombre) + '</div><div class="meta">' + (c ? c.nombre : 'Sin categoria') + ' &middot; ' + (recipe.tiempoMinutos || 0) + ' min</div></div>' +
              '<button class="fav-btn ' + (recipe.favorito ? 'active' : '') + '" onclick="event.stopPropagation(); App.favorites.toggle(&#39;' + recipe.id + '&#39;)">' + (recipe.favorito ? '&#10084;&#65039;' : '&#129293;') + '</button>';
            row.addEventListener('click', function() { App.recipe.showDetail(recipe.id); });
            frag.appendChild(row);
          });
          sidebarList.innerHTML = '';
          sidebarList.appendChild(frag);
        }
      }
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      $$('.desktop-panel > .view').forEach(v => v.classList.remove('active'));
      return;
    }

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

const Favorites = {
  show() {
    State.listFilter = { type: 'favorites', id: null, query: null };
    const list = State.recipes.filter(r => r.favorito);

    if (isDesktop()) {
      const sidebarWrap = byId('sidebar-recipes-wrap');
      const sidebarList = byId('sidebar-recipes-list');
      const sidebarTitle = byId('sidebar-recipes-title');
      if (sidebarWrap) sidebarWrap.classList.remove('hidden');
      if (sidebarTitle) sidebarTitle.textContent = 'Favoritos';
      if (sidebarList) {
        sidebarList.innerHTML = '';
        if (list.length === 0) {
          sidebarList.innerHTML = '<div class="empty-state" style="padding:30px 10px;"><div class="big-icon">&#10084;&#65039;</div><h3>Sin favoritos</h3><p>Marca recetas con &#10084;&#65039;</p></div>';
        } else {
          const frag = document.createDocumentFragment();
          list.forEach((recipe, i) => {
            const c = State.categories.find(c => c.id === recipe.categoriaId);
            const row = document.createElement('div');
            row.className = 'recipe-row';
            row.style.animationDelay = (i * 60) + 'ms';
            row.innerHTML = (recipe.fotoPath ? '<img class="recipe-thumb" src="' + recipe.fotoPath + '" alt="">' : '<div class="recipe-thumb-placeholder">&#127859;</div>') +
              '<div class="info"><div class="title">' + escapeHtml(recipe.nombre) + '</div><div class="meta">' + (c ? c.nombre : 'Sin categoria') + ' &middot; ' + (recipe.tiempoMinutos || 0) + ' min</div></div>' +
              '<button class="fav-btn active" onclick="event.stopPropagation(); App.favorites.toggle(&#39;' + recipe.id + '&#39;)">&#10084;&#65039;</button>';
            row.addEventListener('click', function() { App.recipe.showDetail(recipe.id); });
            frag.appendChild(row);
          });
          sidebarList.innerHTML = '';
          sidebarList.appendChild(frag);
        }
      }
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      $$('.desktop-panel > .view').forEach(v => v.classList.remove('active'));
      return;
    }

    Nav.set('recipe-list');
    DOM.listTitle.textContent = 'Favoritos';
    DOM.listFab.style.display = 'none';
    Render.recipeList(list);
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

const Category = {
  form(id) {
    id = id || null;
    State.editingCategoryId = id;
    DOM.catFormTitle.textContent = id ? 'Editar categoria' : 'Nueva categoria';
    DOM.catNameInput.value = id ? (State.category ? State.category.nombre : '') : '';
    DOM.catDeleteBtn.style.display = id ? 'block' : 'none';
    Nav.set('category-form');
    setTimeout(() => { if (DOM.catNameInput) DOM.catNameInput.focus(); }, 100);
  },

  save() {
    const name = DOM.catNameInput ? DOM.catNameInput.value.trim() : '';
    if (!name) { Toast.show('Ingresa un nombre', Icons.warning); AudioEngine.error(); if (DOM.catNameInput) DOM.catNameInput.focus(); return; }
    if (State.editingCategoryId) {
      const cat = State.category;
      if (cat) cat.nombre = name;
    } else {
      State.categories.push({ id: generateId('c'), nombre: name });
    }
    Storage.save(); Render.categories(); Nav.home();
    Toast.show(State.editingCategoryId ? 'Categoria actualizada' : 'Categoria creada', Icons.check);
    AudioEngine.success();
  },

  confirmDelete() {
    const cat = State.category;
    if (!cat) return;
    const hasRecipes = State.recipes.some(r => r.categoriaId === State.editingCategoryId);
    Modal.show('Eliminar categoria',
      hasRecipes ? 'Eliminar "' + escapeHtml(cat.nombre) + '"? Las recetas quedaran sin categoria.' : 'Eliminar "' + escapeHtml(cat.nombre) + '"?',
      function() {
        State.recipes.forEach(function(r) { if (r.categoriaId === State.editingCategoryId) r.categoriaId = ''; });
        State.categories = State.categories.filter(function(c) { return c.id !== State.editingCategoryId; });
        Storage.save(); Render.categories(); Nav.home();
        Toast.show('Categoria eliminada', Icons.trash);
      });
  }
};

const Recipe = {
  showList(type, id) {
    State.listFilter = { type: type, id: id, query: null };
    const cat = State.categories.find(c => c.id === id);
    const list = type === 'category'
      ? State.recipes.filter(r => r.categoriaId === id)
      : State.recipes.slice();

    if (isDesktop()) {
      const sidebarWrap = byId('sidebar-recipes-wrap');
      const sidebarList = byId('sidebar-recipes-list');
      const sidebarTitle = byId('sidebar-recipes-title');
      if (sidebarWrap) sidebarWrap.classList.remove('hidden');
      if (sidebarTitle) sidebarTitle.textContent = type === 'category' ? (cat ? cat.nombre : 'Sin categoria') : 'Recetas';
      if (sidebarList) {
        sidebarList.innerHTML = '';
        if (list.length === 0) {
          sidebarList.innerHTML = '<div class="empty-state" style="padding:30px 10px;"><div class="big-icon">&#127859;</div><h3>No hay recetas</h3><p>Agrega la primera</p></div>';
        } else {
          const frag = document.createDocumentFragment();
          list.forEach((recipe, i) => {
            const c = State.categories.find(c => c.id === recipe.categoriaId);
            const row = document.createElement('div');
            row.className = 'recipe-row';
            row.style.animationDelay = (i * 60) + 'ms';
            row.innerHTML = (recipe.fotoPath ? '<img class="recipe-thumb" src="' + recipe.fotoPath + '" alt="">' : '<div class="recipe-thumb-placeholder">&#127859;</div>') +
              '<div class="info"><div class="title">' + escapeHtml(recipe.nombre) + '</div><div class="meta">' + (c ? c.nombre : 'Sin categoria') + ' &middot; ' + (recipe.tiempoMinutos || 0) + ' min</div></div>' +
              '<button class="fav-btn ' + (recipe.favorito ? 'active' : '') + '" onclick="event.stopPropagation(); App.favorites.toggle(&#39;' + recipe.id + '&#39;)">' + (recipe.favorito ? '&#10084;&#65039;' : '&#129293;') + '</button>';
            row.addEventListener('click', function() { App.recipe.showDetail(recipe.id); });
            frag.appendChild(row);
          });
          sidebarList.innerHTML = '';
          sidebarList.appendChild(frag);
        }
      }
      const placeholder = byId('desktop-placeholder');
      if (placeholder) placeholder.classList.add('visible');
      $$('.desktop-panel > .view').forEach(v => v.classList.remove('active'));
      return;
    }

    Nav.set('recipe-list');
    DOM.listTitle.textContent = type === 'category' ? (cat ? cat.nombre : 'Sin categoria') : 'Recetas';
    DOM.listFab.style.display = type === 'category' ? 'flex' : 'none';
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
    DOM.detailRecipeName.textContent = recipe.nombre;DOM.detailPhotoWrap.innerHTML = recipe.fotoPath? '<img src="' + recipe.fotoPath + '" class="detail-photo" alt="">' : '<div class="detail-photo-placeholder">' + ICONS.chef + '</div>';
    this._renderPortionUI(recipe);
    this.renderSteps(recipe);
    App.timer.renderDetailTimers(recipe);
    DOM.detailTime.textContent = (recipe.tiempoMinutos || 0) + ' min';
    const cat = State.categories.find(c => c.id === recipe.categoriaId);
    DOM.detailCategory.textContent = cat ? cat.nombre : 'Sin categoria';
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
    const steps = getSteps(recipe);
    if (!steps.length) {
      DOM.detailSteps.innerHTML = '<p class="empty-state" style="padding:20px 0">No hay pasos anadidos.</p>';
      return;
    }
    DOM.detailSteps.innerHTML = steps.map(function(step, i) {
      const photoHtml = step.photo ? '<img src="' + step.photo + '" class="step-photo" alt="Paso ' + (i+1) + '">' : '';
      return '<div class="step-item ' + (recipe.stepDone[i] ? 'done' : '') + '" data-step="' + i + '">' +
        '<div class="step-check ' + (recipe.stepDone[i] ? 'checked' : '') + '">' + (recipe.stepDone[i] ? ICONS.check : '') + '</div>' +
        '<div class="step-content">' + photoHtml + '<div class="step-text">' + escapeHtml(step.text) + '</div></div>' +
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
    State._editingStepIndex = null;
    DOM.recipeFormTitle.textContent = id ? 'Editar receta' : 'Nueva receta';

    const catSelect = DOM.recipeCategory;
    catSelect.innerHTML = State.categories.map(function(c) { return '<option value="' + c.id + '">' + escapeHtml(c.nombre) + '</option>'; }).join('') +
      '<option value="">Sin categoria</option>';

    DOM.photoPreview.classList.remove('visible');
    DOM.photoPreview.src = '';
    DOM.photoBtnText.textContent = 'Anadir foto';

    if (id) {
      const recipe = State.recipes.find(r => r.id === id);
      if (recipe) {
        DOM.recipeName.value = recipe.nombre || '';
        DOM.recipeCategory.value = recipe.categoriaId || '';
        DOM.recipeIngredients.value = recipe.ingredientes || '';
        DOM.recipeTime.value = recipe.tiempoMinutos || '';
        DOM.recipeFinalNote.value = recipe.notaFinal || '';
        DOM.recipePorciones.value = recipe.porciones || 4;
        DOM.recipeAjustePorciones.checked = recipe.ajustePorciones !== false;
        DOM.recipeDeleteBtn.style.display = 'block';
        App.timer.buildEditor(recipe.timers || []);
        this.buildStepsEditor(getSteps(recipe));
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
      DOM.recipeTime.value = '';
      DOM.recipeFinalNote.value = '';
      DOM.recipePorciones.value = 4;
      DOM.recipeAjustePorciones.checked = true;
      DOM.recipeDeleteBtn.style.display = 'none';
      App.timer.buildEditor([]);
      this.buildStepsEditor([{text:'',photo:''}]);
    }
    Nav.set('recipe-form');
    setTimeout(function() { if (DOM.recipeName) DOM.recipeName.focus(); }, 100);
  },

  buildStepsEditor(steps) {
    if (!DOM.stepsEditor) return;
    steps = steps || [{text:'',photo:''}];
    DOM.stepsEditor.innerHTML = steps.map(function(step, i) {
      const photoPreview = step.photo ? '<img src="' + step.photo + '" class="step-editor-photo" alt="">' : '';
      const photoBtnText = step.photo ? 'Cambiar foto' : 'Anadir foto';
      return '<div class="step-editor-row" data-index="' + i + '">' +
        '<div class="step-editor-num">' + (i+1) + '</div>' +
        '<div class="step-editor-body">' +
          '<textarea class="step-editor-text" placeholder="Describe este paso..." rows="2">' + escapeHtml(step.text) + '</textarea>' +
          '<div class="step-editor-photo-wrap">' + photoPreview + '</div>' +
          '<div class="step-editor-actions">' +
            '<button type="button" class="step-editor-btn" onclick="App.recipe.pickStepPhoto(' + i + ')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> ' + photoBtnText +
            '</button>' +
            (steps.length > 1 ? '<button type="button" class="step-editor-btn step-editor-remove" onclick="App.recipe.removeStep(' + i + ')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Eliminar' +
            '</button>' : '') +
            (i > 0 ? '<button type="button" class="step-editor-btn" onclick="App.recipe.moveStep(' + i + ',' + (i-1) + ')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M18 15l-6-6-6 6"/></svg> Subir' +
            '</button>' : '') +
            (i < steps.length-1 ? '<button type="button" class="step-editor-btn" onclick="App.recipe.moveStep(' + i + ',' + (i+1) + ')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M6 9l6 6 6-6"/></svg> Bajar' +
            '</button>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  },

  readStepsEditor() {
    if (!DOM.stepsEditor) return [{text:'',photo:''}];
    const rows = $$('.step-editor-row', DOM.stepsEditor);
    return rows.map(function(row) {
      const textEl = row.querySelector('.step-editor-text');
      const photoEl = row.querySelector('.step-editor-photo');
      return {
        text: textEl ? textEl.value.trim() : '',
        photo: photoEl ? photoEl.src : ''
      };
    }).filter(function(s) { return s.text; });
  },

  addStep() {
    const steps = this.readStepsEditor();
    steps.push({text:'',photo:''});
    this.buildStepsEditor(steps);
    setTimeout(function() {
      const texts = $$('.step-editor-text', DOM.stepsEditor);
      if (texts.length) texts[texts.length-1].focus();
    }, 50);
  },

  removeStep(index) {
    const steps = this.readStepsEditor();
    steps.splice(index, 1);
    if (!steps.length) steps.push({text:'',photo:''});
    this.buildStepsEditor(steps);
  },

  moveStep(from, to) {
    const steps = this.readStepsEditor();
    const item = steps.splice(from, 1)[0];
    steps.splice(to, 0, item);
    this.buildStepsEditor(steps);
  },

  pickStepPhoto(index) {
    State._editingStepIndex = index;
    if (DOM.stepPhotoInput) DOM.stepPhotoInput.click();
  },

  handleStepPhoto(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > CONFIG.MAX_PHOTO_MB * 1024 * 1024) {
      Toast.show('La foto es muy grande. Max: 5MB', Icons.warning);
      input.value = '';
      return;
    }
    const index = State._editingStepIndex;
    if (index == null) { input.value = ''; return; }
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
        const base64 = canvas.toDataURL('image/jpeg', CONFIG.PHOTO_QUALITY);
        const steps = App.recipe.readStepsEditor();
        if (steps[index]) steps[index].photo = base64;
        App.recipe.buildStepsEditor(steps);
      };
      img.onerror = function() { Toast.show('Error al cargar la imagen', Icons.error); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
    State._editingStepIndex = null;
  },

  save() {
    const nombre = DOM.recipeName.value.trim();
    var porciones = parseInt(DOM.recipePorciones.value, 10) || 4;
    var ajustePorciones = DOM.recipeAjustePorciones.checked;
    const categoriaId = DOM.recipeCategory.value;
    const ingredientes = DOM.recipeIngredients.value.trim();
    const stepData = this.readStepsEditor();
    const pasos = stepsToString(stepData);
    const stepPhotos = stepData.map(function(s) { return s.photo; });
    const tiempoVal = DOM.recipeTime.value.trim();
    const tiempo = tiempoVal ? parseInt(tiempoVal, 10) : 0;
    const notaFinal = DOM.recipeFinalNote.value.trim();
    const timers = App.timer.readEditor();

    if (!nombre) { Toast.show('La receta necesita un nombre', Icons.warning); AudioEngine.error(); DOM.recipeName.focus(); return; }
    if (tiempoVal && (isNaN(tiempo) || tiempo < 0)) { Toast.show('El tiempo debe ser un numero valido', Icons.warning); AudioEngine.error(); DOM.recipeTime.focus(); return; }

    if (State.editingRecipeId) {
      const recipe = State.recipes.find(r => r.id === State.editingRecipeId);
      if (recipe) {
        recipe.nombre = nombre;
        recipe.categoriaId = categoriaId;
        recipe.ingredientes = ingredientes;
        recipe.pasos = pasos;
        recipe.stepPhotos = stepPhotos;
        recipe.tiempoMinutos = tiempo;
        recipe.fotoPath = State.currentPhotoBase64 || recipe.fotoPath || '';
        recipe.notaFinal = notaFinal;
        recipe.timers = timers;
        recipe.porciones = Math.max(1, porciones);
        recipe.ajustePorciones = ajustePorciones;
        Storage.normalizeRecipe(recipe);
        Storage.ensureStepState(recipe);
      }
    } else {
      const newRecipe = {
        id: generateId('r'),
        categoriaId: categoriaId, nombre: nombre, ingredientes: ingredientes, pasos: pasos,
        stepPhotos: stepPhotos,
        tiempoMinutos: tiempo,
        favorito: false,
        fotoPath: State.currentPhotoBase64,
        notaFinal: notaFinal,
        porciones: Math.max(1, porciones),
        ajustePorciones: ajustePorciones,
        timers: timers,
        stepDone: []
      };
      State.recipes.push(newRecipe);
    }
    Storage.save();
    Toast.show(State.editingRecipeId ? 'Receta actualizada' : 'Receta guardada', Icons.check);
    AudioEngine.success();
    Nav.backFromForm();
  },

  confirmDelete() {
    const id = State.editingRecipeId || State.currentRecipeId;
    if (!id) return;
    const recipe = State.recipes.find(r => r.id === id);
    if (!recipe) return;
    Modal.show('Eliminar receta', 'Eliminar "' + escapeHtml(recipe.nombre) + '"? Esta accion no se puede deshacer.', function() {
      State.recipes = State.recipes.filter(function(r) { return r.id !== id; });
      Storage.save();
      if (State.currentView === 'recipe-detail') Nav.backFromDetail();
      else Nav.backFromForm();
      Toast.show('Receta eliminada', Icons.trash);
      AudioEngine.delete();
    });
  },

  _renderPortionUI: function(recipe) {
    if (!recipe || !DOM.portionControl || !DOM.portionDisplay || !DOM.detailIngredients) return;
    if (recipe.ajustePorciones) {
      DOM.portionControl.style.display = 'flex';
      var current = State.portionsMap[recipe.id] || recipe.porciones;
      DOM.portionDisplay.textContent = current;
      var factor = recipe.porciones > 0 ? current / recipe.porciones : 1;
      DOM.detailIngredients.innerHTML = parseLines(scaleIngredientsText(recipe.ingredientes, factor))
        .map(function(l) { return l.trim() ? '<li>' + escapeHtml(l) + '</li>' : ''; }).join('');
    } else {
      DOM.portionControl.style.display = 'none';
      DOM.detailIngredients.innerHTML = parseLines(recipe.ingredientes)
        .map(function(line) { return '<li>' + escapeHtml(line) + '</li>'; }).join('');
    }
  },

  adjustPortions: function(delta) {
    var recipe = State.recipe;
    if (!recipe || !recipe.ajustePorciones) return;
    var current = State.portionsMap[recipe.id] || recipe.porciones;
    var next = Math.max(1, current + delta);
    State.portionsMap[recipe.id] = next;
    this._renderPortionUI(recipe);
    Toast.show('Porciones: ' + next, Icons.check);
  },

  resetPortions: function() {
    var recipe = State.recipe;
    if (!recipe) return;
    State.portionsMap[recipe.id] = recipe.porciones;
    this._renderPortionUI(recipe);
    Toast.show('Cantidades originales', Icons.refresh);
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

const Photo = {
  handle(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > CONFIG.MAX_PHOTO_MB * 1024 * 1024) {
      Toast.show('La foto es muy grande. Max: 5MB', Icons.warning);
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
      img.onerror = function() { DOM.photoBtnText.textContent = 'Anadir foto'; Toast.show('Error al cargar la imagen', Icons.error); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
};

const Timer = {
  buildEditor(timers) {
    const box = DOM.recipeTimersEditor;
    const list = Array.isArray(timers) && timers.length ? timers : [];
    box.innerHTML = list.map(function(t, i) {
      return '<div class="v4-timer-editor">' +
        '<input type="text" class="v4-timer-name" placeholder="Nombre" value="' + escapeHtml(t.name || '') + '">' +
        '<div class="v4-time-row">' +
        '<input type="number" class="v4-timer-min" placeholder="Min" min="0" value="' + Math.floor((t.durationSeconds || 0) / 60) + '">' + ':' +
        '<input type="number" class="v4-timer-sec" placeholder="Seg" min="0" max="59" value="' + ((t.durationSeconds || 0) % 60) + '">' +
        '<button class="header-btn" onclick="App.timer.removeEditor(' + i + ')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
        '</div></div>';
    }).join('');
  },

  readEditor() {
    return $$('.v4-timer-editor', DOM.recipeTimersEditor).map(function(row, i) {
      const nameEl = row.querySelector('.v4-timer-name');
      const minEl = row.querySelector('.v4-timer-min');
      const secEl = row.querySelector('.v4-timer-sec');
      const name = nameEl ? nameEl.value.trim() : ('Cronometro ' + (i + 1));
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
    DOM.timerPlayBtn.innerHTML = State.mainTimer.running ? Icons.pause : Icons.play;
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
    Toast.show('¡Tiempo finalizado!', Icons.alarm);
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
    wrap.innerHTML = '<h3>Cronometros de la receta</h3>' +
      recipe.timers.map(function(timer, i) {
        return '<div class="v4-timer-card">' +
          '<h4>' + escapeHtml(timer.name || 'Cronometro') + '</h4>' +
          '<div id="detailTimerDisplay_' + i + '" class="v4-display ' + self.timerClass(timer) + '">' + formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds) + '</div>' +
          '<div class="v4-timer-actions">' +
          '<button onclick="App.timer.startDetail(' + i + ')"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg> Iniciar</button>' +
          '<button onclick="App.timer.pauseDetail(' + i + ')"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pausar</button>' +
          '<button onclick="App.timer.resetDetail(' + i + ')">↺ Reiniciar</button>' +
          '</div></div>';
      }).join('');
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
          Toast.show('Cronometro terminado: ' + (timer.name || 'Listo'), Icons.alarm);
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

/* ============================================================
   COOK MODE — MEJORADO v5.4
   Salida robusta, TTS con cola, auto-lectura, teclado, swipe
   ============================================================ */
const CookMode = (() => {
  let wakeLock = null;
  let currentStep = 0;
  let steps = [];
  let quickTimerInterval = null;
  let quickTimerSeconds = 0;
  let quickTimerRunning = false;
  let cookTimerInterval = null;
  let spanishVoice = null;
  let voicesLoaded = false;
  let utteranceQueue = [];
  let isSpeaking = false;
  let swipeHandler = null;
  let keyHandler = null;

  /* ---------- TTS: Motor de voz mejorado ---------- */
  function initVoices() {
    if (!('speechSynthesis' in window)) return;

    const pickBestVoice = (list) => {
      const prefs = ['es-mx', 'es-es', 'es-ar', 'es-co', 'es-cl', 'es-us', 'es'];
      for (const pref of prefs) {
        const v = list.find(vo => vo.lang.toLowerCase().startsWith(pref));
        if (v) return v;
      }
      return list.find(vo => vo.lang.toLowerCase().includes('es')) || null;
    };

    const load = () => {
      const all = window.speechSynthesis.getVoices();
      if (all && all.length) {
        spanishVoice = pickBestVoice(all);
        voicesLoaded = true;
      }
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;
  }
  initVoices();

  /* ---------- TTS: Cola de utterances ---------- */
  function enqueueSpeak(text) {
    if (!text || !text.trim()) return;
    utteranceQueue.push(text.trim());
    processQueue();
  }

  function processQueue() {
    if (isSpeaking || utteranceQueue.length === 0) return;
    if (!window.speechSynthesis) return;

    const text = utteranceQueue.shift();
    isSpeaking = true;

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = spanishVoice ? spanishVoice.lang : 'es-MX';
      u.rate = 0.9;
      u.pitch = 1.0;
      if (spanishVoice) u.voice = spanishVoice;

      if (window.speechSynthesis.paused) window.speechSynthesis.resume();

      u.onstart = () => {
        if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.add('speaking');
      };
      u.onend = () => {
        isSpeaking = false;
        if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.remove('speaking');
        setTimeout(processQueue, 150);
      };
      u.onerror = (err) => {
        isSpeaking = false;
        if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.remove('speaking');
        if (err && err.error === 'not-allowed') {
          Toast.show('Toca la pantalla primero para activar la voz', Icons.pointer);
        } else if (err && err.error === 'canceled') {
          // Normal si el usuario avanza rapido
        } else {
          console.warn('TTS error:', err);
        }
      };
      window.speechSynthesis.speak(u);
    } catch (err) {
      isSpeaking = false;
      console.error('TTS speak error:', err);
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      Toast.show('Tu navegador no soporta lectura de voz', Icons.mute);
      return;
    }
    utteranceQueue = [];
    window.speechSynthesis.cancel();
    isSpeaking = false;
    enqueueSpeak(text);
  }

  function stopSpeaking() {
    utteranceQueue = [];
    isSpeaking = false;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (DOM.cookTtsBtn) DOM.cookTtsBtn.classList.remove('speaking');
  }

  /* ---------- Wake Lock ---------- */
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      }
    } catch (e) { /* silencioso */ }
  }

  function releaseWakeLock() {
    if (wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }
  }

  /* ---------- Utilidades ---------- */
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

    const dotsHtml = steps.map((_, i) =>
      `<span class="${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}"></span>`
    ).join('');
    if (DOM.cookDots) DOM.cookDots.innerHTML = dotsHtml;
    if (DOM.cookNavDots) DOM.cookNavDots.innerHTML = dotsHtml;

    if (DOM.cookPrevBtn) DOM.cookPrevBtn.disabled = currentStep === 0;
    if (DOM.cookNextBtn) {
      DOM.cookNextBtn.innerHTML = currentStep >= steps.length - 1
        ? 'Finalizar <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>'
        : 'Siguiente <span>→</span>';
      DOM.cookNextBtn.classList.toggle('finish-btn', currentStep >= steps.length - 1);
    }
  }

  function renderStep() {
    if (!DOM.cookStepText) return;

    if (currentStep >= steps.length) {
      DOM.cookStepNum.textContent = '';
      DOM.cookStepText.innerHTML = `
        <div class="cook-finish">
          <div class="cook-finish-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 16-4"/><path d="m8.86 6.78-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8"/></svg></div>
          <h2>¡Listo!</h2>
          <p>Todos los pasos completados. Buen provecho.</p>
        </div>`;
      return;
    }

    const stepText = steps[currentStep];
    const minutes = extractMinutes(stepText);
    let quickHtml = '';
    if (minutes && minutes > 0) {
      quickHtml = `<button class="cook-quick-timer-btn" onclick="App.cookMode.startQuickTimer(${minutes})" aria-label="Iniciar timer de ${minutes} minutos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M16 2v2"/><path d="M8 2v2"/></svg> ${minutes} min
      </button>`;
    }

    DOM.cookStepNum.textContent = 'Paso ' + (currentStep + 1) + ' de ' + steps.length;
    DOM.cookStepText.innerHTML = '<p class="cook-step-line">' + escapeHtml(stepText) + '</p>' + quickHtml;
    DOM.cookStepText.classList.remove('prev');
    updateProgress();
  }

  /* ---------- Timers en modo cocina ---------- */
  function renderCookTimers() {
    const recipe = State.recipe;
    if (!DOM.cookTimersList || !recipe) return;
    Storage.normalizeRecipe(recipe);

    if (!recipe.timers.length) {
      DOM.cookTimersList.innerHTML = '<p class="cook-empty-timers">No hay cronometros en esta receta</p>';
      return;
    }

    DOM.cookTimersList.innerHTML = recipe.timers.map((timer, i) => {
      const cls = timer.remainingSeconds <= 0 && !timer.running ? 'finished'
        : (timer.remainingSeconds <= 60 && timer.running ? 'warning' : '');
      return `<div class="cook-timer-row">
        <span class="ct-name">${escapeHtml(timer.name || 'Timer')}</span>
        <span id="cookTimerDisplay_${i}" class="ct-time ${cls}">${formatTime(timer.remainingSeconds != null ? timer.remainingSeconds : timer.durationSeconds)}</span>
        <div class="ct-actions">
          <button onclick="App.cookMode.startRecipeTimer(${i})" aria-label="Iniciar"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>
          <button onclick="App.cookMode.pauseRecipeTimer(${i})" aria-label="Pausar"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
          <button onclick="App.cookMode.resetRecipeTimer(${i})" aria-label="Reiniciar">↺</button>
        </div>
      </div>`;
    }).join('');
  }

  function updateCookTimers() {
    const recipe = State.recipe;
    if (!recipe) return;
    let changed = false;

    recipe.timers.forEach((timer, i) => {
      if (timer.running && timer.endAt) {
        const remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        if (remaining !== timer.remainingSeconds) {
          timer.remainingSeconds = remaining;
          changed = true;
        }
        if (remaining <= 0) {
          timer.running = false;
          timer.endAt = 0;
          changed = true;
          if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
          AudioEngine.timerDone();
          Toast.show('Cronometro terminado: ' + (timer.name || 'Listo'), Icons.alarm);
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
    if (DOM.cookQuickDisplay) {
      DOM.cookQuickDisplay.style.display = 'block';
      DOM.cookQuickDisplay.classList.add('active');
    }
    updateQuickDisplay();
    quickTimerInterval = setInterval(() => {
      quickTimerSeconds--;
      updateQuickDisplay();
      if (quickTimerSeconds <= 0) {
        clearInterval(quickTimerInterval);
        quickTimerRunning = false;
        if (DOM.cookQuickDisplay) DOM.cookQuickDisplay.classList.remove('active');
        if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);
        AudioEngine.timerDone();
        Toast.show('¡Tiempo del paso terminado!', Icons.alarm);
      }
    }, 1000);
  }

  function updateQuickDisplay() {
    if (DOM.cookQuickDisplay) DOM.cookQuickDisplay.textContent = formatTime(quickTimerSeconds);
  }

  /* ---------- Navegacion de pasos ---------- */
  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      AudioEngine.tap();
      if (navigator.vibrate) navigator.vibrate(20);
      renderStep();
      speakCurrentStep();
    } else if (currentStep === steps.length - 1) {
      finishAndExit();
    }
  }

  function prev() {
    if (currentStep > 0) {
      currentStep--;
      AudioEngine.tap();
      if (navigator.vibrate) navigator.vibrate(20);
      renderStep();
      speakCurrentStep();
    }
  }

  function speakCurrentStep() {
    if (currentStep >= 0 && currentStep < steps.length) {
      speak(steps[currentStep]);
    }
  }

  function finishAndExit() {
    currentStep = steps.length;
    renderStep();
    stopSpeaking();
    AudioEngine.success();
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    setTimeout(() => { doExit(); }, 2000);
  }

  /* ---------- Gestos tactiles ---------- */
  function setupSwipe() {
    const body = DOM.cookBody;
    if (!body) return;
    let startX = 0;
    let startY = 0;

    swipeHandler = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
    body.addEventListener('touchstart', swipeHandler, { passive: true });

    body.addEventListener('touchend', (e) => {
      const diffX = startX - e.changedTouches[0].clientX;
      const diffY = startY - e.changedTouches[0].clientY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
        if (diffX > 0) next(); else prev();
      }
    }, { passive: true });
  }

  function removeSwipe() {
    const body = DOM.cookBody;
    if (body && swipeHandler) {
      body.removeEventListener('touchstart', swipeHandler);
      swipeHandler = null;
    }
  }

  /* ---------- Ingredientes overlay ---------- */
  function showIngredients() {
    var recipe = State.recipe;
    if (!recipe) return;
    var factor = (recipe.ajustePorciones && State.portionsMap[recipe.id])
      ? State.portionsMap[recipe.id] / recipe.porciones
      : 1;
    var lines = parseLines(scaleIngredientsText(recipe.ingredientes, factor));
    DOM.cookIngredientsList.innerHTML = lines.length
      ? lines.map(function(l) { return l.trim() ? '<li>' + escapeHtml(l) + '</li>' : ''; }).join('')
      : '<li class="empty">Sin ingredientes</li>';
    DOM.cookIngredientsOverlay.classList.add('active');
  }

  function closeIngredients() {
    if (DOM.cookIngredientsOverlay) DOM.cookIngredientsOverlay.classList.remove('active');
  }

  function toggleTimersPanel() {
    if (DOM.cookTimersPanel) DOM.cookTimersPanel.classList.toggle('collapsed');
  }

  /* ---------- DETECCION DE TIMERS ACTIVOS ---------- */
  function hasActiveTimers() {
    const recipe = State.recipe;
    if (recipe && recipe.timers && recipe.timers.some(t => t.running)) return true;
    return quickTimerRunning;
  }

  /* ---------- SALIDA ROBUSTA Y LIMPIA ---------- */
  function pauseAllTimers() {
    const recipe = State.recipe;
    if (recipe && recipe.timers) {
      recipe.timers.forEach(timer => {
        if (timer.running && timer.endAt) {
          timer.remainingSeconds = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
        }
        timer.running = false;
        timer.endAt = 0;
      });
    }
    if (quickTimerRunning && quickTimerInterval) {
      clearInterval(quickTimerInterval);
      quickTimerRunning = false;
    }
    Storage.saveDebounced();
  }

  function doExit() {
    _navLock = true;

    // 1. Pausar todos los timers correctamente
    pauseAllTimers();

    // 2. Detener TTS completamente
    stopSpeaking();

    // 3. Liberar wake lock
    releaseWakeLock();

    // 4. Limpiar todos los intervals
    if (quickTimerInterval) { clearInterval(quickTimerInterval); quickTimerInterval = null; }
    if (cookTimerInterval) { clearInterval(cookTimerInterval); cookTimerInterval = null; }

    // 5. Remover listeners de gestos
    removeSwipe();

    // 6. Remover listener de teclado del modo cocina
    if (keyHandler) {
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }

    // 7. Resetear estado interno
    currentStep = 0;
    steps = [];
    quickTimerSeconds = 0;
    quickTimerRunning = false;
    utteranceQueue = [];
    isSpeaking = false;

    // 8. Ocultar overlays
    closeIngredients();

    // 9. Animacion de salida
    const cookView = byId('view-cook-mode');
    if (cookView) cookView.classList.add('exiting');

    // 10. Navegacion segura con fallback
    setTimeout(() => {
      if (cookView) cookView.classList.remove('exiting');

      const pv = State.previousViewBeforeDetail;
      if (pv) {
        if (pv.type === 'category') App.recipe.showList('category', pv.id);
        else if (pv.type === 'favorites') App.favorites.show();
        else if (pv.type === 'search' && pv.query) App.search.handle(pv.query);
        else Nav.home();
        State.previousViewBeforeDetail = null;
      } else {
        Nav.home();
      }

      _navLock = false;
    }, 250);
  }

  /* ---------- TECLADO EN MODO COCINA ---------- */
  function setupKeyboard() {
    keyHandler = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        speakCurrentStep();
      }
      else if (e.key === 'Escape') {
        e.preventDefault();
        exit();
      }
    };
    document.addEventListener('keydown', keyHandler);
  }

  /* ---------- API PUBLICA ---------- */
  return {
    enter() {
      const recipe = State.recipe;
      if (!recipe) return;

      steps = parseLines(recipe.pasos);
      currentStep = 0;
      quickTimerSeconds = 0;
      quickTimerRunning = false;
      utteranceQueue = [];
      isSpeaking = false;

      if (quickTimerInterval) clearInterval(quickTimerInterval);
      if (cookTimerInterval) clearInterval(cookTimerInterval);

      DOM.cookTitle.textContent = recipe.nombre;
      Nav.set('cook-mode');

      requestWakeLock();
      renderStep();
      renderCookTimers();
      setupSwipe();
      setupKeyboard();

      cookTimerInterval = setInterval(updateCookTimers, 1000);
      updateCookTimers();
      Storage.ensureStepState(recipe);

      // Auto-leer el primer paso despues de un pequeno delay
      setTimeout(() => speakCurrentStep(), 600);
    },

    exit() {
      if (hasActiveTimers()) {
        Modal.show('Salir del modo cocinar',
          'Hay cronometros activos. ¿Seguro que quieres salir? Se pausaran y podras reanudarlos despues.',
          () => { doExit(); });
        return;
      }
      doExit();
    },

    next,
    prev,
    speak: speakCurrentStep,
    showIngredients,
    closeIngredients,
    toggleTimersPanel,
    startQuickTimer,
    startRecipeTimer(i) { Timer.startDetail(i); updateCookTimers(); },
    pauseRecipeTimer(i) { Timer.pauseDetail(i); updateCookTimers(); },
    resetRecipeTimer(i) { Timer.resetDetail(i); updateCookTimers(); }
  };
})();

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
    Toast.show('Backup descargado', Icons.save);
  },

  import(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data.categories) || !Array.isArray(data.recipes)) throw new Error('Formato invalido');
        data.categories.forEach(function(c) {
          if (typeof c.id !== 'string') c.id = generateId('c');
          if (typeof c.nombre !== 'string') c.nombre = 'Sin nombre';
        });
        data.recipes.forEach(function(r) {
          if (typeof r.id !== 'string') r.id = generateId('r');
          if (typeof r.nombre !== 'string') r.nombre = 'Sin nombre';
        });
        Modal.show('Importar datos', 'Esto reemplazara TODOS tus datos actuales. ¿Continuar?', function() {
          State.categories = data.categories;
          State.recipes = data.recipes;
          Storage.normalizeAll();
          Storage.save();
          Render.categories();
          Nav.home();
          Toast.show('Datos importados correctamente', Icons.check);
        });
      } catch (err) { Toast.show('Archivo invalido', Icons.error); }
    };
    reader.readAsText(file);
    input.value = '';
  },

  confirmClear() {
    Modal.show('Borrar todo', 'Esto eliminara TODAS las recetas y categorias. No se puede deshacer.', function() {
      State.categories = [];
      State.recipes = [];
      Storage.save();
      Render.categories();
      Nav.home();
      Toast.show('Todos los datos eliminados', Icons.trash);
    });
  }
};

const Settings = {
  show() {
    Nav.set('settings');
    this.updateSoundToggle();
    this.updateAboutStats();
  },
  updateAboutStats() {
    const recipesEl = document.getElementById('aboutStatRecipes');
    const catsEl = document.getElementById('aboutStatCategories');
    const favsEl = document.getElementById('aboutStatFavorites');
    if (recipesEl) recipesEl.textContent = State.recipes.length;
    if (catsEl) catsEl.textContent = State.categories.length;
    if (favsEl) favsEl.textContent = State.recipes.filter(r => r.favorito).length;
  },
  updateSoundToggle() {
    if (DOM.soundToggle) DOM.soundToggle.classList.toggle('active', AudioEngine.enabled);
    if (DOM.soundDesc) DOM.soundDesc.textContent = AudioEngine.enabled ? 'Activados' : 'Silenciados';
  },
  toggleSound() {
    const on = AudioEngine.toggle();
    this.updateSoundToggle();
    Toast.show(on ? 'Sonidos activados' : 'Sonidos silenciados', on ? Icons.sound : Icons.mute);
  }
};

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

function hideSplash() {
  const splash = DOM.splash;
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(function() { splash.remove(); }, 700);
  }
}

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

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            App.toast.show('Actualizacion disponible. Recarga la app.', Icons.refresh);
          }
        });
      });
    });
  }

  window.addEventListener('popstate', function(e) {
    _navLock = true;
    if (State.currentView === 'cook-mode') {
      CookMode.exit();
    } else if (State.currentView === 'recipe-detail') {
      Nav.backFromDetail();
    } else if (State.currentView === 'recipe-form') {
      Nav.backFromForm();
    } else if (State.currentView === 'category-form') {
      Nav.home();
    } else if (State.currentView === 'settings') {
      Nav.home();
    } else if (State.currentView === 'recipe-list') {
      Nav.home();
    }
    _navLock = false;
  });

  setTimeout(hideSplash, 1800);

  if (isDesktop()) {
    const placeholder = byId('desktop-placeholder');
    if (placeholder) placeholder.classList.add('visible');
  }

  window.addEventListener('resize', debounce(function() {
    if (isDesktop()) {
      const homeView = byId('view-home');
      if (homeView) homeView.classList.add('active');
    }
  }, 200));
}

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
