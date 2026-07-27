/* ============================================
   Mi Recetario — app.js
   Lógica de la aplicación PWA
   ============================================ */

'use strict';

// ── Service Worker ─────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// ── Constantes ─────────────────────────────
const STORAGE_KEYS = {
  categories: 'mr_categories',
  recipes: 'mr_recipes',
  timer: 'mr_timer_v4',
  state: 'mr_app_state'
};

const ICONS = {
  folder: '&#128193;',
  folderOpen: '&#128194;',
  chef: '&#127858;',
  utensils: '&#127860;'
};

// ── Estado global ──────────────────────────
const state = {
  categories: [
    { id: 'c1', nombre: 'Desayunos' },
    { id: 'c2', nombre: 'Comidas' },
    { id: 'c3', nombre: 'Postres' }
  ],
  recipes: [
    { id: 'r1', categoriaId: 'c1', nombre: 'Tortilla de huevo', ingredientes: '3 huevos\nSal\nPimienta\n1 cda aceite', pasos: 'Batir los huevos con sal y pimienta\nCalentar el aceite en sarten a fuego medio\nVerter la mezcla y cocinar 3 min por lado', tiempoMinutos: 10, favorito: true, fotoPath: '', notaFinal: '', timers: [], stepDone: [] },
    { id: 'r2', categoriaId: 'c2', nombre: 'Pollo al horno con papas', ingredientes: '1 pechuga de pollo\n3 papas medianas\nRomero fresco\nAceite de oliva\nSal y pimienta', pasos: 'Precalentar horno a 180C\nSazonar el pollo con sal, pimienta y romero\nPelar y cortar las papas en gajos\nColocar en bandeja, rociar aceite\nHornear 45 minutos hasta dorar', tiempoMinutos: 60, favorito: false, fotoPath: '', notaFinal: '', timers: [], stepDone: [] },
    { id: 'r3', categoriaId: 'c3', nombre: 'Flan casero', ingredientes: '1 litro de leche\n4 huevos\n1 taza de azucar\nEsencia de vainilla\nAzucar para el caramelo', pasos: 'Hacer caramelo con azucar en sarten y verter en molde\nMezclar leche, huevos, azucar y vainilla\nVerter en el molde con caramelo\nHornear a bano Maria a 160C por 50 minutos\nRefrigerar minimo 4 horas antes de desmoldar', tiempoMinutos: 90, favorito: true, fotoPath: '', notaFinal: '', timers: [], stepDone: [] }
  ],
  currentView: 'home',
  editingCategoryId: null,
  editingRecipeId: null,
  listFilter: { type: 'category', id: null },
  timerInterval: null,
  detailTimerInterval: null,
  timerSeconds: 0,
  timerRunning: false,
  timerEndAt: 0,
  modalCallback: null,
  currentRecipeId: null,
  currentPhotoBase64: '',
  deferredPrompt: null,
  cameFromDetail: false,
  previousViewBeforeDetail: null
};

// ── Helpers DOM ────────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const byId = id => document.getElementById(id);

// FIX: escapeHtml eficiente sin crear elementos DOM
const escapeHtml = value => {
  const str = String(value ?? '');
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (c === '&') out += '&amp;';
    else if (c === '<') out += '&lt;';
    else if (c === '>') out += '&gt;';
    else if (c === '"') out += '&quot;';
    else out += c;
  }
  return out;
};

const normalizeText = value =>
  String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const parseLines = value =>
  String(value ?? '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);

const currentRecipe = () => state.recipes.find(r => r.id === state.currentRecipeId) || null;
const recipeById = id => state.recipes.find(r => r.id === id) || null;
const categoryById = id => state.categories.find(c => c.id === id) || null;

// ── Debounce / Throttle ────────────────────
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ── Normalización de datos ─────────────────
function normalizeRecipe(recipe) {
  if (!recipe) return;
  if (!Array.isArray(recipe.stepDone)) recipe.stepDone = [];
  if (!Array.isArray(recipe.timers)) recipe.timers = [];
  if (typeof recipe.notaFinal !== 'string') recipe.notaFinal = '';
  recipe.timers = recipe.timers.map((t, index) => {
    const durationSeconds = Number.isFinite(t.durationSeconds)
      ? t.durationSeconds
      : ((parseInt(t.minutes || 0, 10) || 0) * 60 + (parseInt(t.seconds || 0, 10) || 0));
    return {
      id: t.id || `t${Date.now()}_${index}`,
      name: t.name || `Cronómetro ${index + 1}`,
      durationSeconds,
      remainingSeconds: Number.isFinite(t.remainingSeconds) ? t.remainingSeconds : durationSeconds,
      running: !!t.running,
      endAt: t.endAt || 0
    };
  }).filter(t => t.durationSeconds > 0);
}

function normalizeAllRecipes() {
  state.recipes.forEach(normalizeRecipe);
}

// ── Persistencia ───────────────────────────
function loadData() {
  try {
    const categories = localStorage.getItem(STORAGE_KEYS.categories);
    const recipes = localStorage.getItem(STORAGE_KEYS.recipes);
    if (categories) state.categories = JSON.parse(categories);
    if (recipes) state.recipes = JSON.parse(recipes);
    normalizeAllRecipes();
  } catch (e) {
    console.error('Error cargando datos', e);
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(state.recipes));
  } catch (e) {
    console.error(e);
    showToast('Error guardando. ¿Espacio lleno?');
  }
}

