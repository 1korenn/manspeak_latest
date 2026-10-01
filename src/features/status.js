/* ============================================================
   OPEN / NEXT-SLOT status — the hero chip and the final CTA line.
   ============================================================ */
import { CONFIG } from '../config.js';
import { dayKey, fmtTime, isOpenNow } from '../lib/schedule.js';
import { nextOpeningStr, firstOpenSlot } from '../lib/availability.js';

export function updateOpenChip(){
  const dot = document.getElementById('liveDot');
  const txt = document.getElementById('openNow');
  const next = document.getElementById('nextSlot');
  if (dot) dot.classList.toggle('off', !isOpenNow());
  if (txt) txt.textContent = nextOpeningStr();
  if (next){
    const f = firstOpenSlot();
    if (!f){ next.textContent = 'later this week'; return; }
    const df = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'long'});
    const label = f.day.key === dayKey(0).key ? 'today' : f.day.key === dayKey(1).key ? 'tomorrow' : df.format(f.day.date);
    next.textContent = label + ', ' + fmtTime(f.slot);
  }
}
