/* Mi Recetario — app.js v5.0 */
'use strict';

// Service Worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

// Constants
const STORAGE_KEYS={categories:'mr_categories',recipes:'mr_recipes',timer:'mr_timer_v5',state:'mr_app_state_v5'};
const ICONS={folder:'📁',folderOpen:'📂',chef:'🍲',utensils:'🍴'};

// Global State
const state={
  categories:[{id:'c1',nombre:'Desayunos'},{id:'c2',nombre:'Comidas'},{id:'c3',nombre:'Postres'}],
  recipes:[
    {id:'r1',categoriaId:'c1',nombre:'Tortilla de huevo',ingredientes:'3 huevos\nSal\nPimienta\n1 cda aceite',pasos:'Batir los huevos con sal y pimienta\nCalentar el aceite en sartén a fuego medio\nVerter la mezcla y cocinar 3 min por lado',tiempoMinutos:10,favorito:true,fotoPath:'',notaFinal:'',timers:[],stepDone:[]},
    {id:'r2',categoriaId:'c2',nombre:'Pollo al horno con papas',ingredientes:'1 pechuga de pollo\n3 papas medianas\nRomero fresco\nAceite de oliva\nSal y pimienta',pasos:'Precalentar horno a 180°C\nSazonar el pollo con sal, pimienta y romero\nPelar y cortar las papas en gajos\nColocar en bandeja, rociar aceite\nHornear 45 minutos hasta dorar',tiempoMinutos:60,favorito:false,fotoPath:'',notaFinal:'',timers:[],stepDone:[]},
    {id:'r3',categoriaId:'c3',nombre:'Flan casero',ingredientes:'1 litro de leche\n4 huevos\n1 taza de azúcar\nEsencia de vainilla\nAzúcar para el caramelo',pasos:'Hacer caramelo con azúcar en sartén y verter en molde\nMezclar leche, huevos, azúcar y vainilla\nVerter en el molde con caramelo\nHornear a baño María a 160°C por 50 minutos\nRefrigerar mínimo 4 horas antes de desmoldar',tiempoMinutos:90,favorito:true,fotoPath:'',notaFinal:'',timers:[],stepDone:[]}
  ],
  currentView:'home',editingCategoryId:null,editingRecipeId:null,listFilter:{type:'category',id:null},
  timerInterval:null,detailTimerInterval:null,timerSeconds:0,timerRunning:false,timerEndAt:0,
  modalCallback:null,currentRecipeId:null,currentPhotoBase64:'',deferredPrompt:null,
  cameFromDetail:false,previousViewBeforeDetail:null
};

// Audio Engine
const AudioEngine=(()=>{
  let enabled=true;
  try{const p=localStorage.getItem('mr_sound');if(p!==null)enabled=p==='1';}catch(e){}
  const ctx=()=>{const C=window.AudioContext||window.webkitAudioContext;return C?new C():null;};
  function resume(c){if(c&&c.state==='suspended')c.resume().catch(()=>{});}
  function tone(freq,dur,type='sine',vol=.12,fade=true){
    if(!enabled)return;const c=ctx();if(!c)return;resume(c);
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);o.type=type;
    o.frequency.setValueAtTime(freq,c.currentTime);
    if(fade){g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);}
    else{g.gain.setValueAtTime(vol,c.currentTime);g.gain.setValueAtTime(.001,c.currentTime+dur);}
    o.start();o.stop(c.currentTime+dur);
  }
  function chord(freqs,dur,vol=.1){
    if(!enabled)return;const c=ctx();if(!c)return;resume(c);
    freqs.forEach(f=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(vol,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.start();o.stop(c.currentTime+dur);});
  }
  return{
    get enabled(){return enabled;},
    set enabled(v){enabled=!!v;try{localStorage.setItem('mr_sound',enabled?'1':'0');}catch(e){}},
    toggle(){this.enabled=!this.enabled;return this.enabled;},
    tap(){tone(800,.04,'sine',.06);},
    success(){chord([523,659],.25,.08);},
    delete(){tone(300,.18,'triangle',.08);},
    favOn(){chord([523,659,784],.2,.07);},
    favOff(){tone(440,.12,'sine',.06);},
    check(){tone(1200,.06,'sine',.05);},
    uncheck(){tone(600,.06,'sine',.04);},
    error(){tone(150,.25,'sawtooth',.04);},
    timerDone(){
      const c=ctx();if(!c||!enabled)return;resume(c);
      const notes=[{f:523,d:.35,v:.12,t:0},{f:659,d:.35,v:.10,t:.18},{f:784,d:.40,v:.10,t:.36},{f:1047,d:.60,v:.12,t:.54}];
      notes.forEach(n=>{setTimeout(()=>{const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.setValueAtTime(n.f,c.currentTime);g.gain.setValueAtTime(.001,c.currentTime);g.gain.linearRampToValueAtTime(n.v,c.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+n.d);o.start();o.stop(c.currentTime+n.d);},n.t*1000);});
    }
  };
})();

// DOM Helpers
const $=(sel,root=document)=>root.querySelector(sel);
const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
const byId=id=>document.getElementById(id);

const escapeHtml=value=>{
  const str=String(value??'');
  let out='';
  for(let i=0;i<str.length;i++){
    const c=str[i];
    if(c==='&')out+='&amp;';
    else if(c==='<')out+='&lt;';
    else if(c==='>')out+='&gt;';
    else if(c==='"')out+='&quot;';
    else out+=c;
  }
  return out;
};

const normalizeText=value=>String(value??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const parseLines=value=>String(value??'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
const currentRecipe=()=>state.recipes.find(r=>r.id===state.currentRecipeId)||null;
const recipeById=id=>state.recipes.find(r=>r.id===id)||null;
const categoryById=id=>state.categories.find(c=>c.id===id)||null;

function debounce(fn,ms){let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms);};}