// Debounced save para timers (evita escritura cada segundo)
const saveDataDebounced = debounce(saveData, 3000);

// ── Navegación ─────────────────────────────
function setView(view) {
  $$('.view').forEach(v => v.classList.remove('active'));
  byId(`view-${view}`).classList.add('active');
  state.currentView = view;
  byId('app').scrollTop = 0;
  document.title = 'Mi Recetario';
}

function navigate(view) { setView(view); }
function showSettings() { setView('settings'); }

// ── PWA Install ────────────────────────────
function setupInstallBanner() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    state.deferredPrompt = e;
    byId('installBanner').classList.add('visible');
  });
  window.addEventListener('appinstalled', () => {
    byId('installBanner').classList.remove('visible');
    state.deferredPrompt = null;
  });
}

async function installApp() {
  if (!state.deferredPrompt) return;
  try {
    state.deferredPrompt.prompt();
    const { outcome } = await state.deferredPrompt.userChoice;
    if (outcome === 'accepted') byId('installBanner').classList.remove('visible');
    state.deferredPrompt = null;
  } catch (e) {
    console.error('Install prompt error', e);
  }
}

// ── Stats ──────────────────────────────────
function renderStats() {
  const totalRecipes = state.recipes.length;
  const totalFavs = state.recipes.filter(r => r.favorito).length;
  byId('statsBar').innerHTML = `
    <div class="stat"><b>${totalRecipes}</b> recetas</div>
    <div class="stat"><b>${totalFavs}</b> favoritas</div>
    <div class="stat"><b>${state.categories.length}</b> categorías</div>
  `;
}

