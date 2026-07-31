/* ============================================================
   Mi Recetario — js/core.js v5.4-reorg
   Estado global, utilidades, audio engine, almacenamiento y DOM.
   ============================================================ */

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
    sound: 'mr_sound_enabled',
    useFileStorage: 'mr_use_fs',
    attempts: 'mr_attempts'
  },
  MAX_PHOTO_MB: 5,
  PHOTO_MAX_WIDTH: 800,
  PHOTO_QUALITY: 0.7,
  SAVE_DEBOUNCE_MS: 2000,
  SEARCH_DEBOUNCE_MS: 200,
  TIMER_TICK_MS: 250
};

const ICONS = {
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  folderOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  chef: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/></svg>',
  utensils: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
};

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

function parseLinesKeepEmpty(value) {
  return String(value ?? '').split(/\r?\n/);
}

function getSteps(recipe) {
  if (!recipe) return [];
  const texts = parseLinesKeepEmpty(recipe.pasos);
  const photos = Array.isArray(recipe.stepPhotos) ? recipe.stepPhotos : [];
  return texts.map((text, i) => ({ text: text.trim(), photo: photos[i] || '' }));
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
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.sound);
      if (saved !== null) enabled = saved !== 'false';
    } catch (e) {}
  }
  function saveSetting() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.sound, enabled);
      if (FileStorage.active) FileStorage.save();
    } catch (e) {}
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

