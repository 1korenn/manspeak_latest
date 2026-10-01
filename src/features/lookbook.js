/* ============================================================
   LOOKBOOK — the cut menu grid with category filters.
   Each card links to #cut/<slug>, which the router opens as a dialog.
   ============================================================ */
import { peso } from '../config.js';
import { CATS, CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';

let activeFilter = 'all';
export function renderFilters(){
  const wrap = document.getElementById('filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  Object.keys(CATS).forEach(k=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'filter';
    b.setAttribute('aria-pressed', k===activeFilter ? 'true' : 'false');
    b.textContent = CATS[k];
    b.addEventListener('click', ()=>{
      activeFilter = k;
      wrap.querySelectorAll('button').forEach(x=> x.setAttribute('aria-pressed', x===b ? 'true':'false'));
      applyFilter();
    });
    wrap.appendChild(b);
  });
}
export function renderLookbook(){
  const ul = document.getElementById('lookbook');
  if (!ul) return;
  ul.innerHTML = '';
  CUTS.forEach(c=>{
    const li = document.createElement('li');
    li.className = 'look';
    li.dataset.cats = c.cats.join(' ');
    li.innerHTML =
      '<a class="look" href="#cut/' + c.slug + '" aria-label="View ' + c.name + ' details">' +
        '<img alt="' + c.name + ' portrait" loading="lazy" src="' + portrait(c,'front') + '">' +
        '<span class="scrim"></span>' +
        (c.tag ? '<span class="tag"><span class="dot"></span>' + c.tag + '</span>' : '') +
        '<span class="more" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-expand"/></svg></span>' +
        '<span class="cap">' +
          '<span class="nm">' + c.name + '</span>' +
          '<span class="mt"><span>' + peso() + '</span><span>' + c.mins + ' min</span></span>' +
        '</span>' +
      '</a>';
    ul.appendChild(li);
  });
}
export function applyFilter(){
  const ul = document.getElementById('lookbook');
  if (!ul) return;
  const items = ul.querySelectorAll('.look');
  let shown = 0;
  items.forEach(li=>{
    const cats = (li.dataset.cats||'').split(' ');
    const on = activeFilter==='all' || cats.indexOf(activeFilter)>-1;
    li.hidden = !on;
    if (on) shown++;
  });
  const status = document.getElementById('filterStatus');
  if (status) status.textContent = shown + ' cuts shown';
}
