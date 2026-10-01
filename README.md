# MansPeak Barbershop

Landing page and booking flow for MansPeak. **Vite + vanilla JS** on the front end, **Vercel functions** in `/api`, **Supabase** (Postgres) for bookings.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 — on-device demo mode, no backend needed
npm run build        # production build into dist/
```

To run the frontend and the `/api` functions together, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev           # serves the site and /api on one port
```

## Project layout

```
index.html                    all markup (home view, booking view, cut dialog)
public/favicon.svg
src/
  main.js                     boot: wires the features together
  config.js                   ← EDIT: shop name, contact, hours, price
  data/cuts.js                ← EDIT: the haircut menu
  styles/                     index.css imports these in order
    base.css                  palette tokens + reset
    buttons.css  nav.css  hero.css  sections.css  dialog.css  booking.css
    responsive.css
    motion.css                entrance timeline + hero parallax
  lib/                        no DOM, shared with /api where marked
    schedule.js     (shared)  timezone-safe slot rules
    validate.js     (shared)  PH phone + email checks
    api.js                    the only file that talks to a backend
    availability.js           cache of taken slots for the booking window
    portrait.js               illustrated haircut portraits (SVG)
  features/
    hero.js                   hero layout, motion controller, lazy 3D loader
    ring.js                   the 3D ring of cut cards
    clipper/                  the glass clipper (three.js): scene, geometry, shaders
    parallax.js               fallback for browsers without scroll-driven CSS
    mini-booker.js  status.js  lookbook.js  dialog.js  booking.js
    router.js  nav.js  entrance.js  content.js  stars.js
api/
  slots.js                    GET  /api/slots?from=&to=   taken slots (no personal data)
  bookings.js                 POST /api/bookings          validate + save + (optional) SMS
  _lib/                       server-only helpers (not routes)
supabase/migrations/0001_bookings.sql
```

## Palette

Four source colours, defined once in `src/styles/base.css`:

| Token | Hex | Use |
|---|---|---|
| `--amber` | `#ffbd59` | CTAs, highlights, focus rings |
| `--white` | `#ffffff` | headings, primary text |
| `--grey` | `#545454` | borders and dividers only (2.2:1 on the background, too faint for text) |
| `--void` | `#1e1d1d` | background |

Body copy uses `--mist` (#c0bfbf, 9.2:1) and `--dim` (#9a9999, 5.9:1), white mixed into the background. Solid amber surfaces take dark `--void` text (10:1); white on amber is only 1.7:1.

## Motion

- **Ring + clipper** run only while the home view is showing, the hero is on screen and the tab is visible.
- **Glass clipper** loads three.js after the page is idle (its own ~116 KB gzipped chunk). It is hidden if WebGL is unavailable. Drag-to-spin is enabled on screens over 1100px with a mouse or trackpad; elsewhere it just drifts, so it never blocks scrolling or taps.
- **Parallax**: CSS scroll-driven animations in `motion.css` (Chrome, Edge, Safari 26+); `parallax.js` covers Firefox.
- **`prefers-reduced-motion`** turns off the entrance, ring spin, clipper drift, scroll tilt and parallax.

## Going live with Supabase

1. Create a Supabase project. In the SQL editor, run `supabase/migrations/0001_bookings.sql`.
2. In Vercel → Project → Settings → Environment Variables, add:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only, never prefix with `VITE_`)
   - `VITE_API_MODE=live`
3. Redeploy. The booking page now reads taken slots from `/api/slots` and saves through `/api/bookings`.

How it stays safe:

- **Row-level security** is on with no policies. The browser can't touch the table; only the functions (service-role key) can.
- **Double bookings** are blocked by a unique index on `(booking_date, start_min)` for confirmed bookings. A clash returns 409 and the form asks the customer to pick another time.
- **Revalidation**: the server re-checks every field with the same rules as the browser and sets the price itself.

The schema assumes one chair. For more chairs, add a `chair` column and include it in the unique index.

### SMS confirmations (optional)

`api/bookings.js` has a `sendConfirmation()` hook using Semaphore. Set `SEMAPHORE_KEY` and `SEMAPHORE_SENDER` and it starts sending. An SMS failure never fails the booking.

## Mock mode

With `VITE_API_MODE=mock` (the default), bookings are kept in the visitor's own browser (`localStorage`) and no text is sent. Good for demos and design work; switch to `live` before taking real bookings.
