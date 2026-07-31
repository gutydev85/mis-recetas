/* Mi Recetario - main.js v5.4-reorg */
'use strict';

async function init() {
  // Timeout de seguridad: si init() se bloquea, quitar splash igual
  const splashTimeout = setTimeout(function() {
    console.warn('init() timeout - forcing splash hide');
    hideSplash();
  }, 8000);

  cacheDOM();

  AudioEngine.loadSetting();

  await FileStorage.init();

  await Storage.load();

  Attempts.load();

  if (FileStorage.needsReauth) {

    Toast.show('Toque el toggle de carpeta para reactivar el acceso', Icons.warning);

  }

  PWA.setup();

  Render.categories();

  Settings.updateAboutStats();



  if (DOM.searchInput) {

    DOM.searchInput.addEventListener('input', function(e) { Search.debounced(e.target.value); });

  }



  document.addEventListener('keydown', function(e) {

    if (e.key === 'Escape') {

      if (DOM.modalOverlay && DOM.modalOverlay.classList.contains('active')) Modal.close();

      else if (State.currentView === 'cook-mode') CookMode.exit();

      else if (State.currentView === 'attempts') Nav.home();

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

        if (FileStorage.active) FileStorage.save();

        if (DOM.mainTimerBox) DOM.mainTimerBox.classList.remove('running');

        Timer.finishMain();

      }

    }

  });



  if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('sw.js').then(function(reg) {

      // Check for updates periodically (every 30 min)

      setInterval(function() { reg.update(); }, 30 * 60 * 1000);



      // Listen for new service worker waiting

      reg.addEventListener('updatefound', function() {

        const newWorker = reg.installing;

        if (!newWorker) return;

        newWorker.addEventListener('statechange', function() {

          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {

            // New version is waiting - show update banner

            showUpdateBanner();

          }

        });

      });



      // If the waiting SW is already there, show banner immediately

      if (reg.waiting) {

        showUpdateBanner();

      }

    });



    // Listen for messages from SW

    navigator.serviceWorker.addEventListener('message', function(e) {

      if (e.data && e.data.type === 'UPDATE_AVAILABLE') {

        showUpdateBanner();

      }

    });

  }



  function showUpdateBanner() {

    if (State.updateBannerShown) return;

    State.updateBannerShown = true;

    const banner = document.getElementById('updateBanner');

    if (banner) banner.classList.add('visible');

    document.body.classList.add('update-banner-visible');

  }



  function applyUpdate() {

    const banner = document.getElementById('updateBanner');

    if (banner) banner.classList.remove('visible');

    document.body.classList.remove('update-banner-visible');

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {

      navigator.serviceWorker.controller.postMessage('skipWaiting');

      // Wait for the new SW to activate, then reload

      navigator.serviceWorker.addEventListener('controllerchange', function() {

        window.location.reload();

      });

    } else {

      window.location.reload();

    }

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

    } else if (State.currentView === 'attempts') {

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

  // Listener del select de calificacion en intentos
  if (DOM.attemptRatingSelect) {
    DOM.attemptRatingSelect.addEventListener('change', function() {
      const val = parseInt(DOM.attemptRatingSelect.value, 10) || 0;
      App.attempts.setRating(val);
    });
  }

  // Listener del boton de actualizar app
  if (DOM.updateBtn) {
    DOM.updateBtn.addEventListener('click', function() {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage('skipWaiting');
        window.location.reload();
      }
    });
  }

  clearTimeout(splashTimeout);
}

window.App = {

  nav: Nav,

  render: Render,

  search: Search,

  favorites: Favorites,

  category: Category,

  recipe: Recipe,

  attempts: Attempts,

  photo: Photo,

  timer: Timer,

  cookMode: CookMode,

  data: DataIO,

  settings: Settings,

  toast: Toast,

  modal: Modal,

  audio: { toggle: function() { Settings.toggleSound(); } },

  install: function() { PWA.install(); }

}


document.addEventListener('DOMContentLoaded', init);
