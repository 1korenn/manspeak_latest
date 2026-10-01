/* ============================================================
   HERO PARALLAX — same engine as the reference: the hero is a pinned
   background while .sheet scrolls over it. Smoothed scroll (lerp .15)
   drives each layer up at its own rate; the copy fades out by 150px.
   ============================================================ */
const RATES = { desk: { h1:.4, sub:.25, cta:.15 }, phone: { h1:.3, sub:.2, cta:.1 } };

export function initParallax(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.getElementById('hero');
  if (!hero) return;
  const q = (s)=> [...hero.querySelectorAll(s)];
  const L = { h1:q('.h1'), sub:q('.sub, .where'), cta:q('.ctas'), badge:q('.badge'),
              ring:q('.ring-stage'), clip:q('.clipper-stage') };

  let cur = 0, raf = 0, touched = false;
  const set = (els, y, o)=> els.forEach(el=>{
    el.style.translate = '0 ' + y.toFixed(1) + 'px';
    if (o != null){ el.style.opacity = o; el.style.pointerEvents = o < .05 ? 'none' : ''; }
  });

  function frame(){
    const target = window.scrollY;
    cur += (target - cur) * 0.15;
    if (Math.abs(target - cur) < 0.3) cur = target;
    // don't fight the entrance timeline until the user actually scrolls
    if (!touched && cur < 0.5){ raf = 0; return; }
    touched = true;
    const r = innerWidth <= 700 ? RATES.phone : RATES.desk;
    const fade = Math.max(0, 1 - cur / 150);
    set(L.h1,  -cur * r.h1,  fade);
    set(L.sub, -cur * r.sub, fade);
    set(L.cta, -cur * r.cta, fade);
    set(L.badge, 0, Math.max(0, 1 - cur / 100));
    set(L.ring, -cur * 0.15);
    set(L.clip, -target * 0.15);          // clipper uses raw scroll, as in the reference
    raf = cur === target ? 0 : requestAnimationFrame(frame);
  }
  const kick = ()=>{ if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  kick();
}