// Data normalization
function normalizeRecipe(recipe){
  if(!recipe)return;
  if(!Array.isArray(recipe.stepDone))recipe.stepDone=[];
  if(!Array.isArray(recipe.timers))recipe.timers=[];
  if(typeof recipe.notaFinal!=='string')recipe.notaFinal='';
  recipe.timers=recipe.timers.map((t,index)=>{
    const durSec=Number.isFinite(t.durationSeconds)?t.durationSeconds:((parseInt(t.minutes||0,10)||0)*60+(parseInt(t.seconds||0,10)||0));
    return{
      id:t.id||`t${Date.now()}_${index}`,
      name:t.name||`Cronómetro ${index+1}`,
      durationSeconds:durSec,
      remainingSeconds:Number.isFinite(t.remainingSeconds)?t.remainingSeconds:durSec,
      running:!!t.running,
      endAt:t.endAt||0
    };
  }).filter(t=>t.durationSeconds>0);
}
function normalizeAllRecipes(){state.recipes.forEach(normalizeRecipe);}

// Persistence
function loadData(){
  try{
    const cats=localStorage.getItem(STORAGE_KEYS.categories);
    const recs=localStorage.getItem(STORAGE_KEYS.recipes);
    if(cats)state.categories=JSON.parse(cats);
    if(recs)state.recipes=JSON.parse(recs);
    normalizeAllRecipes();
  }catch(e){console.error('Error cargando datos',e);}
}
function saveData(){
  try{
    localStorage.setItem(STORAGE_KEYS.categories,JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.recipes,JSON.stringify(state.recipes));
  }catch(e){console.error(e);showToast('Error guardando. ¿Espacio lleno?','⚠️');}
}
const saveDataDebounced=debounce(saveData,3000);

// Navigation
function setView(view){
  $$('.view').forEach(v=>v.classList.remove('active'));
  byId(`view-${view}`).classList.add('active');
  state.currentView=view;
  byId('app').scrollTop=0;
  document.title='Mi Recetario';
}
function navigate(view){setView(view);}
function showSettings(){
  setView('settings');
  updateSoundToggle();
}
function updateSoundToggle(){
  const toggle=document.getElementById('soundToggle');
  const desc=document.getElementById('soundDesc');
  if(toggle){toggle.classList.toggle('active',AudioEngine.enabled);}
  if(desc){desc.textContent=AudioEngine.enabled?'Activados':'Silenciados';}
}
function toggleSound(){
  const on=AudioEngine.toggle();
  updateSoundToggle();
  showToast(on?'Sonidos activados':'Sonidos silenciados',on?'🔊':'🔇');
}

// PWA Install
function setupInstallBanner(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.deferredPrompt=e;byId('installBanner').classList.add('visible');});
  window.addEventListener('appinstalled',()=>{byId('installBanner').classList.remove('visible');state.deferredPrompt=null;});
}
async function installApp(){
  if(!state.deferredPrompt)return;
  try{state.deferredPrompt.prompt();const{outcome}=await state.deferredPrompt.userChoice;if(outcome==='accepted')byId('installBanner').classList.remove('visible');state.deferredPrompt=null;}catch(e){console.error('Install error',e);}
}

// Stats
function renderStats(){
  const total=state.recipes.length;
  const favs=state.recipes.filter(r=>r.favorito).length;
  byId('statsBar').innerHTML=`<span class="stat"><b>${total}</b> recetas</span><span class="stat"><b>${favs}</b> favoritas</span><span class="stat"><b>${state.categories.length}</b> categorías</span>`;
}

// Categories
function renderCategories(){
  renderStats();
  let html='';
  if(state.categories.length===0){
    html=`<div class="empty-state"><div class="big-icon">${ICONS.folderOpen}</div><h3>No hay categorías</h3><p>Crea la primera con el botón +</p></div>`;
  }else{
    html=state.categories.map(cat=>{
      const count=state.recipes.filter(r=>r.categoriaId===cat.id).length;
      return `<div class="category-card" onclick="App.showRecipeList('category','${cat.id}')"><div class="icon-wrap">${ICONS.folder}</div><div class="info"><div class="name">${escapeHtml(cat.nombre)}</div><div class="count">${count} receta${count!==1?'s':''}</div></div><div class="cat-actions"><button class="header-btn" onclick="event.stopPropagation();App.showCategoryForm('${cat.id}')" aria-label="Editar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button></div></div>`;
    }).join('');
  }
  const uncategorized=state.recipes.filter(r=>!state.categories.some(c=>c.id===r.categoriaId));
  if(uncategorized.length>0){
    html+=`<div class="category-card" onclick="App.showRecipeList('category','')"><div class="icon-wrap">${ICONS.folderOpen}</div><div class="info"><div class="name">Sin categoría</div><div class="count">${uncategorized.length} receta${uncategorized.length!==1?'s':''}</div></div></div>`;
  }
  byId('categoriesList').innerHTML=html;
}

// Search
function handleSearch(query){
  const trimmed=query.trim();
  const box=byId('searchBox');
  box.classList.toggle('has-text',Boolean(trimmed));
  if(!trimmed){state.listFilter={type:'category',id:null};setView('home');renderCategories();return;}
  const needle=normalizeText(trimmed);
  const filtered=state.recipes.filter(r=>normalizeText(r.nombre).includes(needle)||normalizeText(r.ingredientes).includes(needle)||normalizeText(r.pasos).includes(needle)||normalizeText(r.notaFinal).includes(needle));
  state.listFilter={type:'search',query:trimmed};
  setView('recipe-list');
  byId('listTitle').textContent='Resultados';
  byId('listFab').style.display='none';
  renderRecipeList(filtered);
}
const debouncedHandleSearch=debounce(handleSearch,200);
function clearSearch(){const input=byId('searchInput');input.value='';input.focus();handleSearch('');}

// Favorites
function showFavorites(){
  state.listFilter={type:'favorites'};
  setView('recipe-list');
  byId('listTitle').textContent='Favoritos';
  byId('listFab').style.display='none';
  renderRecipeList(state.recipes.filter(r=>r.favorito));
}