// ── Categorías ─────────────────────────────
function renderCategories() {
  renderStats();

  let html = '';
  if (state.categories.length === 0) {
    html = `<div class="empty-state">
      <div class="big-icon">${ICONS.folderOpen}</div>
      <div>No hay categorías aún</div>
      <div style="font-size:13px;margin-top:8px">Crea la primera con el botón +</div>
    </div>`;
  } else {
    html = state.categories.map(category => {
      const count = state.recipes.filter(r => r.categoriaId === category.id).length;
      return `
        <div class="category-card" data-cat-id="${escapeHtml(category.id)}" onclick="App.showRecipeList('category','${escapeHtml(category.id)}')">
          <div class="icon-wrap">${ICONS.folder}</div>
          <div style="flex:1;min-width:0">
            <div class="name">${escapeHtml(category.nombre)}</div>
            <div class="count">${count} receta${count !== 1 ? 's' : ''}</div>
          </div>
          <div class="cat-actions">
            <button class="header-btn" onclick="event.stopPropagation(); App.showCategoryForm('${escapeHtml(category.id)}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  const uncategorized = state.recipes.filter(r => !state.categories.some(c => c.id === r.categoriaId));
  if (uncategorized.length > 0) {
    html += `
      <div class="category-card" onclick="App.showRecipeList('category','')" style="opacity:0.85">
        <div class="icon-wrap" style="color:var(--text-tert);background:var(--surface-hover)">${ICONS.folderOpen}</div>
        <div style="flex:1">
          <div class="name" style="color:var(--text-sec)">Sin categoría</div>
          <div class="count">${uncategorized.length} receta${uncategorized.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
    `;
  }

  byId('categoriesList').innerHTML = html;
}

// ── Búsqueda ───────────────────────────────
function handleSearch(query) {
  const trimmed = query.trim();
  const box = byId('searchBox');
  box.classList.toggle('has-text', Boolean(trimmed));

  if (!trimmed) {
    state.listFilter = { type: 'category', id: null };
    setView('home');
    renderCategories();
    return;
  }

  const needle = normalizeText(trimmed);
  const filtered = state.recipes.filter(recipe =>
    normalizeText(recipe.nombre).includes(needle) ||
    normalizeText(recipe.ingredientes).includes(needle) ||
    normalizeText(recipe.pasos).includes(needle) ||
    normalizeText(recipe.notaFinal).includes(needle)
  );

  state.listFilter = { type: 'search', query: trimmed };
  setView('recipe-list');
  byId('listTitle').textContent = 'Resultados';
  byId('listFab').style.display = 'none';
  renderRecipeList(filtered);
}

const debouncedHandleSearch = debounce(handleSearch, 200);

function clearSearch() {
  const input = byId('searchInput');
  input.value = '';
  input.focus();
  handleSearch('');
}

// ── Favoritos ──────────────────────────────
function showFavorites() {
  state.listFilter = { type: 'favorites' };
  setView('recipe-list');
  byId('listTitle').textContent = 'Favoritos';
  byId('listFab').style.display = 'none';
  renderRecipeList(state.recipes.filter(r => r.favorito));
}

// ── Formulario Categoría ───────────────────
function showCategoryForm(id = null) {
  state.editingCategoryId = id;
  byId('catFormTitle').textContent = id ? 'Editar categoría' : 'Nueva categoría';
  byId('catNameInput').value = id ? (categoryById(id)?.nombre || '') : '';
  byId('catDeleteBtn').style.display = id ? 'block' : 'none';
  setView('category-form');
  setTimeout(() => byId('catNameInput').focus(), 100);
}

function saveCategory() {
  const name = byId('catNameInput').value.trim();
  if (!name) { showToast('Ingresa un nombre'); return; }

  if (state.editingCategoryId) {
    const category = categoryById(state.editingCategoryId);
    if (category) category.nombre = name;
  } else {
    state.categories.push({ id: `c${Date.now()}`, nombre: name });
  }

  saveData();
  renderCategories();
  setView('home');
  showToast(state.editingCategoryId ? 'Categoría actualizada' : 'Categoría creada');
}

function confirmDeleteCategory() {
  const category = categoryById(state.editingCategoryId);
  if (!category) return;
  const hasRecipes = state.recipes.some(r => r.categoriaId === state.editingCategoryId);
  showModal(
    'Eliminar categoría',
    hasRecipes
      ? `Eliminar "${escapeHtml(category.nombre)}"? Las recetas quedarán sin categoría.`
      : `Eliminar "${escapeHtml(category.nombre)}"?`,
    () => {
      state.recipes.forEach(r => { if (r.categoriaId === state.editingCategoryId) r.categoriaId = ''; });
      state.categories = state.categories.filter(c => c.id !== state.editingCategoryId);
      saveData();
      renderCategories();
      setView('home');
      showToast('Categoría eliminada');
    }
  );
}

// ── Lista de Recetas ───────────────────────
function showRecipeList(type, id) {
  state.listFilter = { type, id };
  setView('recipe-list');
  const category = categoryById(id);
  byId('listTitle').textContent = type === 'category' ? (category ? category.nombre : 'Sin categoría') : 'Recetas';
  byId('listFab').style.display = type === 'category' ? 'flex' : 'none';

  const list = type === 'category'
    ? state.recipes.filter(r => r.categoriaId === id)
    : state.recipes.slice();
  renderRecipeList(list);
}

function renderRecipeList(list) {
  const container = byId('recipeListContainer');
  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="big-icon">${ICONS.utensils}</div>
      <div>No hay recetas</div>
      <div style="font-size:13px;margin-top:8px">Agrega la primera con el botón +</div>
    </div>`;
    return;
  }

  container.innerHTML = list.map(recipe => {
    const category = categoryById(recipe.categoriaId);
    const catName = category ? category.nombre : 'Sin categoría';
    const thumb = recipe.fotoPath
      ? `<img class="recipe-thumb" src="${recipe.fotoPath}" alt="" loading="lazy">`
      : `<div class="recipe-thumb-placeholder">${ICONS.chef}</div>`;

    return `
      <div class="recipe-row" data-recipe-id="${escapeHtml(recipe.id)}" onclick="App.showRecipeDetail('${escapeHtml(recipe.id)}')">
        ${thumb}
        <div class="info">
          <div class="title">${escapeHtml(recipe.nombre)}</div>
          <div class="meta">${escapeHtml(catName)} - ${recipe.tiempoMinutos || 0} min</div>
        </div>
        <button class="fav-btn ${recipe.favorito ? 'active' : ''}" onclick="event.stopPropagation(); App.toggleFavorite('${escapeHtml(recipe.id)}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${recipe.favorito ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>
        <div class="row-actions">
          <button class="header-btn" onclick="event.stopPropagation(); App.editRecipe('${escapeHtml(recipe.id)}')" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
          </button>
          <button class="header-btn" onclick="event.stopPropagation(); App.deleteRecipe('${escapeHtml(recipe.id)}')" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ── Formulario Receta ──────────────────────
function showRecipeForm(id = null) {
  state.editingRecipeId = id;
  state.currentPhotoBase64 = '';
  state.cameFromDetail = false;

  byId('recipeFormTitle').textContent = id ? 'Editar receta' : 'Nueva receta';
  const categorySelect = byId('recipeCategory');
  categorySelect.innerHTML = [
    ...state.categories.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nombre)}</option>`),
    '<option value="">Sin categoría</option>'
  ].join('');

  const preview = byId('photoPreview');
  preview.src = '';
  preview.classList.remove('visible');
  byId('photoBtnText').textContent = 'Elegir o sacar foto';

  if (id) {
    const recipe = recipeById(id);
    if (recipe) {
      byId('recipeName').value = recipe.nombre || '';
      byId('recipeCategory').value = recipe.categoriaId || '';
      byId('recipeIngredients').value = recipe.ingredientes || '';
      byId('recipeSteps').value = recipe.pasos || '';
      byId('recipeTime').value = recipe.tiempoMinutos || '';
      byId('recipeFinalNote').value = recipe.notaFinal || '';
      byId('recipeDeleteBtn').style.display = 'block';
      buildRecipeTimersEditor(recipe.timers || []);
      if (recipe.fotoPath) {
        preview.src = recipe.fotoPath;
        preview.classList.add('visible');
        state.currentPhotoBase64 = recipe.fotoPath;
        byId('photoBtnText').textContent = 'Cambiar foto';
      }
    }
  } else {
    byId('recipeName').value = '';
    byId('recipeCategory').value = state.listFilter.id || (state.categories[0]?.id || '');
    byId('recipeIngredients').value = '';
    byId('recipeSteps').value = '';
    byId('recipeTime').value = '';
    byId('recipeFinalNote').value = '';
    byId('recipeDeleteBtn').style.display = 'none';
    buildRecipeTimersEditor([]);
  }

  setView('recipe-form');
  setTimeout(() => byId('recipeName').focus(), 100);
}

function triggerPhotoInput() {
  byId('photoInput').click();
}

function buildRecipeTimersEditor(timers) {
  const box = byId('recipeTimersEditor');
  const list = Array.isArray(timers) && timers.length ? timers : [];
  box.innerHTML = list.map((timer, index) => `
    <div class="v4-timer-editor" data-index="${index}">
      <input class="v4-timer-name" type="text" maxlength="60" placeholder="Para qué es este cronómetro" value="${escapeHtml(timer.name || '')}">
      <div class="v4-time-row">
        <input class="v4-timer-min" type="number" min="0" max="9999" placeholder="Min" value="${Math.floor((timer.durationSeconds || 0) / 60)}">
        <input class="v4-timer-sec" type="number" min="0" max="59" placeholder="Seg" value="${(timer.durationSeconds || 0) % 60}">
        <button type="button" class="header-btn" onclick="App.removeTimerEditor(${index})" title="Eliminar">×</button>
      </div>
    </div>
  `).join('');
}

function readTimersFromEditor() {
  return $$('.v4-timer-editor').map((row, index) => {
    const name = $('.v4-timer-name', row)?.value.trim() || `Cronómetro ${index + 1}`;
    const min = Math.max(0, parseInt($('.v4-timer-min', row)?.value || '0', 10) || 0);
    const sec = Math.min(59, Math.max(0, parseInt($('.v4-timer-sec', row)?.value || '0', 10) || 0));
    const durationSeconds = min * 60 + sec;
    return {
      id: `t${Date.now()}_${index}`,
      name,
      durationSeconds,
      remainingSeconds: durationSeconds,
      running: false,
      endAt: 0
    };
  }).filter(t => t.durationSeconds > 0);
}

function addTimerEditor() {
  const current = readTimersFromEditor();
  current.push({ id: `t${Date.now()}`, name: '', durationSeconds: 60, remainingSeconds: 60, running: false, endAt: 0 });
  buildRecipeTimersEditor(current);
}

function removeTimerEditor(index) {
  const current = readTimersFromEditor();
  current.splice(index, 1);
  buildRecipeTimersEditor(current);
}

function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('La foto es muy grande. Máx: 5MB');
    input.value = '';
    return;
  }

  const btnText = byId('photoBtnText');
  const originalText = btnText.textContent;
  btnText.textContent = 'Comprimiendo...';

  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      state.currentPhotoBase64 = canvas.toDataURL('image/jpeg', 0.7);
      const preview = byId('photoPreview');
      preview.src = state.currentPhotoBase64;
      preview.classList.add('visible');
      btnText.textContent = 'Cambiar foto';
    };
    img.onerror = () => {
      btnText.textContent = originalText;
      showToast('Error al cargar la imagen');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function saveRecipe() {
  const nombre = byId('recipeName').value.trim();
  const categoriaId = byId('recipeCategory').value;
  const ingredientes = byId('recipeIngredients').value.trim();
  const pasos = byId('recipeSteps').value.trim();
  const tiempoVal = byId('recipeTime').value.trim();
  const tiempo = tiempoVal ? parseInt(tiempoVal, 10) : 0;
  const notaFinal = byId('recipeFinalNote').value.trim();
  const timers = readTimersFromEditor();

  if (!nombre) {
    showToast('La receta necesita un nombre');
    byId('recipeName').focus();
    return;
  }
  if (tiempoVal && (isNaN(tiempo) || tiempo < 0)) {
    showToast('El tiempo debe ser un número válido');
    byId('recipeTime').focus();
    return;
  }

  if (state.editingRecipeId) {
    const recipe = recipeById(state.editingRecipeId);
    if (recipe) {
      recipe.nombre = nombre;
      recipe.categoriaId = categoriaId;
      recipe.ingredientes = ingredientes;
      recipe.pasos = pasos;
      recipe.tiempoMinutos = tiempo;
      recipe.fotoPath = state.currentPhotoBase64 || recipe.fotoPath || '';
      recipe.notaFinal = notaFinal;
      recipe.timers = timers;
      normalizeRecipe(recipe);
      ensureStepState(recipe);
    }
  } else {
    state.recipes.push({
      id: `r${Date.now()}`,
      categoriaId,
      nombre,
      ingredientes,
      pasos,
      tiempoMinutos: tiempo,
      favorito: false,
      fotoPath: state.currentPhotoBase64,
      notaFinal,
      timers,
      stepDone: []
    });
  }

  saveData();
  showToast(state.editingRecipeId ? 'Receta actualizada' : 'Receta guardada');
  goBackFromRecipeForm();
}

function goBackFromRecipeForm() {
  if (state.cameFromDetail && state.editingRecipeId) {
    state.cameFromDetail = false;
    showRecipeDetail(state.editingRecipeId);
    return;
  }
  if (state.listFilter.type === 'category') showRecipeList('category', state.listFilter.id);
  else if (state.listFilter.type === 'favorites') showFavorites();
  else if (state.listFilter.type === 'search') handleSearch(byId('searchInput').value);
  else setView('home');
}

function editRecipe(id) {
  showRecipeForm(id);
}

function confirmDeleteRecipe() {
  if (state.editingRecipeId) deleteRecipe(state.editingRecipeId);
  else if (state.currentRecipeId) deleteRecipe(state.currentRecipeId);
}

function deleteRecipe(id) {
  const recipe = recipeById(id);
  if (!recipe) return;

  showModal('Eliminar receta', `Eliminar "${escapeHtml(recipe.nombre)}"? Esta acción no se puede deshacer.`, () => {
    state.recipes = state.recipes.filter(item => item.id !== id);
    saveData();
    if (state.currentView === 'recipe-detail') goBackFromDetail();
    else goBackFromRecipeForm();
    showToast('Receta eliminada');
  });
}

// ── Detalle de Receta ──────────────────────
function showRecipeDetail(id) {
  if (state.detailTimerInterval) {
    clearInterval(state.detailTimerInterval);
    state.detailTimerInterval = null;
  }

  state.previousViewBeforeDetail = { ...state.listFilter };
  state.currentRecipeId = id;
  const recipe = recipeById(id);
  if (!recipe) return;

  normalizeRecipe(recipe);
  byId('detailTitle').textContent = recipe.nombre;
  byId('detailPhotoWrap').innerHTML = recipe.fotoPath
    ? `<img class="detail-photo" src="${recipe.fotoPath}" alt="${escapeHtml(recipe.nombre)}" loading="lazy">`
    : `<div class="detail-photo-placeholder">${ICONS.chef}</div>`;

  byId('detailIngredients').innerHTML = parseLines(recipe.ingredientes).map(line => `<li>${escapeHtml(line)}</li>`).join('');
  renderStepChecklist(recipe);
  renderTimersDetail(recipe);

  byId('detailTime').textContent = `${recipe.tiempoMinutos || 0} minutos`;
  const favBtn = byId('detailFavBtn');
  favBtn.classList.toggle('active', recipe.favorito);
  favBtn.querySelector('span').textContent = recipe.favorito ? 'Quitar favorito' : 'Marcar favorito';

  const noteWrap = byId('detailNoteWrap');
  const note = byId('detailFinalNote');
  if (recipe.notaFinal.trim()) {
    note.textContent = recipe.notaFinal.trim();
    noteWrap.style.display = 'block';
  } else {
    noteWrap.style.display = 'none';
    note.textContent = '';
  }

  // FIX: Timer principal usa patrón endAt (timestamp-based)
  state.timerSeconds = (recipe.tiempoMinutos || 0) * 60;
  state.timerRunning = false;
  state.timerEndAt = 0;
  updateTimerDisplay();
  setView('recipe-detail');
}

function renderStepChecklist(recipe) {
  normalizeRecipe(recipe);
  ensureStepState(recipe);
  const steps = parseLines(recipe.pasos);
  const container = byId('detailSteps');

  container.innerHTML = steps.length
    ? steps.map((step, index) => `
        <li class="v4-step ${recipe.stepDone[index] ? 'done' : ''}" onclick="App.toggleStepDone(${index})">
          <input type="checkbox" ${recipe.stepDone[index] ? 'checked' : ''} onclick="event.stopPropagation(); App.toggleStepDone(${index})">
          <span>${escapeHtml(step)}</span>
        </li>
      `).join('')
    : '<li style="color:var(--text-tert)">No hay pasos añadidos.</li>';
}

function ensureStepState(recipe) {
  const steps = parseLines(recipe.pasos);
  if (!Array.isArray(recipe.stepDone)) recipe.stepDone = [];
  while (recipe.stepDone.length < steps.length) recipe.stepDone.push(false);
  if (recipe.stepDone.length > steps.length) recipe.stepDone.length = steps.length;
}

function toggleStepDone(index) {
  const recipe = currentRecipe();
  if (!recipe) return;
  ensureStepState(recipe);
  recipe.stepDone[index] = !recipe.stepDone[index];
  saveData();
  renderStepChecklist(recipe);
}

function formatTime(seconds) {
  const value = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

// ── Timers múltiples (ya robustos) ─────────
function renderTimersDetail(recipe) {
  const wrap = byId('detailTimersWrap');
  normalizeRecipe(recipe);
  if (!recipe.timers.length) {
    wrap.innerHTML = '';
    if (state.detailTimerInterval) {
      clearInterval(state.detailTimerInterval);
      state.detailTimerInterval = null;
    }
    return;
  }

  wrap.innerHTML = `
    <div class="detail-section">
      <h3>Cronómetros</h3>
      ${recipe.timers.map((timer, index) => `
        <div class="v4-timer-card">
          <h4>${escapeHtml(timer.name || 'Cronómetro')}</h4>
          <div class="v4-display" id="detailTimerDisplay_${index}">${formatTime(timer.remainingSeconds ?? timer.durationSeconds)}</div>
          <div class="v4-timer-actions">
            <button type="button" class="primary" onclick="App.startRecipeTimer(${index})">▶ Iniciar</button>
            <button type="button" onclick="App.pauseRecipeTimer(${index})">⏸ Pausar</button>
            <button type="button" onclick="App.resetRecipeTimer(${index})">↻ Reiniciar</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  if (state.detailTimerInterval) clearInterval(state.detailTimerInterval);
  state.detailTimerInterval = setInterval(updateTimersDetail, 1000);
  updateTimersDetail();
}

function updateTimersDetail() {
  const recipe = currentRecipe();
  if (!recipe || state.currentView !== 'recipe-detail') return;

  let changed = false;
  recipe.timers.forEach((timer, index) => {
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
        showToast(`Cronómetro terminado: ${timer.name || 'Listo'}`);
      }
    }
    const display = byId(`detailTimerDisplay_${index}`);
    if (display) display.textContent = formatTime(timer.remainingSeconds ?? timer.durationSeconds);
  });

  if (changed) saveDataDebounced();
}

function startRecipeTimer(index) {
  const recipe = currentRecipe();
  if (!recipe) return;
  normalizeRecipe(recipe);
  const timer = recipe.timers[index];
  if (!timer || timer.remainingSeconds <= 0) return;
  timer.running = true;
  timer.endAt = Date.now() + timer.remainingSeconds * 1000;
  if (state.detailTimerInterval == null) state.detailTimerInterval = setInterval(updateTimersDetail, 1000);
  saveDataDebounced();
  updateTimersDetail();
}

function pauseRecipeTimer(index) {
  const recipe = currentRecipe();
  if (!recipe) return;
  normalizeRecipe(recipe);
  const timer = recipe.timers[index];
  if (!timer) return;
  if (timer.running && timer.endAt) {
    timer.remainingSeconds = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
  }
  timer.running = false;
  timer.endAt = 0;
  saveDataDebounced();
  updateTimersDetail();
}

function resetRecipeTimer(index) {
  const recipe = currentRecipe();
  if (!recipe) return;
  normalizeRecipe(recipe);
  const timer = recipe.timers[index];
  if (!timer) return;
  timer.running = false;
  timer.endAt = 0;
  timer.remainingSeconds = timer.durationSeconds;
  saveDataDebounced();
  updateTimersDetail();
}

// ── Timer principal (FIX: patrón endAt) ────
function updateTimerDisplay() {
  const display = byId('timerDisplay');
  const minutes = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
  const seconds = String(state.timerSeconds % 60).padStart(2, '0');
  display.textContent = `${minutes}:${seconds}`;
  display.classList.remove('warning', 'finished');
  if (state.timerSeconds > 0 && state.timerSeconds <= 60) display.classList.add('warning');
  if (state.timerSeconds <= 0 && !state.timerRunning) display.classList.add('finished');
  document.title = state.timerRunning ? `(${minutes}:${seconds}) Mi Recetario` : 'Mi Recetario';
}

function startTimer() {
  if (state.timerRunning || state.timerSeconds <= 0) return;
  state.timerRunning = true;
  state.timerEndAt = Date.now() + state.timerSeconds * 1000;
  saveTimerState();
  state.timerInterval = setInterval(() => {
    const remaining = Math.max(0, Math.ceil((state.timerEndAt - Date.now()) / 1000));
    if (remaining !== state.timerSeconds) {
      state.timerSeconds = remaining;
      updateTimerDisplay();
    }
    if (remaining <= 0) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      state.timerEndAt = 0;
      localStorage.removeItem(STORAGE_KEYS.timer);
      finishTimer();
    }
  }, 250); // revisión cada 250ms para mayor precisión
}

