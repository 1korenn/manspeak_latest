/* ============================================================
   NAV — burger panel on small screens, solid pill once scrolled,
   and the footer year.
   ============================================================ */
export function initBurger(){
  const nav = document.getElementById('nav');
  const burger = nav.querySelector('.burger');
  const menu = document.getElementById('navmenu');
  if (!burger) return;
  const setOpen = (open)=>{
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  burger.addEventListener('click', (e)=>{
    e.stopPropagation();
    setOpen(!nav.classList.contains('open'));
  });
  document.addEventListener('click', (e)=>{
    if (!nav.classList.contains('open')) return;
    if (nav.contains(e.target)) return;
    setOpen(false);
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && nav.classList.contains('open')){
      setOpen(false);
      burger.focus();
    }
  });
  menu.addEventListener('click', (e)=>{
    if (e.target.closest('a')) setOpen(false);
  });
    initActiveLink();
  window.addEventListener('resize', ()=>{
    if (window.innerWidth > 1000 && nav.classList.contains('open')) setOpen(false);
  });
}

export function initScrollFx(){
  const nav = document.getElementById('nav');
  const onScroll = ()=>{
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();
  const yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
}
/* Highlight the nav link for the section in view (Home when at the top). */
function initActiveLink(){
  const links = [...document.querySelectorAll('#links > li:not(.search-icon) > a[href^="#"]')].filter(a=> a.getAttribute('href').length > 1);
  const byId = new Map(links.map(a=> [a.getAttribute('href').slice(1), a]));
  const home = byId.get('top');
  const setActive = (a)=> links.forEach(x=>{
    const on = x === a; x.classList.toggle('active', on);
    if (on) x.setAttribute('aria-current','true'); else x.removeAttribute('aria-current');
  });
  const targets = [...byId.keys()].filter(id=> id !== 'top').map(id=> document.getElementById(id)).filter(Boolean);
  if (!('IntersectionObserver' in window) || !targets.length) return;
  const visible = new Set();
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(en=> en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id));
    const id = targets.map(t=> t.id).filter(x=> visible.has(x)).pop();
    setActive(id ? byId.get(id) : home);
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(t=> io.observe(t));
}

