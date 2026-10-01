/* ============================================================
   ROUTER — three views on one page, driven by the URL hash:
     #book?date=&time=&cut=   booking view
     #cut/<slug>              home + haircut dialog
     #<section-id> / empty    home, scrolled to the section
   Hash routing means Vercel needs no rewrites.
   ============================================================ */
import { CONFIG } from '../config.js';
import { openCut } from './dialog.js';
import { prefillBooking } from './booking.js';
import { setHomeActive } from './hero.js';

function parseHash(){
  const h = (location.hash || '').replace(/^#/, '');
  if (!h) return { name:'home' };
  if (h === 'top' || h === 'home') return { name:'home' };
  if (h.indexOf('cut/') === 0) return { name:'cut', slug: h.slice(4) };
  if (h.indexOf('book') === 0){
    const q = {};
    const qIdx = h.indexOf('?');
    if (qIdx > -1){
      h.slice(qIdx+1).split('&').forEach(p=>{
        const [k,v] = p.split('=');
        if (k) q[k] = decodeURIComponent(v||'');
      });
    }
    return { name:'book', q };
  }
  return { name:'section', id: h };
}
function showHome(){
  document.getElementById('view-home').hidden = false;
  document.getElementById('view-book').hidden = true;
  document.body.classList.add('viewing-home');
  document.body.classList.remove('booking');
  document.title = CONFIG.business + ' — Main character haircuts for students';
  setHomeActive(true);
}
function showBooking(q){
  document.getElementById('view-home').hidden = true;
  document.getElementById('view-book').hidden = false;
  document.body.classList.remove('viewing-home');
  document.body.classList.add('booking');
  document.title = 'Book your chair · ' + CONFIG.business;
  setHomeActive(false);
  prefillBooking(q || {});
  // focus the heading for screen readers
  const t = document.getElementById('bookTitle');
  if (t) t.focus({ preventScroll:false });
  window.scrollTo({top:0, behavior:'auto'});
}
export function route(){
  const r = parseHash();
  if (r.name === 'book'){
    // ensure any open dialog closes
    const dlg = document.getElementById('cutDlg');
    if (dlg && dlg.open) dlg.close();
    showBooking(r.q);
    return;
  }
  // home view for everything else
  const wasBook = !document.getElementById('view-book').hidden;
  showHome();
  if (r.name === 'cut'){
    openCut(r.slug, false);
    return;
  }
  const dlg = document.getElementById('cutDlg');
  if (dlg && dlg.open) dlg.close();
  if (r.name === 'section'){
    const el = document.getElementById(r.id);
    if (el){
      // let layout settle if we just switched views
      setTimeout(()=> el.scrollIntoView({behavior: wasBook ? 'auto' : 'smooth', block:'start'}), wasBook ? 0 : 0);
    }
  } else if (r.name === 'home' && wasBook){
    window.scrollTo({top:0, behavior:'auto'});
  }
}
export function initRouter(){
  window.addEventListener('hashchange', route);
  route();
}

