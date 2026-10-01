/* ============================================================
   CONFIG — EDIT THESE. Every value here is a placeholder.
   Shared by the browser bundle AND the Vercel functions in /api,
   so keep it plain data: no DOM, no import.meta.env.
   ============================================================ */
export const CONFIG = {
  business: 'MansPeak Barbershop',
  tagline:  'Main character haircuts for students',
  owner:    'Juan Dela Cruz',                 // EDIT: your name
  address:  '123 Your Street, Your City',     // EDIT: shop address
  mapQuery: 'MansPeak Barbershop',            // EDIT: what to search on Google Maps
  phone:    '+639123456789',                  // EDIT: E.164 mobile, no spaces
  phoneDisplay: '0912 345 6789',              // EDIT: how it should read on-screen
  email:    'hello@manspeak.ph',              // EDIT
  timeZone: 'Asia/Manila',
  utcOffsetHours: 8,   // Asia/Manila has no DST; used for calendar (.ics) times
  hours:    'Daily, 10:00 AM to 8:00 PM',
  openHour: 10,        // 24h; shop opens at this local hour
  closeHour: 20,       // last slot must END by this hour
  slotMins: 30,        // one slot = 30 minutes
  leadMins: 60,        // earliest booking = now + 60 minutes
  daysAhead: 14,       // how far ahead you can book
  price: 150,          // one flat price for every cut (₱)
  social: { facebook:'', instagram:'', tiktok:'' }    // EDIT: paste full URLs
};

export const peso = (n = CONFIG.price) => '₱' + n;