// Category Form
function showCategoryForm(id=null){
  state.editingCategoryId=id;
  byId('catFormTitle').textContent=id?'Editar categoría':'Nueva categoría';
  byId('catNameInput').value=id?(categoryById(id)?.nombre||''):'';
  byId('catDeleteBtn').style.display=id?'block':'none';
  setView('category-form');
  setTimeout(()=>byId('catNameInput').focus(),100);
}
function saveCategory(){
  const name=byId('catNameInput').value.trim();
  if(!name){showToast('Ingresa un nombre','⚠️');AudioEngine.error();return;}
  if(state.editingCategoryId){const cat=categoryById(state.editingCategoryId);if(cat)cat.nombre=name;}
  else{state.categories.push({id:`c${Date.now()}`,nombre:name});}
  saveData();renderCategories();setView('home');
  showToast(state.editingCategoryId?'Categoría actualizada':'Categoría creada','✅');
  AudioEngine.success();
}
function confirmDeleteCategory(){
  const cat=categoryById(state.editingCategoryId);if(!cat)return;
  const hasRecipes=state.recipes.some(r=>r.categoriaId===state.editingCategoryId);
  showModal('Eliminar categoría',hasRecipes?`Eliminar "${escapeHtml(cat.nombre)}"? Las recetas quedarán sin categoría.`:`Eliminar "${escapeHtml(cat.nombre)}"?`,()=>{
    state.recipes.forEach(r=>{if(r.categoriaId===state.editingCategoryId)r.categoriaId='';});
    state.categories=state.categories.filter(c=>c.id!==state.editingCategoryId);
    saveData();renderCategories();setView('home');showToast('Categoría eliminada','🗑️');
  });
}

// Recipe List
function showRecipeList(type,id){
  state.listFilter={type,id};
  setView('recipe-list');
  const cat=categoryById(id);
  byId('listTitle').textContent=type==='category'?(cat?cat.nombre:'Sin categoría'):'Recetas';
  byId('listFab').style.display=type==='category'?'flex':'none';
  const list=type==='category'?state.recipes.filter(r=>r.categoriaId===id):state.recipes.slice();
  renderRecipeList(list);
}
function renderRecipeList(list){
  const container=byId('recipeListContainer');
  if(list.length===0){
    container.innerHTML=`<div class="empty-state"><div class="big-icon">${ICONS.utensils}</div><h3>No hay recetas</h3><p>Agrega la primera con el botón +</p></div>`;
    return;
  }
  container.innerHTML=list.map(recipe=>{
    const cat=categoryById(recipe.categoriaId);
    const catName=cat?cat.nombre:'Sin categoría';
    const thumb=recipe.fotoPath?`<img src="${recipe.fotoPath}" class="recipe-thumb" alt="">`:`<div class="recipe-thumb-placeholder">${ICONS.chef}</div>`;
    return `<div class="recipe-row" onclick="App.showRecipeDetail('${recipe.id}')">${thumb}<div class="info"><div class="title">${escapeHtml(recipe.nombre)}</div><div class="meta">${catName} · ${recipe.tiempoMinutos||0} min</div></div><button class="fav-btn ${recipe.favorito?'active':''}" onclick="event.stopPropagation();App.toggleFavorite('${recipe.id}')" aria-label="Favorito"><svg width="16" height="16" viewBox="0 0 24 24" fill="${recipe.favorito?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button></div>`;
  }).join('');
}

