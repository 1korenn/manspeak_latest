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
  window.addEventListener('resize', ()=>{
    if (window.innerWidth > 860 && nav.classList.contains('open')) setOpen(false);
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

