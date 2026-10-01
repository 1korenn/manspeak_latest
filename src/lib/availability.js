/* ============================================================
   AVAILABILITY — a client-side cache of taken slots for the
   booking window, so every view can ask "what's open?" synchronously.
   Call refreshAvailability() to reload it from the API.
   ============================================================ */
import { CONFIG } from '../config.js';
import { fetchTaken } from './api.js';
import { bookingWindow, dayKey, openSlots, isOpenNow, fmtTime } from './schedule.js';

const taken = new Map();           // 'yyyy-mm-dd' -> Set<minutes>
const listeners = new Set();

export function onAvailabilityChange(fn){ listeners.add(fn); return ()=> listeners.delete(fn); }
const notify = ()=> listeners.forEach(fn=>{ try { fn(); } catch(e){ console.error(e); } });

export async function refreshAvailability(){
  const w = bookingWindow();
  try {
    const res = await fetchTaken(w.from, w.to);
    taken.clear();
    Object.keys(res).forEach(k=> taken.set(k, new Set(res[k])));
  } catch(e){
    console.warn('MansPeak: could not load availability, showing all hours as open.', e);
  }
  notify();
}

/** Mark a slot as taken locally right after a successful booking. */
export function markTaken(key, mins){
  if (!taken.has(key)) taken.set(key, new Set());
  taken.get(key).add(mins);
  notify();
}

/** Open slots for a day object from dayKey(), or anything with a .key */
export function slotsFor(day){ return openSlots(day.key, taken.get(day.key)); }

export function firstOpenSlot(){
  for (let i=0;i<CONFIG.daysAhead;i++){
    const d = dayKey(i);
    const s = slotsFor(d);
    if (s.length) return { day:d, slot:s[0] };
  }
  return null;
}

export function nextOpeningStr(){
  if (isOpenNow()) return 'Open now until ' + fmtTime(CONFIG.closeHour*60);
  for (let i=0;i<CONFIG.daysAhead;i++){
    const d = dayKey(i);
    const s = slotsFor(d);
    if (s.length){
      const dayName = new Intl.DateTimeFormat('en-US',{timeZone:CONFIG.timeZone, weekday:'long'}).format(d.date);
      const first = fmtTime(s[0]);
      if (i===0) return 'Opens today at ' + first;
      if (i===1) return 'Opens tomorrow at ' + first;
      return 'Opens ' + dayName + ' at ' + first;
    }
  }
  return CONFIG.hours;
}
