/* ============================================================
   POST /api/bookings
   body: { name, phone, email, cut, date, time, notes }
   201 → { ref, price, smsSent }
   400 → { error, fields: { name?, phone?, email?, cut?, date?, time? } }
   409 → { error }   slot already taken (enforced by a unique index)

   Everything is re-validated here with the same rules the browser
   uses (src/lib/schedule.js, src/lib/validate.js). The price is set
   by the server, never taken from the request.
   ============================================================ */
import { randomInt } from 'node:crypto';
import { getSupabase } from './_lib/supabase.js';
import { send, readJson, notConfigured } from './_lib/http.js';
import { CONFIG } from '../src/config.js';
import { CUTS } from '../src/data/cuts.js';
import { bookingWindow, openSlots, allSlots, fmtTime, fmtDateLong } from '../src/lib/schedule.js';
import { normalizePhonePH, validEmail, isDayKey } from '../src/lib/validate.js';

const UNSURE = { slug: '__unsure', name: 'To decide in the chair' };
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // no 0/O/1/I
const makeRef = ()=> 'MP-' + Array.from({ length: 5 }, ()=> REF_CHARS[randomInt(REF_CHARS.length)]).join('');

function validate(b){
  const fields = {};
  const name = String(b.name || '').trim();
  if (!name || name.length > 120) fields.name = 'Tell us your name.';
  const phone = normalizePhonePH(b.phone);
  if (!phone) fields.phone = 'Use a PH mobile number, like 0912 345 6789.';
  const email = String(b.email || '').trim();
  if (!validEmail(email) || email.length > 200) fields.email = 'Double-check the email.';
  const cut = b.cut === UNSURE.slug ? UNSURE : CUTS.find(c=> c.slug === b.cut);
  if (!cut) fields.cut = 'Pick a cut from the menu.';

  const date = String(b.date || '');
  const time = Number(b.time);
  const win = bookingWindow();
  if (!isDayKey(date) || date < win.from || date > win.to) fields.date = 'Pick a day within the next ' + CONFIG.daysAhead + ' days.';
  else if (!allSlots().includes(time)) fields.time = 'Pick one of the listed times.';
  else if (!openSlots(date).includes(time)) fields.time = 'That time has already passed. Pick a later slot.';

  const notes = String(b.notes || '').trim().slice(0, 500);
  return { fields, value: { name, phone, email, cut, date, time, notes } };
}

export default async function handler(req, res){
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  const body = readJson(req);
  if (!body) return send(res, 400, { error: 'Invalid JSON.', fields: {} });

  const { fields, value } = validate(body);
  if (Object.keys(fields).length) return send(res, 400, { error: 'A few things need a look.', fields });

  const db = getSupabase();
  if (!db) return notConfigured(res);

  const row = {
    name: value.name,
    phone: value.phone.e164,
    email: value.email,
    cut_slug: value.cut.slug,
    cut_name: value.cut.name,
    booking_date: value.date,
    start_min: value.time,
    price: CONFIG.price,
    notes: value.notes || null
  };

  // retry once on the (very unlikely) chance of a duplicate ref
  for (let attempt = 0; attempt < 2; attempt++){
    const ref = makeRef();
    const { error } = await db.from('bookings').insert({ ...row, ref });
    if (!error){
      const smsSent = await sendConfirmation({ ...value, ref });
      return send(res, 201, { ref, price: CONFIG.price, smsSent });
    }
    if (error.code === '23505' && /one_per_slot/.test(error.message + (error.details || ''))){
      return send(res, 409, { error: 'That slot was just taken.' });
    }
    if (error.code !== '23505'){
      console.error('booking insert failed', error);
      return send(res, 500, { error: 'Could not save the booking.' });
    }
  }
  return send(res, 500, { error: 'Could not save the booking.' });
}

/* ------------------------------------------------------------
   SMS CONFIRMATION — TODO when you're ready.
   Example with Semaphore (PH): set SEMAPHORE_KEY and SEMAPHORE_SENDER,
   then uncomment. Returns true only if the provider accepted it.
   Never let an SMS failure fail the booking: it's already saved.
   ------------------------------------------------------------ */
async function sendConfirmation(b){
  if (!process.env.SEMAPHORE_KEY) return false;
  const first = b.name.split(' ')[0] || 'friend';
  const message = 'Hi ' + first + '! Your ' + CONFIG.business + ' booking is confirmed for ' +
    fmtDateLong(b.date) + ' at ' + fmtTime(b.time) + '. Cut: ' + b.cut.name + '. Ref: ' + b.ref + '. Reply here if plans change.';
  try {
    const form = new URLSearchParams({
      apikey: process.env.SEMAPHORE_KEY,
      number: b.phone.e164,
      message,
      sendername: process.env.SEMAPHORE_SENDER || ''
    });
    const r = await fetch('https://api.semaphore.co/api/v4/messages', { method: 'POST', body: form });
    return r.ok;
  } catch(e){
    console.error('sms failed', e);
    return false;
  }
}