function pauseTimer() {
  if (!state.timerRunning) return;
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerEndAt = 0;
  localStorage.removeItem(STORAGE_KEYS.timer);
  updateTimerDisplay();
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerEndAt = 0;
  localStorage.removeItem(STORAGE_KEYS.timer);
  const recipe = currentRecipe();
  state.timerSeconds = (recipe?.tiempoMinutos || 0) * 60;
  updateTimerDisplay();
}

function addTimerMin(min) {
  state.timerSeconds = Math.max(0, state.timerSeconds + min * 60);
  if (state.timerRunning) {
    state.timerEndAt = Date.now() + state.timerSeconds * 1000;
    saveTimerState();
  }
  updateTimerDisplay();
}

function finishTimer() {
  if (navigator.vibrate) navigator.vibrate([300, 150, 300, 150, 500]);
  showToast('¡Tiempo finalizado!');
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const playBeep = (freq, delay) => {
        setTimeout(() => {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        }, delay);
      };
      playBeep(880, 0);
      playBeep(1100, 350);
      playBeep(880, 700);
    }
  } catch (e) {}
}

// ── Persistencia del timer principal ───────
function saveTimerState() {
  if (state.timerRunning && state.currentRecipeId) {
    localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify({
      endAt: state.timerEndAt,
      recipeId: state.currentRecipeId
    }));
  } else {
    localStorage.removeItem(STORAGE_KEYS.timer);
  }
}

