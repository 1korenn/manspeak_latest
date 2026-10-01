/* ============================================================
   GET /api/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
   → { taken: { 'YYYY-MM-DD': [600, 630, …] } }
   Returns only dates and start minutes, never customer details.
   ============================================================ */
import { getSupabase } from './_lib/supabase.js';
import { send, notConfigured } from './_lib/http.js';
import { bookingWindow } from '../src/lib/schedule.js';
import { isDayKey } from '../src/lib/validate.js';

export default async function handler(req, res){
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });

  const win = bookingWindow();
  const from = isDayKey(req.query.from) ? req.query.from : win.from;
  const to   = isDayKey(req.query.to)   ? req.query.to   : win.to;

  const db = getSupabase();
  if (!db) return notConfigured(res);

  const { data, error } = await db
    .from('bookings')
    .select('booking_date, start_min')
    .eq('status', 'confirmed')
    .gte('booking_date', from)
    .lte('booking_date', to);

  if (error){
    console.error('slots query failed', error);
    return send(res, 500, { error: 'Could not load availability.' });
  }

  const taken = {};
  for (const row of data){
    (taken[row.booking_date] = taken[row.booking_date] || []).push(row.start_min);
  }
  res.setHeader('Cache-Control', 'no-store');
  return send(res, 200, { taken });
}
