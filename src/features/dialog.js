/* ============================================================
   HAIRCUT DETAIL DIALOG — opened by the router for #cut/<slug>.
   ============================================================ */
import { CATS, CUTS } from '../data/cuts.js';
import { portrait } from '../lib/portrait.js';

let dlgCurrent = null, dlgPhotoIdx = 0;
export function openCut(slug, pushHash){
  const c = CUTS.find(x => x.slug === slug);
  if (!c) return;
  const dlg = document.getElementById('cutDlg');
  if (!dlg) return;
  dlgCurrent = c; dlgPhotoIdx = 0;
  document.getElementById('dlgTitle').textContent = c.name;
  document.getElementById('dlgLede').textContent = c.lede;
  document.getElementById('dlgMins').textContent = c.mins + ' minutes';
  document.getElementById('dlgLasts').textContent = c.lasts;
  document.getElementById('dlgBest').textContent = c.bestFor;
  document.getElementById('dlgAsk').textContent = c.ask;
  const tags = document.getElementById('dlgTags');
  tags.innerHTML = c.cats.map(k => '<span class="tag">' + CATS[k] + '</span>').join('') + (c.tag ? '<span class="tag hot">' + c.tag + '</span>' : '');
  document.getElementById('dlgBook').href = '#book?cut=' + c.slug;

  // gallery: 4 illustrations (front, detail, back, front-alt seed)
  const gal = document.getElementById('gal');
  const thumbs = document.getElementById('thumbs');
  const views = ['front','detail','back','front'];
  gal.innerHTML = ''; thumbs.innerHTML = '';
  views.forEach((v, i)=>{
    const slide = document.createElement('div');
    slide.className = 'slide';
    slide.innerHTML = '<img alt="' + c.name + ', ' + v + ' view" src="' + portrait(v==='front' && i===3 ? Object.assign({}, c, {seed:(c.seed||7)+13}) : c, v) + '">';
    gal.appendChild(slide);
    const t = document.createElement('button');
    t.type='button'; t.className='thumb'; t.setAttribute('aria-label','Photo ' + (i+1));
    t.innerHTML = '<img alt="" src="' + portrait(v==='front' && i===3 ? Object.assign({}, c, {seed:(c.seed||7)+13}) : c, v==='back'?'back':(v==='detail'?'detail':'front')) + '">';
    t.setAttribute('aria-current', i===0 ? 'true':'false');
    t.addEventListener('click', ()=> scrollGalTo(i));
    thumbs.appendChild(t);
  });
  gal.scrollLeft = 0;

  // prev/next cut nav
  const idx = CUTS.indexOf(c);
  const prev = CUTS[(idx - 1 + CUTS.length) % CUTS.length];
  const next = CUTS[(idx + 1) % CUTS.length];
  const pEl = document.getElementById('dlgPrevCut'); const nEl = document.getElementById('dlgNextCut');
  pEl.href = '#cut/' + prev.slug; pEl.querySelector('span').textContent = prev.name;
  nEl.href = '#cut/' + next.slug; nEl.querySelector('span').textContent = next.name;

  if (!dlg.open) dlg.showModal();
  if (pushHash && location.hash !== '#cut/' + c.slug) history.replaceState(null, '', '#cut/' + c.slug);
}
function scrollGalTo(i){
  const gal = document.getElementById('gal');
  const slides = gal.querySelectorAll('.slide');
  if (!slides[i]) return;
  gal.scrollTo({ left: slides[i].offsetLeft, behavior:'smooth' });
  dlgPhotoIdx = i;
  document.querySelectorAll('#thumbs .thumb').forEach((t,idx)=> t.setAttribute('aria-current', idx===i ? 'true':'false'));
}
export function closeCutDlg(){
  const dlg = document.getElementById('cutDlg');
  if (dlg && dlg.open) dlg.close();
  if (location.hash && location.hash.indexOf('#cut/') === 0){
    history.replaceState(null, '', '#cuts');
  }
}
export function initDialog(){
  const dlg = document.getElementById('cutDlg');
  if (!dlg) return;
  document.getElementById('dlgClose').addEventListener('click', closeCutDlg);
  dlg.addEventListener('click', (e)=>{
    // click on backdrop (dialog itself, not children)
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
      closeCutDlg();
    }
  });
  dlg.addEventListener('close', ()=>{
    if (location.hash && location.hash.indexOf('#cut/') === 0){
      history.replaceState(null, '', '#cuts');
    }
  });
  document.getElementById('galPrev').addEventListener('click', ()=> scrollGalTo(Math.max(0, dlgPhotoIdx - 1)));
  document.getElementById('galNext').addEventListener('click', ()=> {
    const n = document.querySelectorAll('#gal .slide').length;
    scrollGalTo(Math.min(n-1, dlgPhotoIdx + 1));
  });
  const gal = document.getElementById('gal');
  gal.addEventListener('scroll', ()=>{
    const w = gal.clientWidth;
    const i = Math.round(gal.scrollLeft / w);
    if (i !== dlgPhotoIdx){
      dlgPhotoIdx = i;
      document.querySelectorAll('#thumbs .thumb').forEach((t,idx)=> t.setAttribute('aria-current', idx===i ? 'true':'false'));
    }
  }, { passive: true });
  gal.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft') { e.preventDefault(); scrollGalTo(Math.max(0, dlgPhotoIdx - 1)); }
    if (e.key === 'ArrowRight'){ e.preventDefault(); const n = document.querySelectorAll('#gal .slide').length; scrollGalTo(Math.min(n-1, dlgPhotoIdx + 1)); }
  });
  document.getElementById('dlgPrevCut').addEventListener('click', (e)=>{
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    location.hash = href.substring(1);
  });
  document.getElementById('dlgNextCut').addEventListener('click', (e)=>{
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    location.hash = href.substring(1);
  });
}

