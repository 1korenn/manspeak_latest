/* ============================================================
   SHOP-TIME HELPERS — everything in the shop's timezone.
   Pure functions (no DOM, no storage) so the booking API can run
   the exact same slot rules on the server.
   We convert local wall-clock ↔ UTC using Intl.DateTimeFormat parts,
   so nothing depends on the visitor's (or server's) timezone.
   ============================================================ */
import { CONFIG } from '../config.js';

const _tzFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: CONFIG.timeZone, hourCycle:'h23',
  year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
});

/** {y,m,d,H,M} of a Date as seen in the shop's timezone */
export function tzParts(date){
  const parts = _tzFmt.formatToParts(date);
  const g = {}; parts.forEach(p=>{ if(p.type!=='literal') g[p.type]=p.value; });
  return { y:+g.year, m:+g.month, d:+g.day, H:+g.hour, M:+g.minute };
}

/** Day `offsetDays` from today-in-shop. Anchored at UTC noon so the date can't drift. */
export function dayKey(offsetDays, now = new Date()){
  const t = tzParts(now);
  const base = Date.UTC(t.y, t.m-1, t.d, 12, 0, 0);
  const d = new Date(base + offsetDays*86400000);
  const p = tzParts(d);
  return { key: p.y+'-'+String(p.m).padStart(2,'0')+'-'+String(p.d).padStart(2,'0'),
           y:p.y, m:p.m, d:p.d, date:d };
}

/** The bookable window as yyyy-mm-dd keys: today … today + daysAhead - 1 */
export function bookingWindow(now = new Date()){
  return { from: dayKey(0, now).key, to: dayKey(CONFIG.daysAhead - 1, now).key };
}

export function fmtTime(mins){
  let h = Math.floor(mins/60), m = mins%60, ap = h>=12 ? 'PM' : 'AM';
  h = h%12; if (h===0) h = 12;
  return h + ':' + String(m).padStart(2,'0') + ' ' + ap;
}
export function fmtShort(mins){
  let h = Math.floor(mins/60), m = mins%60, ap = h>=12 ? 'pm' : 'am';
  h = h%12; if (h===0) h = 12;
  return m===0 ? (h + ap) : (h + ':' + String(m).padStart(2,'0') + ap);
}
export function fmtDateLong(key){
  return new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'long', month:'short', day:'numeric'})
    .format(new Date(key + 'T12:00:00Z'));
}

/** Every slot start (minutes after midnight) in a day, ignoring bookings */
export function allSlots(){
  const arr = [];
  for (let m = CONFIG.openHour*60; m + CONFIG.slotMins <= CONFIG.closeHour*60; m += CONFIG.slotMins) arr.push(m);
  return arr;
}

/**
 * Bookable slots for a day: inside opening hours, past the lead time
 * if it's today, and not in `taken` (a Set of minutes).
 */
export function openSlots(key, taken = new Set(), now = new Date()){
  const todayKey = dayKey(0, now).key;
  const np = tzParts(now);
  const nowMins = np.H*60 + np.M;
  return allSlots().filter(m=>{
    if (key === todayKey && m < nowMins + CONFIG.leadMins) return false;
    if (taken.has(m)) return false;
    return true;
  });
}

export function isOpenNow(now = new Date()){
  const p = tzParts(now);
  const mins = p.H*60 + p.M;
  return mins >= CONFIG.openHour*60 && mins < CONFIG.closeHour*60;
}
