/* Small helpers shared by the /api functions. */

export function send(res, status, body){
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).end(JSON.stringify(body));
}

/** Vercel parses JSON bodies for us; fall back to parsing a string body. */
export function readJson(req){
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch(e){ return null; }
}

export function notConfigured(res){
  return send(res, 503, { error: 'Booking backend not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
}
