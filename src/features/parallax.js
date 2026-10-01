/* ============================================================
   PARALLAX FALLBACK — the hero parallax is pure CSS (motion.css)
   using scroll-driven animations. Browsers without them (Firefox
   today) get --hero-p, the hero's exit progress 0→1, from here.
   Only listens while the hero is on screen.
   ============================================================ */
export function initParallaxFallback(){
  if (window.CSS && CSS.supports('(animation-timeline: view()) and (animation-range: entry)')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.getElementById('hero');
  if (!hero) return;

  let queued = false;
  const update = ()=>{
    queued = false;
    const r = hero.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    hero.style.setProperty('--hero-p', p.toFixed(4));
  };
  const onScroll = ()=>{ if (!queued){ queued = true; requestAnimationFrame(update); } };

  new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if (en.isIntersecting) window.addEventListener('scroll', onScroll, { passive: true });
      else window.removeEventListener('scroll', onScroll);
    });
    update();
  }, { threshold: 0 }).observe(hero);
}
