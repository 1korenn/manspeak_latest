/* ============================================================
   ENTRANCE TIMELINE — plays once, then the page is still.
   Uses translate/scale/clip-path (not transform) so it does not
   fight the ring-loop transforms on .card.
   ============================================================ */
export function runEntrance(){
  const root = document.documentElement;
  const settle = ()=>{
    try {
      document.getAnimations && document.getAnimations().forEach(a=>{
        if (a.id && a.id.indexOf('intro:') === 0) a.cancel();
      });
    } catch(e){}
    root.classList.remove('intro');
  };
  if (!root.classList.contains('intro')) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches){ settle(); return; }
  if (!Element.prototype.animate){ settle(); return; }
  // if we're not on the home view, don't animate; just settle.
  if (document.getElementById('view-book') && !document.getElementById('view-book').hidden){ settle(); return; }

  const D = window.innerWidth <= 700 ? 0.66 : 1;
  const EXPO = 'cubic-bezier(.16,1,.3,1)';
  const SOFT = 'cubic-bezier(.22,.61,.36,1)';
  const Y = (px)=> '0 ' + (px*D).toFixed(2) + 'px';
  let n = 0, last = null;

  const play = (el, from, dur, delay, ease)=>{
    if (!el) return null;
    const to = { opacity: 1 };
    if ('translate' in from) to.translate = '0 0';
    if ('scale' in from) to.scale = '1';
    if ('clipPath' in from) to.clipPath = 'inset(-30% 0 -30% 0)';
    try {
      const a = el.animate([from, to], { duration: dur, delay: delay, easing: ease, fill: 'both' });
      a.id = 'intro:' + (n++);
      last = a;
      return a;
    } catch(e){ return null; }
  };

  const q = (s)=> document.querySelector(s);
  const qa = (s)=> Array.from(document.querySelectorAll(s));

  play(q('#nav'),   { opacity:0, translate: Y(-9) }, 620,  60, EXPO);
  play(q('.brand .mark'), { opacity:0, translate: Y(6) }, 520, 150, SOFT);
  play(q('.brand .wm'),   { opacity:0, translate: Y(6) }, 520, 185, SOFT);
  qa('#links a').forEach((el, i)=> play(el, { opacity:0, translate: Y(6) }, 460, 215 + i*45, SOFT));
  play(q('.burger'), { opacity:0, translate: Y(6) }, 460, 300, SOFT);
  play(q('.nav .btn'), { opacity:0, translate: Y(6) }, 500, 400, SOFT);

  play(q('.badge'), { opacity:0, translate: Y(11), scale: '.985' }, 560, 270, EXPO);
  play(q('#h1a'),   { opacity:0, translate: Y(15), clipPath: 'inset(100% 0 -30% 0)' }, 900, 380, EXPO);
  play(q('#h1b'),   { opacity:0, translate: Y(15), clipPath: 'inset(100% 0 -30% 0)' }, 900, 470, EXPO);
  play(q('.sub'),   { opacity:0, translate: Y(10) }, 620, 690, EXPO);
  play(q('.where'), { opacity:0, translate: Y(10) }, 620, 745, EXPO);
  play(q('.ctas'),  { opacity:0, translate: Y(13), scale: '.985' }, 620, 830, EXPO);

  play(q('.ring'),    { opacity:0, translate: Y(18), scale: '.99' }, 950, 700, EXPO);
  play(q('.mock'),    { opacity:0, translate: Y(26) }, 900, 900, EXPO);
  play(q('.clipper-stage'), { opacity:0, scale: '.94' }, 1200, 800, EXPO);
  play(q('.fab'),     { opacity:0, scale: '.88' }, 500, 1260, EXPO);

  if (last && last.finished){
    last.finished.then(settle).catch(settle);
  } else {
    setTimeout(settle, 2500);
  }
}