// Recipe Form
function showRecipeForm(id=null){
  state.editingRecipeId=id;
  state.currentPhotoBase64='';
  state.cameFromDetail=false;
  byId('recipeFormTitle').textContent=id?'Editar receta':'Nueva receta';
  const catSelect=byId('recipeCategory');
  catSelect.innerHTML=[...state.categories.map(c=>`<option value="${c.id}">${escapeHtml(c.nombre)}</option>`),'<option value="">Sin categoría</option>'].join('');
  const preview=byId('photoPreview');
  preview.src='';preview.classList.remove('visible');
  byId('photoBtnText').textContent='Añadir foto';
  if(id){
    const recipe=recipeById(id);
    if(recipe){
      byId('recipeName').value=recipe.nombre||'';
      byId('recipeCategory').value=recipe.categoriaId||'';
      byId('recipeIngredients').value=recipe.ingredientes||'';
      byId('recipeSteps').value=recipe.pasos||'';
      byId('recipeTime').value=recipe.tiempoMinutos||'';
      byId('recipeFinalNote').value=recipe.notaFinal||'';
      byId('recipeDeleteBtn').style.display='block';
      buildRecipeTimersEditor(recipe.timers||[]);
      if(recipe.fotoPath){preview.src=recipe.fotoPath;preview.classList.add('visible');state.currentPhotoBase64=recipe.fotoPath;byId('photoBtnText').textContent='Cambiar foto';}
    }
  }else{
    byId('recipeName').value='';
    byId('recipeCategory').value=state.listFilter.id||(state.categories[0]?.id||'');
    byId('recipeIngredients').value='';
    byId('recipeSteps').value='';
    byId('recipeTime').value='';
    byId('recipeFinalNote').value='';
    byId('recipeDeleteBtn').style.display='none';
    buildRecipeTimersEditor([]);
  }
  setView('recipe-form');
  setTimeout(()=>byId('recipeName').focus(),100);
}
function triggerPhotoInput(){byId('photoInput').click();}
function buildRecipeTimersEditor(timers){
  const box=byId('recipeTimersEditor');
  const list=Array.isArray(timers)&&timers.length?timers:[];
  box.innerHTML=list.map((timer,index)=>`<div class="v4-timer-editor"><input type="text" class="v4-timer-name" placeholder="Nombre del cronómetro" value="${escapeHtml(timer.name||'')}"><div class="v4-time-row"><input type="number" class="v4-timer-min" placeholder="Min" min="0" value="${Math.floor((timer.durationSeconds||0)/60)}"><input type="number" class="v4-timer-sec" placeholder="Seg" min="0" max="59" value="${(timer.durationSeconds||0)%60}"><button type="button" class="header-btn" onclick="App.removeTimerEditor(${index})" aria-label="Eliminar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div></div>`).join('');
}
function readTimersFromEditor(){
  return $$('.v4-timer-editor').map((row,index)=>{
    const name=$('.v4-timer-name',row)?.value.trim()||`Cronómetro ${index+1}`;
    const min=Math.max(0,parseInt($('.v4-timer-min',row)?.value||'0',10)||0);
    const sec=Math.min(59,Math.max(0,parseInt($('.v4-timer-sec',row)?.value||'0',10)||0));
    const dur=min*60+sec;
    return{id:`t${Date.now()}_${index}`,name,durationSeconds:dur,remainingSeconds:dur,running:false,endAt:0};
  }).filter(t=>t.durationSeconds>0);
}
function addTimerEditor(){
  const current=readTimersFromEditor();
  current.push({id:`t${Date.now()}`,name:'',durationSeconds:60,remainingSeconds:60,running:false,endAt:0});
  buildRecipeTimersEditor(current);
}
function removeTimerEditor(index){
  const current=readTimersFromEditor();
  current.splice(index,1);
  buildRecipeTimersEditor(current);
}
function handlePhoto(input){
  const file=input.files[0];if(!file)return;
  if(file.size>5*1024*1024){showToast('La foto es muy grande. Máx: 5MB','⚠️');input.value='';return;}
  const btnText=byId('photoBtnText');
  const orig=btnText.textContent;
  btnText.textContent='Comprimiendo...';
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      const maxW=800;
      const scale=Math.min(1,maxW/img.width);
      canvas.width=Math.round(img.width*scale);
      canvas.height=Math.round(img.height*scale);
      const ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      state.currentPhotoBase64=canvas.toDataURL('image/jpeg',.7);
      const preview=byId('photoPreview');
      preview.src=state.currentPhotoBase64;
      preview.classList.add('visible');
      btnText.textContent='Cambiar foto';
    };
    img.onerror=()=>{btnText.textContent=orig;showToast('Error al cargar la imagen','❌');};
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
  input.value='';
}
function saveRecipe(){
  const nombre=byId('recipeName').value.trim();
  const categoriaId=byId('recipeCategory').value;
  const ingredientes=byId('recipeIngredients').value.trim();
  const pasos=byId('recipeSteps').value.trim();
  const tiempoVal=byId('recipeTime').value.trim();
  const tiempo=tiempoVal?parseInt(tiempoVal,10):0;
  const notaFinal=byId('recipeFinalNote').value.trim();
  const timers=readTimersFromEditor();
  if(!nombre){showToast('La receta necesita un nombre','⚠️');AudioEngine.error();byId('recipeName').focus();return;}
  if(tiempoVal&&(isNaN(tiempo)||tiempo<0)){showToast('El tiempo debe ser un número válido','⚠️');AudioEngine.error();byId('recipeTime').focus();return;}
  if(state.editingRecipeId){
    const recipe=recipeById(state.editingRecipeId);
    if(recipe){
      recipe.nombre=nombre;recipe.categoriaId=categoriaId;recipe.ingredientes=ingredientes;
      recipe.pasos=pasos;recipe.tiempoMinutos=tiempo;
      recipe.fotoPath=state.currentPhotoBase64||recipe.fotoPath||'';
      recipe.notaFinal=notaFinal;recipe.timers=timers;
      normalizeRecipe(recipe);ensureStepState(recipe);
    }
  }else{
    state.recipes.push({id:`r${Date.now()}`,categoriaId,nombre,ingredientes,pasos,tiempoMinutos:tiempo,favorito:false,fotoPath:state.currentPhotoBase64,notaFinal,timers,stepDone:[]});
  }
  saveData();
  showToast(state.editingRecipeId?'Receta actualizada':'Receta guardada','✅');
  AudioEngine.success();
  goBackFromRecipeForm();
}
function goBackFromRecipeForm(){
  if(state.cameFromDetail&&state.editingRecipeId){state.cameFromDetail=false;showRecipeDetail(state.editingRecipeId);return;}
  if(state.listFilter.type==='category')showRecipeList('category',state.listFilter.id);
  else if(state.listFilter.type==='favorites')showFavorites();
  else if(state.listFilter.type==='search')handleSearch(byId('searchInput').value);
  else setView('home');
}
function editRecipe(id){showRecipeForm(id);}
function confirmDeleteRecipe(){
  if(state.editingRecipeId)deleteRecipe(state.editingRecipeId);
  else if(state.currentRecipeId)deleteRecipe(state.currentRecipeId);
}
function deleteRecipe(id){
  const recipe=recipeById(id);if(!recipe)return;
  showModal('Eliminar receta',`Eliminar "${escapeHtml(recipe.nombre)}"? Esta acción no se puede deshacer.`,()=>{
    state.recipes=state.recipes.filter(r=>r.id!==id);saveData();
    if(state.currentView==='recipe-detail')goBackFromDetail();
    else goBackFromRecipeForm();
    showToast('Receta eliminada','🗑️');AudioEngine.delete();
  });
}

// Recipe Detail
function showRecipeDetail(id){
  if(state.detailTimerInterval){clearInterval(state.detailTimerInterval);state.detailTimerInterval=null;}
  state.previousViewBeforeDetail={...state.listFilter};
  state.currentRecipeId=id;
  const recipe=recipeById(id);if(!recipe)return;
  normalizeRecipe(recipe);
  byId('detailTitle').textContent=recipe.nombre;
  byId('detailPhotoWrap').innerHTML=recipe.fotoPath?`<img src="${recipe.fotoPath}" class="detail-photo" alt="">`:`<div class="detail-photo-placeholder">${ICONS.chef}</div>`;
  byId('detailIngredients').innerHTML=parseLines(recipe.ingredientes).map(line=>`<li>${escapeHtml(line)}</li>`).join('');
  renderStepChecklist(recipe);
  renderTimersDetail(recipe);
  byId('detailTime').textContent=`${recipe.tiempoMinutos||0} min`;
  const cat=categoryById(recipe.categoriaId);
  byId('detailCategory').textContent=cat?cat.nombre:'Sin categoría';
  const favBtn=byId('detailFavBtn');
  favBtn.classList.toggle('active',recipe.favorito);
  favBtn.querySelector('span').textContent=recipe.favorito?'Quitar favorito':'Marcar favorito';
  const noteWrap=byId('detailNoteWrap');
  const note=byId('detailFinalNote');
  if(recipe.notaFinal.trim()){note.textContent=recipe.notaFinal.trim();noteWrap.style.display='block';}
  else{noteWrap.style.display='none';note.textContent='';}
  state.timerSeconds=(recipe.tiempoMinutos||0)*60;
  state.timerRunning=false;state.timerEndAt=0;
  const tbox=document.querySelector('.timer-box');if(tbox)tbox.classList.remove('running');
  updateTimerDisplay();
  setView('recipe-detail');
}