// FIX: restoreTimer ahora funciona al entrar al detalle
function restoreTimer() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.timer);
    if (!saved) return;
    const data = JSON.parse(saved);
    if (!data.recipeId || !data.endAt) return;
    // Solo restauramos si estamos en el detalle de la misma receta
    if (state.currentRecipeId !== data.recipeId) return;
    const remaining = Math.ceil((data.endAt - Date.now()) / 1000);
    if (remaining > 0) {
      state.timerSeconds = remaining;
      state.timerEndAt = data.endAt;
      state.timerRunning = true;
      updateTimerDisplay();
      startTimer(); // reanuda el intervalo
    } else {
      state.timerSeconds = 0;
      localStorage.removeItem(STORAGE_KEYS.timer);
      updateTimerDisplay();
    }
  } catch (e) {}
}

// ── Favoritos ──────────────────────────────
function toggleCurrentFavorite() {
  toggleFavorite(state.currentRecipeId);
  const recipe = currentRecipe();
  if (!recipe) return;
  const favBtn = byId('detailFavBtn');
  favBtn.classList.toggle('active', recipe.favorito);
  favBtn.querySelector('span').textContent = recipe.favorito ? 'Quitar favorito' : 'Marcar favorito';
  saveData();
}

function toggleFavorite(id) {
  const recipe = recipeById(id);
  if (!recipe) return;
  recipe.favorito = !recipe.favorito;
  saveData();

  if (state.currentView === 'recipe-list') {
    if (state.listFilter.type === 'favorites') renderRecipeList(state.recipes.filter(r => r.favorito));
    else if (state.listFilter.type === 'category') renderRecipeList(state.recipes.filter(r => r.categoriaId === state.listFilter.id));
    else if (state.listFilter.type === 'search') handleSearch(byId('searchInput').value);
  }
}

