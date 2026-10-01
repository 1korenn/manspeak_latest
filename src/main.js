/* ============================================================
   BOOT — wires every feature module together.
   ============================================================ */
import { bindContact, injectJsonLd, fillPrices, fillAboutPortrait } from './features/content.js';
import { stars } from './features/stars.js';
import { renderFilters, renderLookbook, applyFilter } from './features/lookbook.js';
import { buildRing, placeCards } from './features/ring.js';
import { initMiniBooker, renderMiniBooker } from './features/mini-booker.js';
import { updateOpenChip } from './features/status.js';
import { sizeHero, initHeroMotion, initHeroResize, loadClipper } from './features/hero.js';
import { initDialog } from './features/dialog.js';
import { initBookingForm } from './features/booking.js';
import { initBurger, initScrollFx } from './features/nav.js';
import { initRouter } from './features/router.js';
import { runEntrance } from './features/entrance.js';
import { initParallaxFallback } from './features/parallax.js';
import { refreshAvailability, onAvailabilityChange } from './lib/availability.js';

function boot(){
  bindContact();
  injectJsonLd();
  fillPrices();
  fillAboutPortrait();

  stars(document.getElementById('stA'), 150, 0, 0.05, 0.30);
  stars(document.getElementById('stB'), 18, 1.2, 0.35, 0.70);
  stars(document.getElementById('stC'), 90, 0, 0.05, 0.28);

  sizeHero();
  initHeroResize();
  buildRing();
  initMiniBooker();
  placeCards();

  renderFilters();
  renderLookbook();
  applyFilter();

  // availability drives the open chip, the mini-booker and the booking view
  onAvailabilityChange(()=>{ updateOpenChip(); renderMiniBooker(); });
  updateOpenChip();
  refreshAvailability();
  setInterval(updateOpenChip, 60*1000);

  initDialog();
  initBookingForm();
  initBurger();
  initScrollFx();
  initHeroMotion();
  initParallaxFallback();

  // decides the view, and with it whether the ring/clipper should run
  initRouter();

  requestAnimationFrame(()=> requestAnimationFrame(runEntrance));
  loadClipper();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
