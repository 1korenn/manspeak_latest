/* ============================================================
   API CLIENT — the only place the frontend talks to a backend.

   VITE_API_MODE=mock (default)  everything runs on-device: bookings
                                 live in localStorage, no text is sent.
   VITE_API_MODE=live            calls the Vercel functions in /api,
                                 which read/write Supabase.

   Both modes return the same shapes, so nothing else in src/ needs
   to change when the backend goes live.
   ============================================================ */
import { CONFIG } from '../config.js';

export const API_MODE = import.meta.env.VITE_API_MODE === 'live' ? 'live' : 'mock';

export class ApiError extends Error {
  /** code: 'slot_taken' | 'invalid' | 'unavailable' | 'network' */
  constructor(code, message, fields){ super(message || code); this.code = code; this.fields = fields || {}; }
}

/* ---------------- mock backend (localStorage) ---------------- */
const LS_KEY = 'mp:bookings';
const readLocal = ()=>{ try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e){ return []; } };
const writeLocal = (arr)=>{ try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch(e){} };
const makeRef = ()=> 'MP-' + Math.floor(Math.random()*1679616).toString(36).toUpperCase().padStart(4,'0').slice(0,4);
const wait = (ms)=> new Promise(r=> setTimeout(r, ms));

const mock = {
  async taken(from, to){
    const out = {};
    readLocal().forEach(b=>{
      if (b.date < from || b.date > to) return;
      (out[b.date] = out[b.date] || []).push(b.time);
    });
    return out;
  },
  async book(input){
    await wait(700);
    const all = readLocal();
    if (all.some(b=> b.date === input.date && b.time === input.time)){
      throw new ApiError('slot_taken', 'That slot was just taken.');
    }
    const ref = makeRef();
    all.push({ date: input.date, time: input.time, ref });
    writeLocal(all);
    return { ref, price: CONFIG.price, smsSent: false };
  }
};

/* ---------------- live backend (/api → Supabase) ---------------- */
async function request(path, opts){
  let res;
  try { res = await fetch(path, opts); }
  catch(e){ throw new ApiError('network', 'Could not reach the booking server.'); }
  const data = await res.json().catch(()=> ({}));
  if (res.ok) return data;
  if (res.status === 409) throw new ApiError('slot_taken', data.error);
  if (res.status === 400) throw new ApiError('invalid', data.error, data.fields);
  throw new ApiError('unavailable', data.error || ('HTTP ' + res.status));
}

const live = {
  async taken(from, to){
    const data = await request('/api/slots?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
    return data.taken || {};
  },
  async book(input){
    return request('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
  }
};

const backend = API_MODE === 'live' ? live : mock;

/** Taken slot starts per day: { 'yyyy-mm-dd': [600, 630, …] } */
export const fetchTaken = (from, to) => backend.taken(from, to);

/**
 * Create a booking. input: { name, phone, email, cut, date, time, notes }
 * resolves { ref, price, smsSent } · rejects ApiError
 */
export const createBooking = (input) => backend.book(input);