const FileStorage = (() => {
  let active = false;
  let dirHandle = null;
  let permissionState = null; // 'granted', 'prompt', 'denied', or null
  const DB_NAME = 'mr_fs_db';
  const STORE_NAME = 'handles';
  const KEY = 'dirHandle';

  function isSupported() {
    return 'showDirectoryPicker' in window && window.isSecureContext && !isMobile();
  }
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  function openDB() {
    return new Promise(function(resolve, reject) {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function(e) {
        e.target.result.createObjectStore(STORE_NAME);
      };
      req.onsuccess = function(e) { resolve(e.target.result); };
      req.onerror = function() { reject(); };
    });
  }

  function saveHandle(handle) {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(handle, KEY);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(); };
      });
    });
  }

  function getHandle() {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(KEY);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(); };
      });
    });
  }

  function removeHandle() {
    return openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(KEY);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(); };
      });
    });
  }

  async function init() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.useFileStorage);
      if (saved !== 'true') return;
      const handle = await getHandle();
      if (!handle) {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.useFileStorage);
        return;
      }
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      permissionState = perm;
      if (perm === 'granted') {
        dirHandle = handle;
        active = true;
        await load();
      } else if (perm === 'prompt') {
        dirHandle = handle;
        active = false;
        console.log('FileStorage: permission prompt, waiting for user gesture');
      } else {
        // perm === 'denied' or unknown
        dirHandle = null;
        active = false;
        permissionState = 'denied';
        localStorage.removeItem(CONFIG.STORAGE_KEYS.useFileStorage);
        await removeHandle();
        console.log('FileStorage: permission denied, reset to localStorage');
      }
    } catch (e) {
      console.error('FileStorage init error', e);
      active = false;
      dirHandle = null;
      permissionState = null;
    }
  }

  async function activate() {
    if (!isSupported()) {
      Toast.show(isMobile() ? 'Solo disponible en computadoras de escritorio' : 'Requiere HTTPS o localhost para funcionar', Icons.warning);
      return false;
    }
    try {
      const handle = await window.showDirectoryPicker();
      dirHandle = handle;
      await writeFile('.mr_test', { ok: true });
      await dirHandle.removeEntry('.mr_test');
      await migrateToFolder();
      const cats = await readFile('categories.json');
      const recs = await readFile('recipes.json');
      if (!cats && !recs && (State.categories.length > 0 || State.recipes.length > 0)) {
        dirHandle = null;
        Toast.show('Error al escribir en la carpeta', Icons.error);
        return false;
      }
      await saveHandle(handle);
      localStorage.setItem(CONFIG.STORAGE_KEYS.useFileStorage, 'true');
      active = true;
      permissionState = 'granted';
      return true;
    } catch (e) {
      dirHandle = null;
      permissionState = null;
      if (e.name !== 'AbortError') {
        console.error('activate error', e);
        Toast.show('Error al acceder a la carpeta', Icons.error);
      }
      return false;
    }
  }

  async function reauthorize() {
    if (!dirHandle) return false;
    try {
      const perm = await dirHandle.requestPermission({ mode: 'readwrite' });
      permissionState = perm;
      if (perm === 'granted') {
        active = true;
        await load();
        Toast.show('Acceso a carpeta restaurado', Icons.check);
        AudioEngine.success();
        Render.categories();
        return true;
      }
      Toast.show('Permiso denegado para la carpeta', Icons.warning);
      return false;
    } catch (e) {
      console.error('reauthorize error', e);
      return false;
    }
  }

  async function deactivate() {
    if (!active && !dirHandle) return false;
    try {
      // Only migrate from folder if we actually have access
      if (active && dirHandle) {
        await migrateToLocal();
      }
      // Always ensure localStorage has current memory state as ultimate fallback
      localStorage.setItem(CONFIG.STORAGE_KEYS.categories, JSON.stringify(State.categories));
      localStorage.setItem(CONFIG.STORAGE_KEYS.recipes, JSON.stringify(State.recipes));
      localStorage.setItem(CONFIG.STORAGE_KEYS.attempts, JSON.stringify(Attempts._data));
      localStorage.setItem(CONFIG.STORAGE_KEYS.sound, AudioEngine.enabled);
      if (active && dirHandle) {
        await clearFolder();
      }
      await removeHandle();
      localStorage.removeItem(CONFIG.STORAGE_KEYS.useFileStorage);
      dirHandle = null;
      active = false;
      permissionState = null;
      return true;
    } catch (e) {
      console.error('deactivate error', e);
      // Even on error, ensure we don't leave the app in a broken state
      localStorage.setItem(CONFIG.STORAGE_KEYS.categories, JSON.stringify(State.categories));
      localStorage.setItem(CONFIG.STORAGE_KEYS.recipes, JSON.stringify(State.recipes));
      localStorage.setItem(CONFIG.STORAGE_KEYS.attempts, JSON.stringify(Attempts._data));
      localStorage.removeItem(CONFIG.STORAGE_KEYS.useFileStorage);
      dirHandle = null;
      active = false;
      permissionState = null;
      Toast.show('Error al migrar datos', Icons.error);
      return false;
    }
  }

  async function writeFile(name, data) {
    if (!dirHandle) throw new Error('No dirHandle');
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  async function readFile(name) {
    if (!dirHandle) return null;
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch (e) {
      if (e.name === 'NotFoundError' || e.name === 'TypeError') return null;
      console.error('readFile error', e);
      return null;
    }
  }

  async function migrateToFolder() {
    await writeFile('categories.json', State.categories);
    await writeFile('recipes.json', State.recipes);
    await writeFile('attempts.json', Attempts._data);
    await writeFile('settings.json', {
      sound: AudioEngine.enabled,
      timer: localStorage.getItem(CONFIG.STORAGE_KEYS.timer)
    });
  }

  async function migrateToLocal() {
    const cats = await readFile('categories.json') || [];
    const recs = await readFile('recipes.json') || [];
    const atts = await readFile('attempts.json') || [];
    const settings = await readFile('settings.json') || {};
    State.categories = cats;
    State.recipes = recs;
    Attempts._data = atts;
    localStorage.setItem(CONFIG.STORAGE_KEYS.categories, JSON.stringify(cats));
    localStorage.setItem(CONFIG.STORAGE_KEYS.recipes, JSON.stringify(recs));
    localStorage.setItem(CONFIG.STORAGE_KEYS.attempts, JSON.stringify(atts));
    if (settings.sound !== undefined) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.sound, settings.sound);
      AudioEngine.enabled = settings.sound !== 'false';
    }
    if (settings.timer) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.timer, settings.timer);
    }
  }

  async function clearFolder() {
    if (!dirHandle) return;
    const files = ['categories.json', 'recipes.json', 'attempts.json', 'settings.json', '.mr_test'];
    for (const f of files) {
      try { await dirHandle.removeEntry(f); } catch (e) {}
    }
  }

  async function save() {
    if (!active || !dirHandle) return;
    try {
      await writeFile('categories.json', State.categories);
      await writeFile('recipes.json', State.recipes);
      await writeFile('attempts.json', Attempts._data);
      await writeFile('settings.json', {
        sound: AudioEngine.enabled,
        timer: localStorage.getItem(CONFIG.STORAGE_KEYS.timer)
      });
    } catch (e) {
      console.error('FileStorage.save error', e);
      active = false;
      permissionState = null;
      Toast.show('Error guardando en carpeta. Usando localStorage.', Icons.warning);
    }
  }

  async function load() {
    if (!active || !dirHandle) return;
    try {
      const cats = await readFile('categories.json');
      const recs = await readFile('recipes.json');
      const atts = await readFile('attempts.json');
      const settings = await readFile('settings.json');
      if (cats) State.categories = cats;
      if (recs) State.recipes = recs;
      if (atts) Attempts._data = atts;
      if (settings) {
        if (settings.sound !== undefined) {
          AudioEngine.enabled = settings.sound !== 'false';
        }
        if (settings.timer) {
          localStorage.setItem(CONFIG.STORAGE_KEYS.timer, settings.timer);
        }
      }
    } catch (e) {
      console.error('FileStorage.load error', e);
    }
  }

  async function writeMedia(name, blob) {
    if (!dirHandle) throw new Error('No dirHandle');
    const fileHandle = await dirHandle.getFileHandle(name, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  }

  async function readMedia(name) {
    if (!dirHandle) return null;
    try {
      const fileHandle = await dirHandle.getFileHandle(name);
      const file = await fileHandle.getFile();
      return URL.createObjectURL(file);
    } catch (e) {
      if (e.name === 'NotFoundError' || e.name === 'TypeError') return null;
      console.error('readMedia error', e);
      return null;
    }
  }

  async function deleteMedia(name) {
    if (!dirHandle) return;
    try { await dirHandle.removeEntry(name); } catch (e) {}
  }

  return {
    get active() { return active; },
    get dirName() { return dirHandle ? dirHandle.name : ''; },
    get needsReauth() { return !!dirHandle && !active && permissionState === 'prompt'; },
    get permissionState() { return permissionState; },
    isSupported,
    init,
    activate,
    deactivate,
    reauthorize,
    save,
    load,
    writeMedia,
    readMedia,
    deleteMedia
  };
})();

