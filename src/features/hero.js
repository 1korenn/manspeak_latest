/* ============================================================
   HERO — layout maths, the motion controller and the clipper loader.

   sizeHero()      writes CSS custom properties on #showcase: ring scale,
                   mock position, and where the glass clipper floats.
   setHomeActive() the router tells us whether the home view is showing.
   Motion (ring + clipper) runs only when: home view AND hero on screen
   AND tab visible. Everything stops otherwise, to save battery.
   ============================================================ */
import { startRing, stopRing } from './ring.js';

const state = { home: true, inView: true, pageVisible: !document.hidden };
let clipper = null;   // { start, stop, resize } once the 3D chunk has loaded

function sync(){
  const on = state.home && state.inView && state.pageVisible;
  if (on) startRing(); else stopRing();
  if (clipper){ if (on) clipper.start(); else clipper.stop(); }
}
export function setHomeActive(on){ state.home = on; sync(); }

export function initHeroMotion(){
  const hero = document.getElementById('hero');
  if (hero && 'IntersectionObserver' in window){
    new IntersectionObserver((entries)=>{
      entries.forEach(en=>{ state.inView = en.isIntersecting; });
      sync();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', ()=>{ state.pageVisible = !document.hidden; sync(); });
}

/* ---------------- layout ---------------- */
export function sizeHero(){
  const showcase = document.getElementById('showcase');
  const mock = document.querySelector('.mock');
  if (!showcase) return;
  const vw = window.innerWidth;
  const phone = vw <= 700;
  let k, ringY, mockTop, mv, mw, showMt;
  if (phone){
    k = Math.max(0.62, Math.min(vw/560, 0.8));
    ringY = -420*k;
    mockTop = 250*k;
    mv = 300;
    mw = vw - 24;
    showMt = -34*k;
  } else {
    k = Math.max(Math.min(vw/1172, 1.32), Math.min(vw/1560, 1.0));
    ringY = -330*k;
    mockTop = 222*k;
    mv = Math.max(230, 196*k);
    mw = Math.min(Math.max(842*k, 0.84*vw), vw - 32, 1180);
    showMt = -34*k;
  }
  const set = (n, v)=> showcase.style.setProperty(n, v);
  set('--k', k.toFixed(3));
  set('--ring-y', ringY.toFixed(1) + 'px');
  set('--mock-top', mockTop.toFixed(1) + 'px');
  set('--show-h', (mv + mockTop + 40) + 'px');
  set('--show-mt', showMt.toFixed(1) + 'px');
  set('--mock-w', mw.toFixed(0) + 'px');
  if (mock) mock.classList.toggle('narrow', mw < 760);

  /* The clipper floats over the ring.
     Wide screens: off to the right of the headline, its lower half over the
     ring's right-hand cards, just clear of the mock.
     Narrower: centred in the strip of ring between the buttons and the mock. */
  const W = showcase.clientWidth || vw;
  let s, left, top;
  if (vw > 1100){
    s = Math.min(W*0.24, 400);
    const h = s*1.2;
    const cx = Math.min(W*0.875, W - s/2 - 16);
    left = cx - s/2;
    top = 24 - h/2;
  } else {
    s = Math.max(120, Math.min(mockTop*0.95, 240));
    const h = s*1.2;
    left = (W - s)/2;
    top = mockTop*0.58 - h/2;
  }
  set('--clip-s', s.toFixed(1) + 'px');
  set('--clip-x', left.toFixed(1) + 'px');
  set('--clip-y', top.toFixed(1) + 'px');
  if (clipper) clipper.resize();
}

/* ---------------- the glass clipper (three.js, loaded lazily) ---------------- */
function webglAvailable(){
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch(e){ return false; }
}

export function loadClipper(){
  const stage = document.getElementById('clipperStage');
  const canvas = document.getElementById('clipper');
  if (!stage || !canvas) return;
  if (!webglAvailable()){ stage.hidden = true; return; }
  const go = ()=> import('./clipper/scene.js')
    .then(m=>{
      clipper = m.mountClipper(canvas, stage, document.getElementById('hero'));
      stage.classList.add('ready');
      sync();
    })
    .catch(err=>{ console.warn('MansPeak: 3D clipper unavailable.', err); stage.hidden = true; });
  // three.js is ~150 KB gzipped: fetch it after the page is interactive
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 });
  else setTimeout(go, 600);
}

let rTimer = 0;
export function initHeroResize(){
  const onResize = ()=>{ cancelAnimationFrame(rTimer); rTimer = requestAnimationFrame(sizeHero); };
  window.addEventListener('resize', onResize);
  if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
}