function renderStepChecklist(recipe){
  normalizeRecipe(recipe);ensureStepState(recipe);
  const steps=parseLines(recipe.pasos);
  const container=byId('detailSteps');
  if(!steps.length){container.innerHTML='<p style="color:var(--text-tert);font-size:14px;">No hay pasos añadidos.</p>';return;}
  container.innerHTML=steps.map((step,index)=>`<div class="step-item ${recipe.stepDone[index]?'done':''}" onclick="App.toggleStepDone(${index})"><div class="step-check ${recipe.stepDone[index]?'checked':''}">${recipe.stepDone[index]?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>':''}</div><div class="step-text">${escapeHtml(step)}</div></div>`).join('');
}
function ensureStepState(recipe){
  const steps=parseLines(recipe.pasos);
  if(!Array.isArray(recipe.stepDone))recipe.stepDone=[];
  while(recipe.stepDone.length<steps.length)recipe.stepDone.push(false);
  if(recipe.stepDone.length>steps.length)recipe.stepDone.length=steps.length;
}
function toggleStepDone(index){
  const recipe=currentRecipe();if(!recipe)return;
  ensureStepState(recipe);
  recipe.stepDone[index]=!recipe.stepDone[index];
  saveData();renderStepChecklist(recipe);
  if(recipe.stepDone[index])AudioEngine.check();else AudioEngine.uncheck();
}
function formatTime(seconds){
  const v=Math.max(0,Math.floor(seconds));
  return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`;
}

// Main Timer
function updateTimerDisplay(){
  const display=byId('timerDisplay');
  const minutes=String(Math.floor(state.timerSeconds/60)).padStart(2,'0');
  const seconds=String(state.timerSeconds%60).padStart(2,'0');
  display.textContent=`${minutes}:${seconds}`;
  display.classList.remove('warning','finished');
  if(state.timerSeconds>0&&state.timerSeconds<=60)display.classList.add('warning');
  if(state.timerSeconds<=0&&!state.timerRunning)display.classList.add('finished');
  document.title=state.timerRunning?`(${minutes}:${seconds}) Mi Recetario`:'Mi Recetario';
}
function startTimer(){
  if(state.timerRunning||state.timerSeconds<=0)return;
  state.timerRunning=true;state.timerEndAt=Date.now()+state.timerSeconds*1000;
  const tbox=document.querySelector('.timer-box');if(tbox)tbox.classList.add('running');
  saveTimerState();
  state.timerInterval=setInterval(()=>{
    const remaining=Math.max(0,Math.ceil((state.timerEndAt-Date.now())/1000));
    if(remaining!==state.timerSeconds){state.timerSeconds=remaining;updateTimerDisplay();}
    if(remaining<=0){clearInterval(state.timerInterval);state.timerRunning=false;state.timerEndAt=0;localStorage.removeItem(STORAGE_KEYS.timer);finishTimer();}
  },250);
}
function pauseTimer(){
  if(!state.timerRunning)return;
  clearInterval(state.timerInterval);state.timerRunning=false;state.timerEndAt=0;
  localStorage.removeItem(STORAGE_KEYS.timer);
  const tbox=document.querySelector('.timer-box');if(tbox)tbox.classList.remove('running');
  updateTimerDisplay();
}
function resetTimer(){
  clearInterval(state.timerInterval);state.timerRunning=false;state.timerEndAt=0;
  localStorage.removeItem(STORAGE_KEYS.timer);
  const tbox=document.querySelector('.timer-box');if(tbox)tbox.classList.remove('running');
  const recipe=currentRecipe();state.timerSeconds=(recipe?.tiempoMinutos||0)*60;
  updateTimerDisplay();
}
function addTimerMin(min){
  state.timerSeconds=Math.max(0,state.timerSeconds+min*60);
  if(state.timerRunning){state.timerEndAt=Date.now()+state.timerSeconds*1000;saveTimerState();}
  updateTimerDisplay();
}
function finishTimer(){
  if(navigator.vibrate)navigator.vibrate([300,150,300,150,500]);
  showToast('¡Tiempo finalizado!','⏰');
  try{
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(AudioCtx){
      const playBeep=(freq,delay)=>{setTimeout(()=>{const ctx=new AudioCtx();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.type='sine';osc.frequency.setValueAtTime(freq,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(freq*.5,ctx.currentTime+.3);gain.gain.setValueAtTime(.3,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+.3);osc.start();osc.stop(ctx.currentTime+.3);},delay);};
      playBeep(880,0);playBeep(1100,350);playBeep(880,700);
    }
  }catch(e){}
}
function saveTimerState(){
  if(state.timerRunning&&state.currentRecipeId){
    localStorage.setItem(STORAGE_KEYS.timer,JSON.stringify({endAt:state.timerEndAt,recipeId:state.currentRecipeId}));
  }else{localStorage.removeItem(STORAGE_KEYS.timer);}
}
function restoreTimer(){
  try{
    const saved=localStorage.getItem(STORAGE_KEYS.timer);if(!saved)return;
    const data=JSON.parse(saved);if(!data.recipeId||!data.endAt)return;
    if(state.currentRecipeId!==data.recipeId)return;
    const remaining=Math.ceil((data.endAt-Date.now())/1000);
    if(remaining>0){state.timerSeconds=remaining;state.timerEndAt=data.endAt;state.timerRunning=true;updateTimerDisplay();startTimer();}
    else{state.timerSeconds=0;localStorage.removeItem(STORAGE_KEYS.timer);updateTimerDisplay();}
  }catch(e){}
}

// Multiple Timers Detail
function renderTimersDetail(recipe){
  const wrap=byId('detailTimersWrap');
  normalizeRecipe(recipe);
  if(!recipe.timers.length){
    wrap.innerHTML='';
    if(state.detailTimerInterval){clearInterval(state.detailTimerInterval);state.detailTimerInterval=null;}
    return;
  }
  wrap.innerHTML=`<div class="detail-section"><h3><span class="section-dot"></span>Cronómetros de la receta</h3><div class="v4-timers">${recipe.timers.map((timer,index)=>`<div class="v4-timer-card"><h4>${escapeHtml(timer.name||'Cronómetro')}</h4><div class="v4-display ${timer.remainingSeconds<=0&&!timer.running?'finished':(timer.remainingSeconds<=60&&timer.running?'warning':'')}" id="detailTimerDisplay_${index}">${formatTime(timer.remainingSeconds??timer.durationSeconds)}</div><div class="v4-timer-actions"><button class="${timer.running?'':'primary'}" onclick="App.${timer.running?'pause':'start'}RecipeTimer(${index})">${timer.running?'Pausar':'Iniciar'}</button><button onclick="App.resetRecipeTimer(${index})">Reiniciar</button></div></div>`).join('')}</div></div>`;
  if(state.detailTimerInterval)clearInterval(state.detailTimerInterval);
  state.detailTimerInterval=setInterval(updateTimersDetail,1000);
  updateTimersDetail();
}
function updateTimersDetail(){
  const recipe=currentRecipe();if(!recipe||state.currentView!=='recipe-detail')return;
  let changed=false;
  recipe.timers.forEach((timer,index)=>{
    if(timer.running&&timer.endAt){
      const remaining=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));
      if(remaining!==timer.remainingSeconds){timer.remainingSeconds=remaining;changed=true;}
      if(remaining<=0){timer.running=false;timer.endAt=0;changed=true;if(navigator.vibrate)navigator.vibrate([300,150,300]);showToast(`Cronómetro terminado: ${timer.name||'Listo'}`,'⏰');}
    }
    const display=byId(`detailTimerDisplay_${index}`);
    if(display){
      display.textContent=formatTime(timer.remainingSeconds??timer.durationSeconds);
      display.classList.toggle('warning',timer.running&&timer.remainingSeconds>0&&timer.remainingSeconds<=60);
      display.classList.toggle('finished',timer.remainingSeconds<=0&&!timer.running);
    }
  });
  if(changed)saveDataDebounced();
}
function startRecipeTimer(index){
  const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);
  const timer=recipe.timers[index];if(!timer||timer.remainingSeconds<=0)return;
  timer.running=true;timer.endAt=Date.now()+timer.remainingSeconds*1000;
  if(state.detailTimerInterval==null)state.detailTimerInterval=setInterval(updateTimersDetail,1000);
  saveDataDebounced();updateTimersDetail();
}
function pauseRecipeTimer(index){
  const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);
  const timer=recipe.timers[index];if(!timer)return;
  if(timer.running&&timer.endAt){timer.remainingSeconds=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));}
  timer.running=false;timer.endAt=0;saveDataDebounced();updateTimersDetail();
}
function resetRecipeTimer(index){
  const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);
  const timer=recipe.timers[index];if(!timer)return;
  timer.running=false;timer.endAt=0;timer.remainingSeconds=timer.durationSeconds;saveDataDebounced();updateTimersDetail();
}

// Favorites
function toggleCurrentFavorite(){
  toggleFavorite(state.currentRecipeId);
  const recipe=currentRecipe();if(!recipe)return;
  const favBtn=byId('detailFavBtn');
  favBtn.classList.toggle('active',recipe.favorito);
  favBtn.querySelector('span').textContent=recipe.favorito?'Quitar favorito':'Marcar favorito';
  saveData();
}
function toggleFavorite(id){
  const recipe=recipeById(id);if(!recipe)return;
  recipe.favorito=!recipe.favorito;saveData();
  if(recipe.favorito)AudioEngine.favOn();else AudioEngine.favOff();
  if(state.currentView==='recipe-list'){
    if(state.listFilter.type==='favorites')renderRecipeList(state.recipes.filter(r=>r.favorito));
    else if(state.listFilter.type==='category')renderRecipeList(state.recipes.filter(r=>r.categoriaId===state.listFilter.id));
    else if(state.listFilter.type==='search')handleSearch(byId('searchInput').value);
  }
}
function editCurrentRecipe(){state.cameFromDetail=true;showRecipeForm(state.currentRecipeId);}

// Share
function shareCurrentRecipe(){
  const recipe=currentRecipe();if(!recipe)return;
  const text=`*${recipe.nombre}*\n\nIngredientes:\n${recipe.ingredientes}\n\nPasos:\n${recipe.pasos}\n\nTiempo: ${recipe.tiempoMinutos||0} min${recipe.notaFinal?`\n\nNota:\n${recipe.notaFinal}`:''}`;
  if(navigator.share){navigator.share({title:recipe.nombre,text}).catch(()=>{});}
  else{window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');}
}

// Modal
function showModal(title,text,onConfirm){
  byId('modalTitle').textContent=title;
  byId('modalText').textContent=text;
  state.modalCallback=onConfirm;
  byId('modalOverlay').classList.add('active');
}
function closeModal(){byId('modalOverlay').classList.remove('active');state.modalCallback=null;}
function modalConfirm(){if(state.modalCallback)state.modalCallback();closeModal();}

// Back navigation
function goBackFromDetail(){
  if(state.detailTimerInterval){clearInterval(state.detailTimerInterval);state.detailTimerInterval=null;}
  if(state.previousViewBeforeDetail){
    if(state.previousViewBeforeDetail.type==='category'&&state.previousViewBeforeDetail.id!=null)showRecipeList('category',state.previousViewBeforeDetail.id);
    else if(state.previousViewBeforeDetail.type==='favorites')showFavorites();
    else if(state.previousViewBeforeDetail.type==='search')handleSearch(byId('searchInput').value);
    else setView('home');
    state.previousViewBeforeDetail=null;
  }else{setView('home');}
}

// Export / Import
function exportData(){
  const data={version:5,exportDate:new Date().toISOString(),categories:state.categories,recipes:state.recipes};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`mi-recetario-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  showToast('Backup descargado','💾');
}
function importData(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!Array.isArray(data.categories)||!Array.isArray(data.recipes))throw new Error('Formato inválido');
      data.categories.forEach(c=>{if(typeof c.id!=='string')c.id=`c${Date.now()}`;if(typeof c.nombre!=='string')c.nombre='Sin nombre';});
      data.recipes.forEach(r=>{if(typeof r.id!=='string')r.id=`r${Date.now()}`;if(typeof r.nombre!=='string')r.nombre='Sin nombre';});
      showModal('Importar datos','Esto reemplazará TODOS tus datos actuales. ¿Continuar?',()=>{
        state.categories=data.categories;state.recipes=data.recipes;
        normalizeAllRecipes();saveData();renderCategories();setView('home');
        showToast('Datos importados correctamente','✅');
      });
    }catch(err){showToast('Archivo inválido','❌');}
  };
  reader.readAsText(file);input.value='';
}
function confirmClearAll(){
  showModal('Borrar todo','Esto eliminará TODAS las recetas y categorías. No se puede deshacer.',()=>{
    state.categories=[];state.recipes=[];saveData();renderCategories();setView('home');showToast('Todos los datos eliminados','🗑️');
  });
}