const Storage = {
  async load() {
    if (FileStorage.active) {
      await FileStorage.load();
      this.normalizeAll();
      return;
    }
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
    if (FileStorage.active) {
      FileStorage.save();
      Settings.updateAboutStats();
      return;
    }
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.categories, JSON.stringify(State.categories));
      localStorage.setItem(CONFIG.STORAGE_KEYS.recipes, JSON.stringify(State.recipes));
      Settings.updateAboutStats();
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
    const stepCount = parseLinesKeepEmpty(recipe.pasos).length;
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
    const steps = parseLinesKeepEmpty(recipe.pasos);
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
    'fileStorageToggle','fileStorageDesc',
    'cookTitle','cookBody','cookStepNum','cookStepText','cookDots','cookNavDots',
    'cookPrevBtn','cookNextBtn','cookTtsBtn','cookQuickTimerWrap','cookQuickDisplay',
    'cookTimersPanel','cookTimersList','cookProgressBar',
    'cookIngredientsOverlay','cookIngredientsList',
    'attemptsSection','attemptsToggleBtn','attemptsContent','attemptsList',
    'attemptFormWrap','attemptPhotoInput','attemptPhotoPreview','attemptPhotoBtnText',
    'attemptRatingStars','attemptRatingSelect','attemptNotesInput','attemptSaveBtn','attemptCancelBtn','updateBanner','updateBtn',
    'attemptsGlobalList','attemptFormTitle',
    'aboutStatRecipes','aboutStatCategories','aboutStatFavorites'
  ];
  ids.forEach(id => DOM[id] = byId(id));
}