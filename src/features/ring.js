/* ============================================================
   THE RING — 37 cards on a cylinder, the creatives below cycled.
   Card creatives map to portraits from CUTS, so the ring showcases
   the actual haircuts we sell. Driven by its own rAF loop, which
   hero.js starts and stops with the hero's visibility.
   ============================================================ */
import { peso } from '../config.js';
import { CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';

export const SHOTS = [
  { v:'label',   text:'ANY CUT<br>ONE PRICE',    cut:0 },
  { v:'poster',  cut:1 },
  { v:'promo',   cut:0 },                          // flat-price barber-pole card
  { v:'serif',   text:'Fresh<br>Fridays',         cut:2 },
  { v:'label',   text:'K-STYLE<br>WEEK',           cut:2 },
  { v:'poster',  cut:3 },
  { v:'book',    cut:4 },                          // "Book in 30 seconds"
  { v:'serif',   text:'Photo<br>day fit',          cut:7 },
  { v:'label',   text:'SKIP<br>THE LINE',          cut:5 },
  { v:'poster',  cut:6 }
];
function creative(d){
  const c = CUTS[d.cut % CUTS.length];
  // data: URIs, so no lazy-loading (it left blanks on cards hidden in 3D)
  const img = '<img alt="" src="' + portrait(c,'tall') + '">';
  if (d.v === 'label'){
    return '<div class="cv-ph">' + img + '<span class="cv-scrim"></span></div>' +
           '<div class="cv-label"><b class="dot"></b><span>' + d.text + '</span></div>';
  }
  if (d.v === 'poster'){
    return '<div class="cv-ph">' + img + '</div>' +
           '<div class="cv-poster"><span class="cv-poster-t">' + c.name + '</span><span class="cv-poster-p">' + peso() + '</span></div>';
  }
  if (d.v === 'promo'){
    return '<div class="cv-promo">' +
             '<div class="cv-pole"></div>' +
             '<div class="cv-promo-inner">' +
               '<span class="cv-promo-kick">ANY CUT</span>' +
               '<span class="cv-promo-price">' + peso() + '</span>' +
               '<span class="cv-promo-sub">one price, no add-ons</span>' +
             '</div>' +
           '</div>';
  }
  if (d.v === 'serif'){
    return '<div class="cv-ph">' + img + '<span class="cv-scrim"></span></div>' +
           '<div class="cv-serif">' + d.text + '</div>';
  }
  if (d.v === 'book'){
    return '<div class="cv-book">' +
             '<span class="cv-book-kick">BOOK IN</span>' +
             '<span class="cv-book-big">30 sec</span>' +
             '<div class="cv-book-chips"><span>4:30</span><span>5:00</span><span>5:30</span></div>' +
           '</div>';
  }
  return '<div class="cv-ph">' + img + '</div>';
}

const RING = { R:891, N:37, step:360/37, cull:42, speed:1.9, phase:-2, last:0, rafId:0, running:false, cards:[] };
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function buildRing(){
  const ring = document.getElementById('ring');
  if (!ring) return;
  ring.innerHTML = '';
  RING.cards.length = 0;
  for (let i=0;i<RING.N;i++){
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = creative(SHOTS[i % SHOTS.length]) + '<div class="edge"></div>';
    const img = card.querySelector('img');
    if (img) img.addEventListener('error', ()=> card.classList.add('broken'));
    ring.appendChild(card);
    RING.cards.push(card);
  }
}

/* ---- which creative faces the camera; the mini-booker features its cut ---- */
const frontListeners = new Set();
let lastFrontCut = -1;
export function onFrontChange(fn){ frontListeners.add(fn); }
function frontIndex(){
  let best = 0, bestA = 999;
  for (let i=0;i<RING.N;i++){
    const a = ((i*RING.step + RING.phase) % 360 + 540) % 360 - 180;
    if (Math.abs(a) < bestA){ bestA = Math.abs(a); best = i; }
  }
  return best;
}
/** The CUTS index currently nearest the camera. */
export function frontCut(){ return SHOTS[frontIndex() % SHOTS.length].cut; }

export function placeCards(){
  const cards = RING.cards;
  for (let i=0;i<cards.length;i++){
    const a = ((i*RING.step + RING.phase) % 360 + 540) % 360 - 180;
    const el = cards[i];
    if (Math.abs(a) > RING.cull){ el.style.visibility='hidden'; continue; }
    el.style.visibility='visible';
    const r = a*Math.PI/180, c = Math.cos(r);
    el.style.transform = 'translate3d(' + (RING.R*Math.sin(r)).toFixed(2) + 'px,0,' + (RING.R*(1-c)).toFixed(2) + 'px) rotateY(' + (-a).toFixed(3) + 'deg)';
    el.style.filter = 'brightness(' + (0.84 + 0.5*(1/c - 1)).toFixed(3) + ')';
    el.style.zIndex = Math.round(1000 - Math.abs(a));
  }
  const cut = frontCut();
  if (cut !== lastFrontCut){
    lastFrontCut = cut;
    frontListeners.forEach(fn=> fn(cut));
  }
}

function tick(t){
  const dt = Math.min((t - RING.last)/1000, 0.1);
  RING.last = t;
  RING.phase -= RING.speed * dt;
  placeCards();
  if (RING.running) RING.rafId = requestAnimationFrame(tick);
}
export function startRing(){
  if (RING.running || reduceMotion) return;
  RING.running = true; RING.last = performance.now();
  RING.rafId = requestAnimationFrame(tick);
}
export function stopRing(){ RING.running = false; cancelAnimationFrame(RING.rafId); }