// Toast
function showToast(msg,icon=''){
  const toast=byId('toast');
  byId('toastIcon').textContent=icon;
  byId('toastText').textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2800);
}

// Splash Screen
function hideSplash(){
  const splash=byId('splash');
  if(splash){splash.classList.add('hidden');setTimeout(()=>splash.remove(),700);}
}

// Init
function init(){
  loadData();setupInstallBanner();renderCategories();
  // Hide splash after animation
  setTimeout(hideSplash,1800);

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(byId('modalOverlay').classList.contains('active'))closeModal();
      else if(state.currentView!=='home')setView('home');
    }
  });

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden){
      if(state.timerRunning){
        const remaining=Math.max(0,Math.ceil((state.timerEndAt-Date.now())/1000));
        state.timerSeconds=remaining;updateTimerDisplay();
        if(remaining<=0){clearInterval(state.timerInterval);state.timerRunning=false;state.timerEndAt=0;localStorage.removeItem(STORAGE_KEYS.timer);const tbox2=document.querySelector('.timer-box');if(tbox2)tbox2.classList.remove('running');finishTimer();}
      }
    }
  });
}

// Cook Mode
const CookMode=(()=>{
  let wakeLock=null,currentStep=0,steps=[],quickTimerInterval=null,quickTimerSeconds=0,quickTimerRunning=false,cookTimerInterval=null;
  async function requestWakeLock(){try{if('wakeLock' in navigator){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener('release',()=>{wakeLock=null;});}}catch(e){}}
  function releaseWakeLock(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null;}}
  function speak(text){if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='es-ES';u.rate=.92;u.pitch=1.05;window.speechSynthesis.speak(u);const btn=document.getElementById('cookTtsBtn');if(btn){btn.classList.add('speaking');u.onend=()=>btn.classList.remove('speaking');u.onerror=()=>btn.classList.remove('speaking');}}}
  function extractMinutes(text){const m=text.match(/(\d+)\s*(min|minuto|minutos)/i);if(m)return parseInt(m[1]);const h=text.match(/(\d+)\s*(hora|horas)/i);if(h)return parseInt(h[1])*60;return null;}
  function updateProgress(){const pct=steps.length?((currentStep+1)/steps.length)*100:0;const bar=byId('cookProgressBar');if(bar)bar.style.width=`${pct}%`;const dots=byId('cookDots');if(dots){dots.innerHTML=steps.map((_,i)=>`<span class="${i===currentStep?'active':''}"></span>`).join('');}const navDots=byId('cookNavDots');if(navDots){navDots.innerHTML=steps.map((_,i)=>`<span class="${i===currentStep?'active':''}"></span>`).join('');}const prev=byId('cookPrevBtn');const next=byId('cookNextBtn');if(prev)prev.disabled=currentStep===0;if(next){next.innerHTML=currentStep>=steps.length-1?`Terminar <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`:`Siguiente <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>`;}}
  function renderStep(){const content=byId('cookContent');if(!content)return;if(currentStep>=steps.length){content.innerHTML=`<div class="cook-done"><div class="big-icon">🍲</div><h2>¡Listo!</h2><p>Todos los pasos completados. Buen provecho.</p><button class="btn-primary" onclick="App.exitCookMode()">Volver al recetario</button></div>`;AudioEngine.success();if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);return;}const stepText=steps[currentStep];const minutes=extractMinutes(stepText);let quickTimerHtml='';if(minutes&&minutes>0){quickTimerHtml=`<button class="cook-quick-timer" onclick="App.startQuickTimer(${minutes})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Iniciar ${minutes} min</button>`;}const hasTTS='speechSynthesis' in window;content.innerHTML=`<div class="cook-step-num">Paso ${currentStep+1} de ${steps.length}</div>${hasTTS?'<button class="cook-tts-btn" id="cookTtsBtn" onclick="App.speakCookStep()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>':''}<div class="cook-step-text">${escapeHtml(stepText)}</div>${quickTimerHtml}<div class="cook-quick-display" id="cookQuickDisplay" style="display:none"></div>`;updateProgress();}
  function nextStep(){if(currentStep<steps.length){currentStep++;AudioEngine.tap();if(navigator.vibrate)navigator.vibrate(20);renderStep();}}
  function prevStep(){if(currentStep>0){currentStep--;AudioEngine.tap();if(navigator.vibrate)navigator.vibrate(20);renderStep();}}
  function renderCookTimers(){const recipe=currentRecipe();const list=byId('cookTimersList');if(!list||!recipe)return;normalizeRecipe(recipe);if(!recipe.timers.length){list.innerHTML='<p style="color:var(--text-tert);font-size:13px;text-align:center;padding:8px;">No hay cronómetros en esta receta</p>';return;}list.innerHTML=recipe.timers.map((timer,index)=>{const cls=timer.remainingSeconds<=0&&!timer.running?'finished':(timer.remainingSeconds<=60&&timer.running?'warning':'');return `<div class="cook-timer-row"><span class="ct-name">${escapeHtml(timer.name||'Timer')}</span><span class="ct-time ${cls}" id="cookTimerDisplay_${index}">${formatTime(timer.remainingSeconds??timer.durationSeconds)}</span><div class="ct-actions"><button class="${timer.running?'':'primary'}" onclick="App.${timer.running?'pauseCook':'startCook'}RecipeTimer(${index})">${timer.running?'⏸':'▶'}</button><button onclick="App.resetCookRecipeTimer(${index})">↺</button></div></div>`;}).join('');}
  function updateCookTimers(){const recipe=currentRecipe();if(!recipe)return;let changed=false;recipe.timers.forEach((timer,index)=>{if(timer.running&&timer.endAt){const remaining=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));if(remaining!==timer.remainingSeconds){timer.remainingSeconds=remaining;changed=true;}if(remaining<=0){timer.running=false;timer.endAt=0;changed=true;if(navigator.vibrate)navigator.vibrate([300,150,300]);AudioEngine.timerDone();showToast(`Cronómetro terminado: ${timer.name||'Listo'}`,'⏰');}}const display=byId(`cookTimerDisplay_${index}`);if(display){display.textContent=formatTime(timer.remainingSeconds??timer.durationSeconds);display.classList.toggle('warning',timer.running&&timer.remainingSeconds>0&&timer.remainingSeconds<=60);display.classList.toggle('finished',timer.remainingSeconds<=0&&!timer.running);}});if(changed)saveDataDebounced();}
  function startQuickTimer(minutes){if(quickTimerRunning)return;quickTimerSeconds=minutes*60;quickTimerRunning=true;const display=byId('cookQuickDisplay');if(display)display.style.display='block';updateQuickDisplay();quickTimerInterval=setInterval(()=>{quickTimerSeconds--;updateQuickDisplay();if(quickTimerSeconds<=0){clearInterval(quickTimerInterval);quickTimerRunning=false;if(navigator.vibrate)navigator.vibrate([300,150,300,150,500]);AudioEngine.timerDone();showToast('¡Tiempo del paso terminado!','⏰');}},1000);}
  function updateQuickDisplay(){const display=byId('cookQuickDisplay');if(display)display.textContent=formatTime(quickTimerSeconds);}
  function showIngredients(){const recipe=currentRecipe();if(!recipe)return;const list=byId('cookIngredientsList');const lines=parseLines(recipe.ingredientes);if(list)list.innerHTML=lines.length?lines.map(l=>`<li>${escapeHtml(l)}</li>`).join(''):'<li>Sin ingredientes</li>';byId('cookIngredientsOverlay').classList.add('active');}
  function closeIngredients(e){if(!e||e.target===e.currentTarget)byId('cookIngredientsOverlay').classList.remove('active');}
  function setupSwipe(){const body=byId('cookBody');if(!body)return;let startX=0;body.addEventListener('touchstart',e=>{startX=e.touches[0].clientX;},{passive:true});body.addEventListener('touchend',e=>{const diff=startX-e.changedTouches[0].clientX;if(Math.abs(diff)>60){if(diff>0)nextStep();else prevStep();}},{passive:true});}
  return{enter(){const recipe=currentRecipe();if(!recipe)return;steps=parseLines(recipe.pasos);currentStep=0;quickTimerSeconds=0;quickTimerRunning=false;if(quickTimerInterval)clearInterval(quickTimerInterval);byId('cookTitle').textContent=recipe.nombre;setView('cook-mode');requestWakeLock();renderStep();renderCookTimers();setupSwipe();if(cookTimerInterval)clearInterval(cookTimerInterval);cookTimerInterval=setInterval(updateCookTimers,1000);updateCookTimers();ensureStepState(recipe);},exit(){releaseWakeLock();if(quickTimerInterval)clearInterval(quickTimerInterval);if(cookTimerInterval)clearInterval(cookTimerInterval);if(window.speechSynthesis)window.speechSynthesis.cancel();goBackFromDetail();},nextStep,prevStep,speak(){if(currentStep<steps.length)speak(steps[currentStep]);},startQuickTimer,showIngredients,closeIngredients,renderTimers:renderCookTimers,updateTimers:updateCookTimers,toggleTimersPanel(){byId('cookTimersPanel').classList.toggle('collapsed');},startRecipeTimer(index){const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);const timer=recipe.timers[index];if(!timer||timer.remainingSeconds<=0)return;timer.running=true;timer.endAt=Date.now()+timer.remainingSeconds*1000;if(cookTimerInterval==null)cookTimerInterval=setInterval(updateCookTimers,1000);saveDataDebounced();updateCookTimers();},pauseRecipeTimer(index){const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);const timer=recipe.timers[index];if(!timer)return;if(timer.running&&timer.endAt){timer.remainingSeconds=Math.max(0,Math.ceil((timer.endAt-Date.now())/1000));}timer.running=false;timer.endAt=0;saveDataDebounced();updateCookTimers();},resetRecipeTimer(index){const recipe=currentRecipe();if(!recipe)return;normalizeRecipe(recipe);const timer=recipe.timers[index];if(!timer)return;timer.running=false;timer.endAt=0;timer.remainingSeconds=timer.durationSeconds;saveDataDebounced();updateCookTimers();}};
})();

