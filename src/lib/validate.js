/* ============================================================
   VALIDATION — shared by the booking form and POST /api/bookings.
   ============================================================ */

/** Accepts 09XXXXXXXXX, 639XXXXXXXXX, +639XXXXXXXXX or 9XXXXXXXXX. */
export function normalizePhonePH(raw){
  const digits = (raw||'').replace(/\D+/g,'');
  let core = null;
  if (digits.length === 11 && digits.startsWith('09')) core = digits.slice(1);
  else if (digits.length === 12 && digits.startsWith('639')) core = digits.slice(2);
  else if (digits.length === 10 && digits.startsWith('9')) core = digits;
  if (!core) return null;
  const e164 = '+63' + core;
  const disp = '0' + core.slice(0,3) + ' ' + core.slice(3,6) + ' ' + core.slice(6);
  return { e164, disp };
}

export function validEmail(s){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s||''); }

export const isDayKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