function editCurrentRecipe() {
  state.cameFromDetail = true;
  showRecipeForm(state.currentRecipeId);
}

// ── Compartir ──────────────────────────────
function shareCurrentRecipe() {
  const recipe = currentRecipe();
  if (!recipe) return;
  const text = `*${recipe.nombre}*\n\nIngredientes:\n${recipe.ingredientes}\n\nPasos:\n${recipe.pasos}\n\nTiempo: ${recipe.tiempoMinutos || 0} min${recipe.notaFinal ? `\n\nNota:\n${recipe.notaFinal}` : ''}`;
  if (navigator.share) {
    navigator.share({ title: recipe.nombre, text }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }
}

// ── Modal ──────────────────────────────────
function showModal(title, text, onConfirm) {
  byId('modalTitle').textContent = title;
  byId('modalText').textContent = text;
  state.modalCallback = onConfirm;
  byId('modalOverlay').classList.add('active');
}

function closeModal() {
  byId('modalOverlay').classList.remove('active');
  state.modalCallback = null;
}

function modalConfirm() {
  if (state.modalCallback) state.modalCallback();
  closeModal();
}

// ── Navegación hacia atrás ─────────────────
function goBackFromDetail() {
  if (state.detailTimerInterval) {
    clearInterval(state.detailTimerInterval);
    state.detailTimerInterval = null;
  }
  // FIX: si venimos de Home (id null), volvemos a Home
  if (state.previousViewBeforeDetail) {
    if (state.previousViewBeforeDetail.type === 'category' && state.previousViewBeforeDetail.id != null) {
      showRecipeList('category', state.previousViewBeforeDetail.id);
    } else if (state.previousViewBeforeDetail.type === 'favorites') {
      showFavorites();
    } else if (state.previousViewBeforeDetail.type === 'search') {
      handleSearch(byId('searchInput').value);
    } else {
      setView('home');
    }
    state.previousViewBeforeDetail = null;
  } else {
    setView('home');
  }
}

// ── Export / Import ──────────────────────────
function exportData() {
  const data = {
    version: 4,
    exportDate: new Date().toISOString(),
    categories: state.categories,
    recipes: state.recipes
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mi-recetario-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Backup descargado');
}

// FIX: validación básica de schema en importación
function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data.categories) || !Array.isArray(data.recipes)) {
        throw new Error('Formato inválido');
      }
      // Sanitizar IDs para prevenir XSS
      data.categories.forEach(c => {
        if (typeof c.id !== 'string') c.id = `c${Date.now()}`;
        if (typeof c.nombre !== 'string') c.nombre = 'Sin nombre';
      });
      data.recipes.forEach(r => {
        if (typeof r.id !== 'string') r.id = `r${Date.now()}`;
        if (typeof r.nombre !== 'string') r.nombre = 'Sin nombre';
      });

      showModal('Importar datos', 'Esto reemplazará TODOS tus datos actuales. ¿Continuar?', () => {
        state.categories = data.categories;
        state.recipes = data.recipes;
        normalizeAllRecipes();
        saveData();
        renderCategories();
        setView('home');
        showToast('Datos importados correctamente');
      });
    } catch (err) {
      showToast('Archivo inválido');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function confirmClearAll() {
  showModal('Borrar todo', 'Esto eliminará TODAS las recetas y categorías. No se puede deshacer.', () => {
    state.categories = [];
    state.recipes = [];
    saveData();
    renderCategories();
    setView('home');
    showToast('Todos los datos eliminados');
  });
}

// ── Toast ──────────────────────────────────
function showToast(msg) {
  const toast = byId('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ── Inicialización ─────────────────────────
function init() {
  loadData();
  setupInstallBanner();
  renderCategories();

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (byId('modalOverlay').classList.contains('active')) closeModal();
      else if (state.currentView !== 'home') setView('home');
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Si estamos en detalle y el timer corre, sincronizamos
      if (state.timerRunning) {
        const remaining = Math.max(0, Math.ceil((state.timerEndAt - Date.now()) / 1000));
        state.timerSeconds = remaining;
        updateTimerDisplay();
        if (remaining <= 0) {
          clearInterval(state.timerInterval);
          state.timerRunning = false;
          state.timerEndAt = 0;
          localStorage.removeItem(STORAGE_KEYS.timer);
          finishTimer();
        }
      }
    }
  });
}

// ── API pública (expuesta al window) ───────
const App = {
  addTimerEditor,
  addTimerMin,
  clearSearch,
  closeModal,
  confirmClearAll,
  confirmDeleteCategory,
  confirmDeleteRecipe,
  deleteRecipe,
  editCurrentRecipe,
  editRecipe,
  exportData,
  goBackFromDetail,
  goBackFromRecipeForm,
  handlePhoto,
  handleSearch: debouncedHandleSearch,
  importData,
  installApp,
  modalConfirm,
  navigate,
  pauseRecipeTimer,
  pauseTimer,
  removeTimerEditor,
  renderCategories,
  resetRecipeTimer,
  resetTimer,
  saveCategory,
  saveRecipe,
  shareCurrentRecipe,
  showCategoryForm,
  showFavorites,
  showModal,
  showRecipeDetail,
  showRecipeForm,
  showRecipeList,
  showSettings,
  showToast,
  startRecipeTimer,
  startTimer,
  toggleCurrentFavorite,
  toggleFavorite,
  toggleStepDone,
  triggerPhotoInput
};

window.App = App;

// Iniciar
document.addEventListener('DOMContentLoaded', init);
