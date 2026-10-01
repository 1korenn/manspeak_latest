/* ============================================================
   MINI-BOOKER — the live booking widget inside the hero's browser
   mock. Features whichever cut is facing the camera on the ring,
   and deep-links into the full booking page with day/time/cut set.
   ============================================================ */
import { CONFIG } from '../config.js';
import { CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';
import { dayKey, fmtShort } from '../lib/schedule.js';
import { slotsFor } from '../lib/availability.js';
import { onFrontChange } from './ring.js';

let selDay = 0;
let featured = 0;            // CUTS index shown in the side panel

function showFeatured(cutIdx){
  featured = cutIdx;
  const c = CUTS[cutIdx];
  const pic = document.getElementById('mbPic');
  const name = document.getElementById('mbCut');
  if (pic) pic.src = portrait(c, 'front');
  if (name) name.textContent = c.name;
  updateLinks();
}

function updateLinks(){
  const d = dayKey(selDay);
  const slots = slotsFor(d);
  const slug = CUTS[featured].slug;
  document.querySelectorAll('#mbTimes .mb-time').forEach(a=>{
    a.href = '#book?date=' + d.key + '&time=' + a.dataset.min + '&cut=' + slug;
  });
  const go = document.getElementById('mbGo');
  if (go) go.href = '#book?cut=' + slug + (slots[0] != null ? '&date=' + d.key + '&time=' + slots[0] : '');
}

export function renderMiniBooker(){
  const daysWrap = document.getElementById('mbDays');
  const timesWrap = document.getElementById('mbTimes');
  if (!daysWrap || !timesWrap) return;
  const monthEl = document.getElementById('mbMonth');
  const countEl = document.getElementById('mbCount');

  daysWrap.innerHTML = '';
  const dfmt = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'short'});
  for (let i=0;i<7;i++){
    const d = dayKey(i);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mb-day';
    b.setAttribute('aria-pressed', i===selDay ? 'true':'false');
    b.innerHTML = '<span>' + (i===0 ? 'Today' : dfmt.format(d.date).slice(0,3)) + '</span><b>' + d.d + '</b>';
    b.addEventListener('click', ()=>{ selDay = i; renderMiniBooker(); });
    daysWrap.appendChild(b);
  }

  const d = dayKey(selDay);
  if (monthEl) monthEl.textContent = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, month:'short', year:'numeric'}).format(d.date);
  const slots = slotsFor(d);
  timesWrap.innerHTML = '';
  if (!slots.length){
    timesWrap.innerHTML = '<span class="mb-empty">Fully booked · try another day</span>';
  } else {
    slots.slice(0, 8).forEach(m=>{
      const a = document.createElement('a');
      a.className = 'mb-time';
      a.dataset.min = String(m);
      a.textContent = fmtShort(m);
      timesWrap.appendChild(a);
    });
  }
  if (countEl) countEl.textContent = slots.length + (slots.length === 1 ? ' slot' : ' slots');
  updateLinks();
}

export function initMiniBooker(){
  onFrontChange(showFeatured);
  showFeatured(0);
  renderMiniBooker();
}
