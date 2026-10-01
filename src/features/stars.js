/* ============================================================
   STARFIELDS — one box-shadow per star on a 1px element.
   ============================================================ */
export function stars(el, n, blur, aMin, aMax){
  if (!el) return;
  const parts = [];
  for (let i=0;i<n;i++){
    const x = (Math.random()*100).toFixed(2) + 'vw';
    const y = (Math.random()*100).toFixed(2) + 'vh';
    const a = (aMin + Math.random()*(aMax-aMin)).toFixed(3);
    parts.push(x + ' ' + y + ' ' + blur + 'px 0 rgba(255,255,255,' + a + ')');
  }
  el.style.boxShadow = parts.join(',');
}