// Public API
const App={addTimerEditor,addTimerMin,clearSearch,closeModal,confirmClearAll,confirmDeleteCategory,confirmDeleteRecipe,deleteRecipe,editCurrentRecipe,editRecipe,exportData,goBackFromDetail,goBackFromRecipeForm,handlePhoto,handleSearch:debouncedHandleSearch,importData,installApp,modalConfirm,navigate,pauseRecipeTimer,pauseTimer,removeTimerEditor,renderCategories,resetRecipeTimer,resetTimer,saveCategory,saveRecipe,shareCurrentRecipe,showCategoryForm,showFavorites,showModal,showRecipeDetail,showRecipeForm,showRecipeList,showSettings,showToast,enterCookMode:()=>CookMode.enter(),exitCookMode:()=>CookMode.exit(),nextCookStep:()=>CookMode.nextStep(),prevCookStep:()=>CookMode.prevStep(),speakCookStep:()=>CookMode.speak(),startQuickTimer:(m)=>CookMode.startQuickTimer(m),showCookIngredients:()=>CookMode.showIngredients(),closeCookIngredients:(e)=>{if(!e||e.target===e.currentTarget)CookMode.closeIngredients();},toggleCookTimers:()=>CookMode.toggleTimersPanel(),startCookRecipeTimer:(i)=>CookMode.startRecipeTimer(i),pauseCookRecipeTimer:(i)=>CookMode.pauseRecipeTimer(i),resetCookRecipeTimer:(i)=>CookMode.resetRecipeTimer(i),toggleSound,updateSoundToggle,startRecipeTimer,startTimer,toggleCurrentFavorite,toggleFavorite,toggleStepDone,triggerPhotoInput};
window.App=App;
document.addEventListener('DOMContentLoaded',init);
